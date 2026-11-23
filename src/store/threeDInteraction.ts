import { create } from 'zustand';

import { ThreeDInteractionMode } from '../enums/threeDInteractionMode';

type ThreeDInteractionStore = {
  mode: ThreeDInteractionMode;
  setMode: (mode: ThreeDInteractionMode) => void;
};

export const useThreeDInteractionStore = create<ThreeDInteractionStore>()((set) => ({
  mode: ThreeDInteractionMode.ORBIT,
  setMode: (mode) => set({ mode }),
}));
