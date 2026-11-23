import { BLANK, BRANCH_CAP, STEP_CAP, isEpsilon, type CompiledTransition, type Machine } from "./compile";

export interface SimConfig {
  id: string;
  parentId: string | null;
  state: string;
  viaEdge: string | null;
  steps: number;
  cursor: number;
  stack: string[];
  tape: Record<number, string>;
  head: number;
  key: string;
  outcome: "open" | "accept" | "reject" | "loop";
  reason: string;
}

export interface Engine {
  status: "ready" | "accepted" | "rejected" | "limited";
  message: string;
  steps: number;
  nextId: number;
  configs: SimConfig[];
  frontier: string[];
  seen: string[];
}

function readTape(tape: Record<number, string>, head: number): string {
  return tape[head] ?? BLANK;
}

function writeTape(tape: Record<number, string>, head: number, symbol: string): Record<number, string> {
  const next = { ...tape };
  if (symbol === BLANK) delete next[head];
  else next[head] = symbol;
  return next;
}

function signature(kind: Machine["kind"], config: Pick<SimConfig, "state" | "cursor" | "stack" | "head" | "tape">): string {
  if (kind === "tm") {
    const cells = Object.keys(config.tape)
      .map(Number)
      .sort((a, b) => a - b)
      .map((cell) => `${cell}:${config.tape[cell]}`)
      .join(",");
    return `${config.state}|${config.head}|${cells}`;
  }
  if (kind === "pda") return `${config.state}|${config.cursor}|${JSON.stringify(config.stack)}`;
  return `${config.state}|${config.cursor}`;
}

function pathHas(config: SimConfig, configs: Map<string, SimConfig>): boolean {
  let parent = config.parentId ? configs.get(config.parentId) : undefined;
  while (parent) {
    if (parent.key === config.key) return true;
    parent = parent.parentId ? configs.get(parent.parentId) : undefined;
  }
  return false;
}

export function isAccept(machine: Machine, symbols: string[], config: SimConfig): boolean {
  if (!machine.accepting.includes(config.state)) return false;
  if (machine.kind === "tm") return true;
  return config.cursor >= symbols.length;
}

function transitionsFrom(machine: Machine): Map<string, CompiledTransition[]> {
  const bySource = new Map<string, CompiledTransition[]>();
  for (const transition of machine.transitions) {
    const list = bySource.get(transition.source);
    if (list) list.push(transition);
    else bySource.set(transition.source, [transition]);
  }
  return bySource;
}

function applicable(transitions: CompiledTransition[], machine: Machine, symbols: string[], config: SimConfig): CompiledTransition[] {
  return transitions.filter((transition) => {
    if (machine.kind === "tm") return transition.read === readTape(config.tape, config.head);
    if (transition.read && (config.cursor >= symbols.length || symbols[config.cursor] !== transition.read)) {
      return false;
    }
    if (machine.kind === "pda" && transition.pop) {
      return config.stack[config.stack.length - 1] === transition.pop;
    }
    return true;
  });
}

function apply(machine: Machine, config: SimConfig, transition: CompiledTransition, id: string): SimConfig {
  const cursor = machine.kind === "tm" || isEpsilon(transition.read) ? config.cursor : config.cursor + 1;
  const stack = config.stack.slice();
  if (machine.kind === "pda" && transition.pop) stack.pop();
  if (machine.kind === "pda") {
    for (let index = transition.push.length - 1; index >= 0; index -= 1) stack.push(transition.push[index]);
  }
  const tape = machine.kind === "tm" ? writeTape(config.tape, config.head, transition.write) : config.tape;
  const head = machine.kind === "tm" ? config.head + (transition.move === "L" ? -1 : 1) : config.head;
  const next = {
    id,
    parentId: config.id,
    state: transition.target,
    viaEdge: transition.edgeId,
    steps: config.steps + 1,
    cursor,
    stack,
    tape,
    head,
    key: "",
    outcome: "open" as const,
    reason: "",
  };
  next.key = signature(machine.kind, next);
  return next;
}

function halted(configs: SimConfig[]): boolean {
  return configs.some((config) => config.outcome === "accept");
}

function finish(engine: Engine): Engine {
  if (halted(engine.configs)) {
    return { ...engine, status: "accepted", message: "Accepted.", frontier: [] };
  }
  return { ...engine, status: "rejected", message: "Rejected.", frontier: [] };
}

function remember(seen: Set<string>, child: SimConfig, byId: Map<string, SimConfig>): "new" | "loop" | "seen" {
  if (seen.has(child.key)) return pathHas(child, byId) ? "loop" : "seen";
  seen.add(child.key);
  return "new";
}

function closeEpsilon(
  machine: Machine,
  symbols: string[],
  seeds: string[],
  configs: SimConfig[],
  byId: Map<string, SimConfig>,
  bySource: Map<string, CompiledTransition[]>,
  seen: Set<string>,
  nextId: number,
): { frontier: string[]; nextId: number } {
  const frontier: string[] = [];
  const queue = [...seeds];
  while (queue.length > 0) {
    const current = byId.get(queue.shift()!);
    if (!current) continue;
    if (current.outcome === "open") frontier.push(current.id);
    const silent = applicable(bySource.get(current.state) ?? [], machine, symbols, current).filter(
      (transition) => isEpsilon(transition.read),
    );
    for (const transition of silent) {
      const child = apply(machine, current, transition, `c${nextId}`);
      nextId += 1;
      child.steps = current.steps;
      const status = remember(seen, child, byId);
      if (status === "loop") {
        configs.push({ ...child, outcome: "loop", reason: "repeated configuration" });
        continue;
      }
      if (status === "seen") continue;
      if (isAccept(machine, symbols, child)) {
        child.outcome = "accept";
        child.reason = "accepting state";
      }
      configs.push(child);
      byId.set(child.id, child);
      queue.push(child.id);
    }
  }
  return { frontier: [...new Set(frontier)], nextId };
}

export function createEngine(machine: Machine, symbols: string[]): Engine {
  const tape: Record<number, string> = {};
  symbols.forEach((symbol, index) => {
    if (symbol !== BLANK) tape[index] = symbol;
  });
  const root: SimConfig = {
    id: "c0",
    parentId: null,
    state: machine.initial ?? "",
    viaEdge: null,
    steps: 0,
    cursor: 0,
    stack: [],
    tape,
    head: 0,
    key: "",
    outcome: "open",
    reason: "",
  };
  root.key = signature(machine.kind, root);
  const engine: Engine = {
    status: "ready",
    message: "",
    steps: 0,
    nextId: 1,
    configs: [root],
    frontier: [root.id],
    seen: [root.key],
  };
  if (isAccept(machine, symbols, root)) {
    root.outcome = "accept";
    return { ...engine, status: "accepted", message: "Accepted.", frontier: [] };
  }
  if (machine.kind === "tm") return engine;
  const configs = [root];
  const byId = new Map([[root.id, root]]);
  const seen = new Set([root.key]);
  const closed = closeEpsilon(machine, symbols, [root.id], configs, byId, transitionsFrom(machine), seen, 1);
  if (configs.some((config) => config.outcome === "accept")) {
    return { ...engine, configs, frontier: [], seen: [...seen], nextId: closed.nextId, status: "accepted", message: "Accepted." };
  }
  if (symbols.length === 0) {
    return { ...engine, configs, frontier: closed.frontier, seen: [...seen], nextId: closed.nextId, status: "rejected", message: "Rejected." };
  }
  return { ...engine, configs, frontier: closed.frontier, seen: [...seen], nextId: closed.nextId };
}

export function stepEngine(engine: Engine, machine: Machine, symbols: string[]): Engine {
  if (engine.status !== "ready" || engine.frontier.length === 0) return finish(engine);
  const configs = engine.configs.map((config) => ({ ...config }));
  const byId = new Map(configs.map((config) => [config.id, config]));
  const bySource = transitionsFrom(machine);
  const seen = new Set(engine.seen);
  const nextFrontier: string[] = [];
  let nextId = engine.nextId;
  let limited = false;
  for (const id of engine.frontier) {
    const config = byId.get(id);
    if (!config || config.outcome !== "open") continue;
    const moves = applicable(bySource.get(config.state) ?? [], machine, symbols, config).filter(
      (transition) => machine.kind === "tm" || !isEpsilon(transition.read),
    );
    if (moves.length === 0) {
      config.outcome = "reject";
      config.reason = "no transition";
      continue;
    }
    for (const transition of moves) {
      if (nextFrontier.length >= BRANCH_CAP) {
        limited = true;
        break;
      }
      const child = apply(machine, config, transition, `c${nextId}`);
      nextId += 1;
      if (seen.has(child.key)) {
        if (pathHas(child, byId)) {
          configs.push({ ...child, outcome: "loop", reason: "repeated configuration" });
        }
        continue;
      }
      seen.add(child.key);
      if (isAccept(machine, symbols, child)) {
        child.outcome = "accept";
        child.reason = "accepting state";
      }
      configs.push(child);
      byId.set(child.id, child);
      if (machine.kind !== "tm") {
        const closed = closeEpsilon(machine, symbols, [child.id], configs, byId, bySource, seen, nextId);
        nextId = closed.nextId;
        nextFrontier.push(...closed.frontier);
      } else if (child.outcome === "open") {
        nextFrontier.push(child.id);
      }
    }
    if (limited) break;
  }
  const steps = engine.steps + 1;
  const next: Engine = {
    ...engine,
    configs,
    frontier: [...new Set(nextFrontier)],
    steps,
    nextId,
    seen: [...seen],
  };
  if (limited || steps >= STEP_CAP) {
    return {
      ...next,
      status: halted(configs) ? "accepted" : "limited",
      message: halted(configs) ? "Accepted." : limited ? "Branch limit reached." : "Step limit reached.",
    };
  }
  if (nextFrontier.length === 0) return finish(next);
  if (
    machine.kind !== "tm" &&
    nextFrontier.every((id) => (byId.get(id)?.cursor ?? 0) >= symbols.length)
  ) {
    return finish(next);
  }
  return next;
}
