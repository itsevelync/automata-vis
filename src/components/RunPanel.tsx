import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { LatexLabel } from "../canvas/LatexLabel";
import { Modal } from "./Modal";
import { compile, BLANK } from "../sim/compile";
import type { SimConfig } from "../sim/step";
import { useDiagram } from "../store/diagram";
import { useRun } from "../store/run";
import { MdPause, MdPlayArrow, MdSkipNext, MdSkipPrevious } from "react-icons/md";

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
  const back = useRun((state) => state.back);
  const history = useRun((state) => state.history);
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
  const labels = useMemo(
    () => new Map(nodes.map((node) => [node.id, node.label])),
    [nodes],
  );

  useEffect(() => {
    reset();
  }, [automataKind, nodes, edges, reset]);

  useEffect(() => {
    if (status !== "running") return;
    const timer = window.setInterval(() => useRun.getState().step(), speed);
    return () => window.clearInterval(timer);
  }, [status, speed]);

  const configsById = useMemo(
    () => new Map(configs.map((config) => [config.id, config])),
    [configs],
  );
  const live: SimConfig[] = [];
  const liveKeys = new Set<string>();
  for (const id of frontier) {
    const config = configsById.get(id);
    if (!config || liveKeys.has(config.key)) continue;
    liveKeys.add(config.key);
    live.push(config);
  }
  const finished =
    status === "accepted" || status === "rejected" || status === "limited";
  const halted = configs.filter((config) => config.outcome !== "open");

  return (
    <section className="panel run-panel">
      <h2>Run</h2>
      {machine.errors.length ? (
        <p className="error">{machine.errors.join(" ")}</p>
      ) : (
        <>
          <p className="muted">Load an input, then step or play.</p>
          <label>
            Input
            <input
              ref={inputRef}
              value={input}
              disabled={status !== "idle"}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && status === "idle") load();
              }}
            />
          </label>
          <button
            type="button"
            onClick={status === "idle" ? load : reset}
            disabled={status === "idle" && machine.errors.length > 0}
          >
            {status === "idle" ? "Load" : "Edit"}
          </button>
          {status !== "idle" ? (
          <>
          <div>
            <p>Playback Controls</p>
            <div className="run-controls">
              <button
                type="button"
                onClick={stop}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={back}
                disabled={history.length === 0 || status === "running"}
              >
                <MdSkipPrevious />
              </button>
              <button
                type="button"
                onClick={play}
                disabled={status !== "ready" && status !== "paused" && !finished}
              >
                <MdPlayArrow />
              </button>
              <button
                type="button"
                onClick={pause}
                disabled={status !== "running"}
              >
                <MdPause />
              </button>
              <button
                type="button"
                onClick={step}
                disabled={status !== "ready" && status !== "paused"}
              >
                <MdSkipNext />
              </button>
              <button
                type="button"
                onClick={skip}
                disabled={
                  status !== "ready" &&
                  status !== "paused" &&
                  status !== "running"
                }
              >
                Skip
              </button>
            </div>
            <div className="run-controls">
              
            </div>
            <label className="speed-control">
              Speed
              <input
                type="range"
                min={50}
                max={1000}
                step={50}
                value={1050 - speed}
                style={{flexGrow: 1}}
                onChange={(event) =>
                  setSpeed(1050 - Number(event.target.value))
                }
              />
            </label>
          </div>
          <p>Current Configuration</p>
          <p className="muted">Note that &epsilon;-transitions are taken before the next symbol is read from the input.</p>
          <p>
            Steps: <strong>{steps}</strong>
          </p>
          <p>
            State:{" "}
            {live.length === 0 ? (
              <span className="muted">No states possible</span>
            ) : (
              live.map((config) => (
                <LatexLabel
                  key={config.id}
                  className="run-math"
                  label={
                    labels.get(config.state) ?? config.state
                  }
                />
              ))
            )}
          </p>
          </>
          ) : null}
          {automataKind === "tm"
            ? live
                .slice(0, 4)
                .map((config) => (
                  <Tape
                    key={config.id}
                    config={config}
                    inputLength={symbols.length}
                  />
                ))
            : null}
          {(automataKind === "dfa" || automataKind === "pda") &&
          symbols.length > 0 &&
          (live[0] || finished) ? (
            <InputCursor
              symbols={symbols}
              cursor={live[0]?.cursor ?? symbols.length}
            />
          ) : null}
          {automataKind === "pda" && live.length > 0
            ? <div className="stack-section">
                <p>Stack</p>
                {live
                  .map((config) => (
                    <StackView
                      key={config.id}
                      config={config}
                      label={labels.get(config.state) ?? config.state}
                    />
                  ))}
              </div>
            : null}
          {message ? (
            <p className={finished ? "run-result" : "muted"}>
              {message}
              {finished && <>{" "}<span onClick={() => setTraceOpen(true)}>(Open decision tree)</span></>}
              <Modal
                open={traceOpen}
                title="Decision tree"
                onClose={() => setTraceOpen(false)}
              >
                <Trace configs={configs} labels={labels} />
              </Modal>
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

function InputCursor({
  symbols,
  cursor,
}: {
  symbols: string[];
  cursor: number;
}) {
  return (
    <p className="input-cursor" aria-label="Remaining input">
      {symbols.map((symbol, index) => (
        <span
          key={`${symbol}-${index}`}
          className={index === cursor ? "cursor" : undefined}
        >
          <LatexLabel className="run-math" label={symbol} />
        </span>
      ))}
      {cursor >= symbols.length ? <span className="cursor end" /> : null}
    </p>
  );
}

function Tape({
  config,
  inputLength,
}: {
  config: SimConfig;
  inputLength: number;
}) {
  const tapeRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLSpanElement>(null);
  const occupied = Object.keys(config.tape).map(Number);
  const contentLeft = Math.min(0, ...(occupied.length ? occupied : [0]));
  const contentRight = Math.max(
    inputLength - 1,
    ...(occupied.length ? occupied : [inputLength - 1]),
  );
  const extra = inputLength < 10 ? 10 - inputLength : 0;
  const leftPad = Math.max(1, Math.floor(extra / 2));
  const rightPad = Math.max(1, extra - Math.floor(extra / 2));
  let min = contentLeft - leftPad;
  let max = contentRight + rightPad;
  if (config.head < min) min = config.head;
  if (config.head > max) max = config.head;
  const cells = [];
  for (let index = min; index <= max; index += 1) cells.push(index);
  useLayoutEffect(() => {
    const tape = tapeRef.current;
    const head = headRef.current;
    if (!tape || !head) return;
    const tapeRect = tape.getBoundingClientRect();
    const headRect = head.getBoundingClientRect();
    const headCenter = headRect.left + headRect.width / 2;
    const viewCenter = tapeRect.left + tape.clientWidth / 2;
    tape.scrollLeft += headCenter - viewCenter;
  }, [config.head, cells.length]);
  return (
    <div className="tape" aria-label="Tape" ref={tapeRef}>
      <span className="tape-ellipsis">...</span>
      {cells.map((index) => (
        <span
          key={index}
          ref={index === config.head ? headRef : undefined}
          className={
            index === config.head ? "tape-cell head" : "tape-cell"
          }
        >
          <LatexLabel
            className="run-math"
            label={config.tape[index] ?? BLANK}
          />
        </span>
      ))}
      <span className="tape-ellipsis">...</span>
    </div>
  );
}

function StackView({ config, label }: { config: SimConfig; label: string }) {
  return (
    <div className="stack-view">
      <LatexLabel className="stack-state" label={label} />
      <p className="stack">
        {config.stack.length === 0 ? (
          <span className="muted">empty</span>
        ) : (
          config.stack.map((symbol, index) => (
            <LatexLabel
              key={`${symbol}-${index}`}
              className="run-math"
              label={symbol}
            />
          ))
        )}
      </p>
    </div>
  );
}

function Trace({
  configs,
  labels,
}: {
  configs: SimConfig[];
  labels: Map<string, string>;
}) {
  const displaySizes = useDiagram((state) => state.displaySizes);
  const nodeSize = useDiagram((state) => state.nodeSize);
  const radiusOf = (state: string) => (displaySizes[state] ?? nodeSize) / 2;
  const byId = new Map(configs.map((config) => [config.id, config]));
  const levels = new Map<number, Map<string, SimConfig["outcome"]>>();
  for (const config of configs) {
    const row = levels.get(config.steps) ?? new Map();
    const current = row.get(config.state);
    row.set(config.state, betterOutcome(current, config.outcome));
    levels.set(config.steps, row);
  }
  const steps = [...levels.keys()].sort((left, right) => left - right);
  const rows = steps.map((step) => [...(levels.get(step)?.entries() ?? [])]);
  const links: { from: string; to: string }[] = [];
  const seen = new Set<string>();
  for (const config of configs) {
    if (!config.parentId) continue;
    const parent = previousLevel(config, byId);
    if (!parent) continue;
    const key = `${parent.steps}:${parent.state}:${config.steps}:${config.state}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({
      from: `${parent.steps}:${parent.state}`,
      to: `${config.steps}:${config.state}`,
    });
  }
  const gapX = 22;
  const gapY = 28;
  const pad = 8;
  const rowWidths = rows.map(
    (row) =>
      row.reduce((sum, [state]) => sum + radiusOf(state) * 2, 0) +
      gapX * Math.max(0, row.length - 1),
  );
  const width = pad * 2 + Math.max(1, ...rowWidths);
  const position = new Map<string, { x: number; y: number; r: number }>();
  let cursorY = pad;
  rows.forEach((row, level) => {
    const radii = row.map(([state]) => radiusOf(state));
    const maxR = Math.max(radiusOf(""), ...radii);
    cursorY += maxR;
    let cursorX = (width - rowWidths[level]) / 2;
    row.forEach(([state], index) => {
      const r = radii[index];
      cursorX += r;
      position.set(`${steps[level]}:${state}`, {
        x: cursorX,
        y: cursorY,
        r,
      });
      cursorX += r + gapX;
    });
    cursorY += maxR + gapY;
  });
  const height = Math.max(pad * 2, cursorY - gapY + pad);
  return (
    <svg
      className="level-tree"
      width={width}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Decision tree"
    >
      {links.map((link) => {
        const start = position.get(link.from);
        const end = position.get(link.to);
        if (!start || !end) return null;
        const segment = shorten(
          start.x,
          start.y,
          start.r + 1,
          end.x,
          end.y,
          end.r + 1,
        );
        return (
          <line
            key={`${link.from}-${link.to}`}
            x1={segment.x1}
            y1={segment.y1}
            x2={segment.x2}
            y2={segment.y2}
            stroke="#000000"
            strokeWidth={1}
          />
        );
      })}
      {rows.flatMap((row, level) =>
        row.map(([state, outcome]) => {
          const point = position.get(`${steps[level]}:${state}`);
          if (!point) return null;
          const label = labels.get(state) ?? state;
          return (
            <g key={`${steps[level]}:${state}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={point.r}
                fill="#ffffff"
                stroke="#000000"
                strokeWidth={outcome === "accept" ? 2.4 : 1}
                strokeDasharray={
                  outcome === "reject" || outcome === "loop"
                    ? "3 2"
                    : undefined
                }
              />
              {outcome === "accept" ? (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={point.r - 4}
                  fill="none"
                  stroke="#000000"
                  strokeWidth={1}
                />
              ) : null}
              <foreignObject
                x={point.x - point.r}
                y={point.y - point.r}
                width={point.r * 2}
                height={point.r * 2}
              >
                <div className="level-label">
                  <LatexLabel
                    className="state-token"
                    label={label}
                  />
                </div>
              </foreignObject>
            </g>
          );
        }),
      )}
    </svg>
  );
}

function previousLevel(config: SimConfig, byId: Map<string, SimConfig>): SimConfig | null {
  let current = config;
  while (current.parentId) {
    const parent = byId.get(current.parentId);
    if (!parent) return null;
    if (parent.steps !== config.steps) return parent;
    current = parent;
  }
  return null;
}

function betterOutcome(
  current: SimConfig["outcome"] | undefined,
  next: SimConfig["outcome"],
): SimConfig["outcome"] {
  const rank = { accept: 3, open: 2, reject: 1, loop: 0 };
  if (!current || rank[next] > rank[current]) return next;
  return current;
}

function shorten(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x1: x1 + (dx / length) * r1,
    y1: y1 + (dy / length) * r1,
    x2: x2 - (dx / length) * r2,
    y2: y2 - (dy / length) * r2,
  };
}
