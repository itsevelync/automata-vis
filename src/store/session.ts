import { create } from "zustand";

export type AppMode = "build" | "run";

interface SessionState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

export const useSession = create<SessionState>((set) => ({
  mode: "build",
  setMode: (mode) => set({ mode }),
}));
