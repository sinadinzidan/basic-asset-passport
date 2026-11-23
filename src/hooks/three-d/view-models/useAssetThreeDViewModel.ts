import { createContext, useContext, useEffect, useRef } from 'react';

import { createSceneRenderer } from '../../../lib/three-d/sceneRenderer';
import { loadSectors } from '../../../lib/three-d/sectorLoader';
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

  const model = modelQuery.data;

  useEffect(() => {
    const container = viewportReference.current;

    if (!model || !container) return undefined;

    const controller = new AbortController();
    const renderer = createRenderer(container, model);

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
      renderer.dispose();
    };
  }, [model, client, createRenderer, loadAllSectors, setProgress, resetProgress]);

  return {
    modelName: model?.name,
    isLoading: modelQuery.isPending,
    isError: modelQuery.isError,
    error: modelQuery.error,
    isNotFound: model === null,
    hasModel: Boolean(model),
    progress,
    viewportRef: viewportReference,
    retry: modelQuery.retry,
  };
}
