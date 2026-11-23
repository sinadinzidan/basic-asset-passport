import { create } from 'zustand';

import { ThreeDInteractionMode } from '../enums/threeDInteractionMode';
import type { ThreeDHover } from '../types/threeD';

type ThreeDInteractionStore = {
  mode: ThreeDInteractionMode;
  setMode: (mode: ThreeDInteractionMode) => void;
  hover: ThreeDHover | null;
  setHover: (hover: ThreeDHover | null) => void;
};

export const useThreeDInteractionStore = create<ThreeDInteractionStore>()((set) => ({
  mode: ThreeDInteractionMode.ORBIT,
  setMode: (mode) => set({ mode }),
  hover: null,
  setHover: (hover) => set({ hover }),
}));
