import type { CogniteClient } from '@cognite/sdk';
import { useState, useEffect, useMemo } from 'react';

import { resolveFileDownloadConfig } from './fileResolution';
import { inferMimeTypeFromUrl } from './mimeTypes';
import type { FileSource, UseFileResolverResult } from './types';

// ============================================================================
// Helpers
// ============================================================================

const INITIAL: UseFileResolverResult = {
  isLoading: true,
  error: null,
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Resolves a {@link FileSource} to a download URL and MIME type.
 *
 * - `url` sources are returned directly (no client needed).
 * - `internalId` and `instanceId` sources use the CogniteClient to fetch
 *   metadata and resolve a download URL (with caching).
 */
export function useFileResolver(
  input: FileSource,
  client?: CogniteClient,
): UseFileResolverResult {
  const [result, setResult] = useState<UseFileResolverResult>(INITIAL);

  const type = input.type;
  const id = input.type === 'internalId' ? input.id : 0;
  const space = input.type === 'instanceId' ? input.space : '';
  const externalId = input.type === 'instanceId' ? input.externalId : '';
  const url = input.type === 'url' ? input.url : '';
  const mimeType = input.type === 'url' ? input.mimeType : undefined;
  const source = useMemo<FileSource>(() => {
    if (type === 'internalId') return { type, id };
    if (type === 'instanceId') return { type, space, externalId };
    return { type, url, mimeType };
  }, [type, id, space, externalId, url, mimeType]);

  useEffect(() => {
    let isCancelled = false;

    async function resolve() {
      setResult(INITIAL);

      try {
        // ----- URL source: no client needed -----
        if (source.type === 'url') {
          const mimeType = source.mimeType ?? inferMimeTypeFromUrl(source.url);
          setResult({
            url: source.url,
            mimeType: mimeType ?? '',
            isLoading: false,
            error: null,
          });
          return;
        }

        // ----- CDF sources: client is required -----
        if (!client) {
          throw new Error(
            'CogniteClient is required for instanceId and internalId sources',
          );
        }

        // Build the lookup identifier the SDK expects
        const idParam =
          source.type === 'internalId'
            ? { id: source.id }
            : {
                instanceId: {
                  space: source.space,
                  externalId: source.externalId,
                },
              };

        const [fileInfo] = await client.files.retrieve([idParam]);
        if (isCancelled) return;
        if (!fileInfo) throw new Error('File content not found or not accessible in CDF.');

        const resolved = await resolveFileDownloadConfig(client, fileInfo);
        if (isCancelled) return;

        // Derive instanceId — prefer the one returned by the API,
        // fall back to what the caller passed for instanceId sources.
        const instanceId = fileInfo.instanceId
          ? {
              space: fileInfo.instanceId.space,
              externalId: fileInfo.instanceId.externalId,
            }
          : source.type === 'instanceId'
            ? { space: source.space, externalId: source.externalId }
            : undefined;

        setResult({
          url: resolved.url,
          mimeType: resolved.mimeType,
          fileInfo,
          instanceId,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        if (isCancelled) return;
        setResult({
          isLoading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    }

    void resolve();
    return () => { isCancelled = true; };
  }, [source, client]);

  return result;
}
