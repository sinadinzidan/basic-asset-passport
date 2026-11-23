import { createContext, useCallback, useContext, useEffect, useRef } from 'react';

import { createAssetLookup } from '../../../lib/three-d/assetLookup';
import { createSceneRenderer } from '../../../lib/three-d/sceneRenderer';
import { loadSectors } from '../../../lib/three-d/sectorLoader';
import type { ThreeDRenderer } from '../../../types/threeDRenderer';
import { useThreeDAssetNodes } from '../useThreeDAssetNodes';
import { useThreeDClient } from '../useThreeDClient';
import { useThreeDLoadProgress } from '../useThreeDLoadProgress';
import { useThreeDModel } from '../useThreeDModel';

const defaultDeps = { createRenderer: createSceneRenderer, loadSectors };

export type UseAssetThreeDViewModelContextType = typeof defaultDeps;
export const UseAssetThreeDViewModelContext =
  createContext<UseAssetThreeDViewModelContextType>(defaultDeps);

export function useAssetThreeDViewModel() {
  const { createRenderer, loadSectors: loadAllSectors } = useContext(
    UseAssetThreeDViewModelContext,
  );
  const client = useThreeDClient();
  const modelQuery = useThreeDModel();
  const { progress, setProgress, resetProgress } = useThreeDLoadProgress();
  const viewportReference = useRef<HTMLDivElement>(null);
  const rendererReference = useRef<ThreeDRenderer | null>(null);

  const assetNodes = useThreeDAssetNodes().data;

  const model = modelQuery.data;

  useEffect(() => {
    const container = viewportReference.current;

    if (!model || !container) return undefined;

    const controller = new AbortController();
    const renderer = createRenderer(container, model);

    rendererReference.current = renderer;

    resetProgress();
    void loadAllSectors({
      model,
      source: client,
      renderer,
      signal: controller.signal,
      onProgress: setProgress,
    });

    return () => {
      controller.abort();
      rendererReference.current = null;
      renderer.dispose();
    };
  }, [model, client, createRenderer, loadAllSectors, setProgress, resetProgress]);

  useEffect(() => {
    if (!model || !assetNodes) return;

    rendererReference.current?.setAssetLookup(createAssetLookup(assetNodes));
  }, [model, assetNodes, createRenderer]);

  const zoomIn = useCallback(() => rendererReference.current?.zoomIn(), []);
  const zoomOut = useCallback(() => rendererReference.current?.zoomOut(), []);
  const resetView = useCallback(() => rendererReference.current?.resetView(), []);

  return {
    zoomIn,
    zoomOut,
    resetView,
    modelName: model?.name,
    isLoading: modelQuery.isPending,
    isError: modelQuery.isError,
    error: modelQuery.error,
    hasModel: Boolean(model),
    progress,
    viewportRef: viewportReference,
    retry: modelQuery.retry,
  };
}
