export type PickPoint = { x: number; y: number };

export type HoverState = {
  readonly hovered: number | null;
  pointerMoved: (x: number, y: number) => void;
  pointerLeft: () => boolean;
  viewChanged: () => void;
  takePendingPoint: () => PickPoint | null;
  setHovered: (treeIndex: number | null) => boolean;
};

export function createHoverState(): HoverState {
  let hovered: number | null = null;
  let lastPoint: PickPoint | null = null;
  let pendingPoint: PickPoint | null = null;

  return {
    get hovered() {
      return hovered;
    },
    pointerMoved: (offsetX, offsetY) => {
      lastPoint = { x: offsetX, y: offsetY };
      pendingPoint = lastPoint;
    },
    pointerLeft: () => {
      const hasHighlight = hovered !== null;

      lastPoint = null;
      pendingPoint = null;
      hovered = null;

      return hasHighlight;
    },
    viewChanged: () => {
      pendingPoint = lastPoint;
    },
    takePendingPoint: () => {
      const point = pendingPoint;

      pendingPoint = null;

      return point;
    },
    setHovered: (treeIndex) => {
      if (treeIndex === hovered) return false;

      hovered = treeIndex;

      return true;
    },
  };
}
