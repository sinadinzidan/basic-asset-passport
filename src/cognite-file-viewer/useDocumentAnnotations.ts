import type { CogniteClient, EdgeDefinition } from '@cognite/sdk';
import { useQuery } from '@tanstack/react-query';

import { cdfTaskRunner } from '../lib/cdfTaskRunner';

import type {
  DocumentAnnotation,
  AnnotationResourceType,
  UseDocumentAnnotationsResult,
} from './types';

// ============================================================================
// CDM constants
// ============================================================================

const CDM_SPACE = 'cdf_cdm';
const CDM_VERSION = 'v1';
const DIAGRAM_ANNOTATION_VIEW = 'CogniteDiagramAnnotation';
const QUERY_LIMIT = 1000;

// ============================================================================
// Cache — stores ALL annotations for a file, filtered by page at read time
// ============================================================================

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50;

interface CacheEntry {
  data: DocumentAnnotation[];
  timestamp: number;
}

const annotationCache = new Map<string, CacheEntry>();

/** Cache key scoped by project + file instance. */
function fileCacheKey(project: string, space: string, externalId: string): string {
  return JSON.stringify([project, space, externalId]);
}

function evictStaleAnnotations(): void {
  const now = Date.now();
  for (const [key, entry] of annotationCache) {
    if (now - entry.timestamp > STALE_TIME) annotationCache.delete(key);
  }
  if (annotationCache.size > MAX_CACHE_SIZE) {
    for (const key of Array.from(annotationCache.keys()).slice(0, annotationCache.size - MAX_CACHE_SIZE)) {
      annotationCache.delete(key);
    }
  }
}

export function clearAnnotationCache(): void {
  annotationCache.clear();
}

// ============================================================================
// Helpers
// ============================================================================

interface CdmAnnotationProps {
  status?: string;
  startNodeText?: string;
  startNodeYMax?: number;
  startNodeYMin?: number;
  startNodeXMax?: number;
  startNodeXMin?: number;
  startNodePageNumber?: number;
}

function getResourceType(annotationType: string): AnnotationResourceType {
  const lower = annotationType.toLowerCase();
  if (lower.includes('asset')) return 'asset';
  if (lower.includes('file')) return 'file';
  if (lower.includes('timeseries') || lower.includes('time_series'))
    return 'timeSeries';
  if (lower.includes('sequence')) return 'sequence';
  if (lower.includes('event')) return 'event';
  if (lower.includes('diagram')) return 'diagram';
  return 'unknown';
}

// ============================================================================
// Fetcher — fetches ALL annotations for a file (not per-page)
// ============================================================================

async function fetchAllAnnotations(
  client: CogniteClient,
  space: string,
  externalId: string,
): Promise<DocumentAnnotation[]> {
  const containerId = `${space}:${externalId}`;
  const propPath = `${DIAGRAM_ANNOTATION_VIEW}/${CDM_VERSION}`;

  const allEdges: EdgeDefinition[] = [];
  let cursor: string | undefined;

  do {
    const response = await cdfTaskRunner.schedule(() => client.instances.query({
      with: {
        files: {
          nodes: {
            filter: {
              and: [
                {
                  equals: {
                    property: ['node', 'externalId'],
                    value: externalId,
                  },
                },
                {
                  equals: {
                    property: ['node', 'space'],
                    value: space,
                  },
                },
              ],
            },
          },
        },
        annotations: {
          edges: {
            from: 'files',
            direction: 'outwards',
          },
          limit: QUERY_LIMIT,
        },
      },
      select: {
        annotations: {
          sources: [
            {
              source: {
                externalId: DIAGRAM_ANNOTATION_VIEW,
                space: CDM_SPACE,
                type: 'view' as const,
                version: CDM_VERSION,
              },
              properties: [
                'status',
                'startNodeText',
                'startNodeYMax',
                'startNodeYMin',
                'startNodeXMax',
                'startNodeXMin',
                'startNodePageNumber',
              ],
            },
          ],
          limit: QUERY_LIMIT,
        },
      },
      cursors: cursor ? { annotations: cursor } : undefined,
    }));

    const results = response.items.annotations;
    if (!results) throw new Error('CDF query did not return the annotations result set.');
    const edges = results.filter(
      (a) => a.instanceType === 'edge',
    );
    allEdges.push(...edges);

    cursor = response.nextCursor?.annotations || undefined;
  } while (cursor);

  return allEdges.flatMap((edge) => {
    const props: CdmAnnotationProps | undefined =
      edge.properties?.[CDM_SPACE]?.[propPath];
    if (!props) return [];
    if (props.status === 'Rejected') return [];

    const xMin = Number(props.startNodeXMin ?? 0);
    const xMax = Number(props.startNodeXMax ?? 0);
    const yMin = Number(props.startNodeYMin ?? 0);
    const yMax = Number(props.startNodeYMax ?? 0);

    const annotationType =
      edge.type?.externalId ?? 'diagrams.AssetLink';

    const annotation: DocumentAnnotation = {
      id: `${containerId}-${edge.space}-${edge.externalId}`,
      x: Math.min(xMin, xMax),
      y: Math.min(yMin, yMax),
      width: Math.abs(xMax - xMin),
      height: Math.abs(yMax - yMin),
      page: Number(props.startNodePageNumber ?? 1),
      resourceType: getResourceType(annotationType),
      linkedResource: edge.endNode
        ? { space: edge.endNode.space, externalId: edge.endNode.externalId }
        : undefined,
      text: props.startNodeText ?? undefined,
      annotationType,
    };
    return [annotation];
  });
}

// ============================================================================
// Hook
// ============================================================================

function resolveEnabled(options?: { enabled?: boolean }): boolean {
  return options?.enabled ?? true;
}

function buildAnnotationsQuery(
  client: CogniteClient | undefined,
  instanceId: { space: string; externalId: string } | undefined,
  isEnabled: boolean,
) {
  const space = instanceId?.space;
  const externalId = instanceId?.externalId;
  const project = client?.project;

  return {
    queryKey: ['file-annotations', project, space, externalId],
    enabled: isEnabled && !!client && !!space && !!externalId && !!project,
    staleTime: STALE_TIME,
    queryFn: async () => {
      if (!client || !space || !externalId || !project) throw new Error('Missing file annotation context.');
      const key = fileCacheKey(project, space, externalId);
      const cached = annotationCache.get(key);
      if (cached && Date.now() - cached.timestamp < STALE_TIME) return cached.data;
      const data = await fetchAllAnnotations(client, space, externalId);
      annotationCache.set(key, { data, timestamp: Date.now() });
      evictStaleAnnotations();
      return data;
    },
  };
}

export function useDocumentAnnotations(
  client: CogniteClient | undefined,
  instanceId: { space: string; externalId: string } | undefined,
  currentPage: number = 1,
  options?: { enabled?: boolean },
): UseDocumentAnnotationsResult {
  const query = useQuery(buildAnnotationsQuery(client, instanceId, resolveEnabled(options)));

  const isEnabled = resolveEnabled(options);

  return {
    annotations: isEnabled ? (query.data ?? []).filter((annotation: DocumentAnnotation) => annotation.page === currentPage) : [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
