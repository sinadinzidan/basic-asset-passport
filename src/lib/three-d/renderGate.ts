export type RenderGate = {
  markDirty: () => void;
  consume: (hasControlsChanged: boolean) => boolean;
};

export function createRenderGate(): RenderGate {
  let isDirty = true;

  return {
    markDirty: () => {
      isDirty = true;
    },
    consume: (hasControlsChanged) => {
      const shouldRender = isDirty || hasControlsChanged;

      isDirty = false;

      return shouldRender;
    },
  };
}
