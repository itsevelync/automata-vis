import { useEffect, useMemo, useRef, useState } from "react";
import { LatexLabel } from "../canvas/LatexLabel";
import { Modal } from "./Modal";
import { compile, BLANK } from "../sim/compile";
import type { SimConfig } from "../sim/step";
import { useDiagram } from "../store/diagram";
import { useRun } from "../store/run";

const SYMBOLS = [
  { command: "\\varepsilon", label: "\\varepsilon" },
  { command: "\\textvisiblespace", label: "\\textvisiblespace" },
];

export function RunPanel() {
  const automataKind = useDiagram((state) => state.automataKind);
  const nodes = useDiagram((state) => state.nodes);
  const edges = useDiagram((state) => state.edges);
  const input = useRun((state) => state.input);
  const setInput = useRun((state) => state.setInput);
  const speed = useRun((state) => state.speed);
  const setSpeed = useRun((state) => state.setSpeed);
  const status = useRun((state) => state.status);
  const message = useRun((state) => state.message);
  const symbols = useRun((state) => state.symbols);
  const steps = useRun((state) => state.steps);
  const configs = useRun((state) => state.configs);
  const frontier = useRun((state) => state.frontier);
  const load = useRun((state) => state.load);
  const step = useRun((state) => state.step);
  const skip = useRun((state) => state.skip);
  const play = useRun((state) => state.play);
  const pause = useRun((state) => state.pause);
  const stop = useRun((state) => state.stop);
  const reset = useRun((state) => state.reset);
  const inputRef = useRef<HTMLInputElement>(null);
  const [traceOpen, setTraceOpen] = useState(false);
  const machine = useMemo(
    () => compile(automataKind, nodes, edges),
    [automataKind, nodes, edges],
  );
  const labels = useMemo(() => new Map(nodes.map((node) => [node.id, node.label])), [nodes]);

  useEffect(() => {
    reset();
  }, [automataKind, nodes, edges, reset]);

  useEffect(() => {
    if (status !== "running") return;
    const timer = window.setInterval(() => useRun.getState().step(), speed);
    return () => window.clearInterval(timer);
  }, [status, speed]);

  function insert(command: string) {
    const element = inputRef.current;
    const start = element?.selectionStart ?? input.length;
    const end = element?.selectionEnd ?? input.length;
    const next = input.slice(0, start) + command + input.slice(end);
    setInput(next);
    const cursor = start + command.length;
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(cursor, cursor);
    });
  }

  const live = frontier
    .map((id) => configs.find((config) => config.id === id))
    .filter((config): config is SimConfig => Boolean(config));
  const finished = status === "accepted" || status === "rejected" || status === "limited";
  const branching = isBranching(configs);
  const halted = configs.filter((config) => config.outcome !== "open");

  return (
    <section className="panel run-panel">
      <h2>Run</h2>
      {machine.errors.length ? (
        <p className="error">{machine.errors.join(" ")}</p>
      ) : (
        <p className="muted">Load an input, then step or play.</p>
      )}
      <label>
        Input
        <input
          ref={inputRef}
          value={input}
          placeholder="010"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") load();
          }}
        />
      </label>
      <div className="symbol-row">
        {SYMBOLS.map((symbol) => (
          <button
            key={symbol.command}
            type="button"
            className="symbol-button"
            aria-label={symbol.command}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => insert(symbol.command)}
          >
            <LatexLabel className="symbol-math" label={symbol.label} />
          </button>
        ))}
      </div>
      <button type="button" onClick={load} disabled={machine.errors.length > 0}>
        Load
      </button>
      <div className="run-controls">
        <button type="button" onClick={play} disabled={status !== "ready" && status !== "paused"}>
          Play
        </button>
        <button type="button" onClick={pause} disabled={status !== "running"}>
          Pause
        </button>
        <button type="button" onClick={stop} disabled={status === "idle"}>
          Stop
        </button>
        <button type="button" onClick={step} disabled={status !== "ready" && status !== "paused"}>
          Step
        </button>
        <button type="button" onClick={skip} disabled={status !== "ready" && status !== "paused" && status !== "running"}>
          Skip
        </button>
      </div>
      <label>
        Speed
        <input
          type="range"
          min={50}
          max={1000}
          step={50}
          value={speed}
          onChange={(event) => setSpeed(Number(event.target.value))}
        />
      </label>
      <p className="muted">{speed} ms per step</p>
      <p>
        Steps <strong>{steps}</strong>
      </p>
      <p>
        State{" "}
        {live.length === 0 ? (
          <span className="muted">none</span>
        ) : (
          live.map((config) => (
            <LatexLabel key={config.id} className="run-math" label={labels.get(config.state) ?? config.state} />
          ))
        )}
      </p>
      {message ? <p className={finished ? "run-result" : "muted"}>{message}</p> : null}
      {automataKind === "tm"
        ? live.slice(0, 4).map((config) => <Tape key={config.id} config={config} />)
        : null}
      {automataKind === "pda"
        ? live.slice(0, 4).map((config) => <StackView key={config.id} config={config} symbols={symbols} />)
        : null}
      {automataKind === "dfa" && symbols.length > 0 && live[0] ? (
        <InputCursor symbols={symbols} cursor={live[0].cursor} />
      ) : null}
      {finished ? (
        <div className="run-summary">
          <button type="button" onClick={() => setTraceOpen(true)}>
            States visited
          </button>
          <p className="muted">
            {halted.length} halted branch{halted.length === 1 ? "" : "es"},{" "}
            {configs.filter((config) => config.outcome === "loop").length} loop
            {configs.filter((config) => config.outcome === "loop").length === 1 ? "" : "s"}.
          </p>
          <Modal
            open={traceOpen}
            title={branching ? "Decision tree" : "States visited"}
            onClose={() => setTraceOpen(false)}
          >
            <Trace configs={configs} labels={labels} branching={branching} />
          </Modal>
          {automataKind === "tm"
            ? halted.filter((config) => config.outcome === "accept" || halted.length === 1).slice(0, 3).map((config) => (
                <Tape key={`final-${config.id}`} config={config} />
              ))
            : null}
          {automataKind === "pda"
            ? halted.filter((config) => config.outcome === "accept" || halted.length === 1).slice(0, 3).map((config) => (
                <StackView key={`final-${config.id}`} config={config} symbols={symbols} />
              ))
            : null}
        </div>
      ) : null}
    </section>
  );
}

function InputCursor({ symbols, cursor }: { symbols: string[]; cursor: number }) {
  return (
    <p className="input-cursor" aria-label="Remaining input">
      {symbols.map((symbol, index) => (
        <span key={`${symbol}-${index}`} className={index === cursor ? "cursor" : undefined}>
          <LatexLabel className="run-math" label={symbol} />
        </span>
      ))}
      {cursor >= symbols.length ? <span className="cursor" /> : null}
    </p>
  );
}

function Tape({ config }: { config: SimConfig }) {
  const indexes = Object.keys(config.tape).map(Number);
  const min = Math.min(config.head - 4, ...(indexes.length ? indexes : [0]));
  const max = Math.max(config.head + 4, ...(indexes.length ? indexes : [0]));
  const cells = [];
  for (let index = min; index <= max; index += 1) cells.push(index);
  return (
    <div className="tape" aria-label="Tape">
      {cells.map((index) => (
        <span key={index} className={index === config.head ? "tape-cell head" : "tape-cell"}>
          <LatexLabel className="run-math" label={config.tape[index] ?? BLANK} />
        </span>
      ))}
    </div>
  );
}

function StackView({ config, symbols }: { config: SimConfig; symbols: string[] }) {
  return (
    <div>
      <InputCursor symbols={symbols} cursor={config.cursor} />
      <p className="muted">Stack, top at the right</p>
      <p className="stack">
        {config.stack.length === 0 ? (
          <span className="muted">empty</span>
        ) : (
          config.stack.map((symbol, index) => (
            <LatexLabel key={`${symbol}-${index}`} className="run-math" label={symbol} />
          ))
        )}
      </p>
    </div>
  );
}

function isBranching(configs: SimConfig[]): boolean {
  const counts = new Map<string, number>();
  for (const config of configs) {
    if (!config.parentId) continue;
    counts.set(config.parentId, (counts.get(config.parentId) ?? 0) + 1);
  }
  return [...counts.values()].some((count) => count > 1);
}

function statePaths(configs: SimConfig[], branching: boolean): SimConfig[][] {
  if (!branching) return [configs];
  const children = new Map<string, SimConfig[]>();
  const roots: SimConfig[] = [];
  for (const config of configs) {
    if (!config.parentId) {
      roots.push(config);
      continue;
    }
    const list = children.get(config.parentId) ?? [];
    list.push(config);
    children.set(config.parentId, list);
  }
  const paths: SimConfig[][] = [];
  function walk(config: SimConfig, path: SimConfig[]) {
    const next = [...path, config];
    const nested = children.get(config.id) ?? [];
    if (nested.length === 0) paths.push(next);
    else nested.forEach((child) => walk(child, next));
  }
  roots.forEach((root) => walk(root, []));
  return paths;
}

function Trace({
  configs,
  labels,
  branching,
}: {
  configs: SimConfig[];
  labels: Map<string, string>;
  branching: boolean;
}) {
  const paths = statePaths(configs, branching);
  return (
    <div className="state-paths">
      {paths.map((path) => (
        <p key={path[path.length - 1]?.id} className="state-path">
          {path.map((config) => (
            <span key={config.id}>
              [<LatexLabel className="state-token" label={labels.get(config.state) ?? config.state} />]
            </span>
          ))}
          {branching && path[path.length - 1]?.outcome !== "open" ? (
            <span className="muted"> {path[path.length - 1].outcome}</span>
          ) : null}
        </p>
      ))}
    </div>
  );
}
