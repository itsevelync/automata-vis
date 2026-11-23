import { create } from "zustand";
import { INPUT_CAP, compile, tokenize, type Machine } from "../sim/compile";
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
  history: Engine[];
  setInput: (input: string) => void;
  setSpeed: (speed: number) => void;
  load: () => void;
  step: () => void;
  back: () => void;
  skip: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
}

function view(engine: Engine) {
  const frontier = new Set(engine.frontier);
  for (const config of engine.configs) {
    if (config.outcome === "accept" && config.steps === engine.steps) frontier.add(config.id);
  }
  const active = engine.configs.filter((config) => frontier.has(config.id));
  return {
    configs: engine.configs,
    frontier: [...frontier],
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
    history: [] as Engine[],
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
    if (symbols.length > INPUT_CAP) {
      set({ ...cleared(), message: `Input is limited to ${INPUT_CAP} symbols.` });
      return;
    }
    const engine = createEngine(machine, symbols);
    const status: RunStatus = engine.status === "ready" ? "ready" : engine.status;
    set({ machine, symbols, engine, status, history: [], ...view(engine) });
  },
  step: () => {
    const { engine, machine, symbols, status, history } = get();
    if (!engine || !machine || engine.status !== "ready") return;
    const next = stepEngine(engine, machine, symbols);
    set({
      history: [...history, engine],
      engine: next,
      status: next.status === "ready" ? (status === "running" ? "running" : "paused") : next.status,
      ...view(next),
    });
  },
  back: () => {
    const { history, status } = get();
    if (history.length === 0 || status === "idle" || status === "running") return;
    const engine = history[history.length - 1];
    set({
      history: history.slice(0, -1),
      engine,
      status: engine.status === "ready" ? (engine.steps === 0 ? "ready" : "paused") : engine.status,
      ...view(engine),
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
    if (!engine) return;
    if (status === "accepted" || status === "rejected" || status === "limited") {
      get().stop();
      if (get().engine?.status !== "ready") return;
      set({ status: "running" });
      return;
    }
    if (engine.status !== "ready") return;
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
