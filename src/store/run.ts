import { create } from "zustand";
import { compile, tokenize, type Machine } from "../sim/compile";
import { createEngine, stepEngine, type Engine, type SimConfig } from "../sim/step";
import { useDiagram } from "./diagram";

export type RunStatus = "idle" | "ready" | "running" | "paused" | "accepted" | "rejected" | "limited";

interface RunState {
  input: string;
  speed: number;
  status: RunStatus;
  message: string;
  symbols: string[];
  steps: number;
  configs: SimConfig[];
  frontier: string[];
  activeStates: string[];
  activeEdges: string[];
  machine: Machine | null;
  engine: Engine | null;
  setInput: (input: string) => void;
  setSpeed: (speed: number) => void;
  load: () => void;
  step: () => void;
  skip: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
}

function view(engine: Engine) {
  const frontier = new Set(engine.frontier);
  const active = engine.configs.filter((config) => frontier.has(config.id));
  return {
    configs: engine.configs,
    frontier: engine.frontier,
    steps: engine.steps,
    message: engine.message,
    activeStates: [...new Set(active.map((config) => config.state))],
    activeEdges: [...new Set(active.flatMap((config) => (config.viaEdge ? [config.viaEdge] : [])))],
  };
}

function cleared() {
  return {
    status: "idle" as const,
    message: "",
    symbols: [] as string[],
    steps: 0,
    configs: [] as SimConfig[],
    frontier: [] as string[],
    activeStates: [] as string[],
    activeEdges: [] as string[],
    machine: null,
    engine: null,
  };
}

export const useRun = create<RunState>((set, get) => ({
  input: "",
  speed: 300,
  ...cleared(),
  setInput: (input) => set({ input }),
  setSpeed: (speed) => set({ speed }),
  load: () => {
    const diagram = useDiagram.getState();
    const machine = compile(diagram.automataKind, diagram.nodes, diagram.edges);
    if (machine.errors.length) {
      set({ ...cleared(), message: machine.errors.join(" ") });
      return;
    }
    const symbols = tokenize(get().input);
    const engine = createEngine(machine, symbols);
    const status: RunStatus = engine.status === "ready" ? "ready" : engine.status;
    set({ machine, symbols, engine, status, ...view(engine) });
  },
  step: () => {
    const { engine, machine, symbols, status } = get();
    if (!engine || !machine || engine.status !== "ready") return;
    const next = stepEngine(engine, machine, symbols);
    set({
      engine: next,
      status: next.status === "ready" ? (status === "running" ? "running" : "paused") : next.status,
      ...view(next),
    });
  },
  skip: () => {
    const { engine, machine } = get();
    if (!engine || !machine || (engine.status !== "ready" && get().status !== "running")) return;
    set({ status: "paused" });
    let guard = 0;
    while (get().engine?.status === "ready" && guard < 600) {
      get().step();
      guard += 1;
    }
  },
  play: () => {
    const { status, engine } = get();
    if (!engine || engine.status !== "ready") return;
    if (status === "ready" || status === "paused") set({ status: "running" });
  },
  pause: () => {
    if (get().status === "running") set({ status: "paused" });
  },
  stop: () => {
    if (get().engine) get().load();
  },
  reset: () => set({ ...cleared(), input: get().input, speed: get().speed }),
}));
