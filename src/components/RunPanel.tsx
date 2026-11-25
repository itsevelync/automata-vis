import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { LatexLabel } from "../canvas/LatexLabel";
import { Modal } from "./Modal";
import { INPUT_CAP, compile, BLANK } from "../sim/compile";
import type { SimConfig } from "../sim/step";
import { useDiagram } from "../store/diagram";
import { useRun } from "../store/run";
import { MdFastForward, MdPause, MdPlayArrow, MdReplay, MdSkipNext, MdSkipPrevious } from "react-icons/md";
import DecisionTree from "./DecisionTree";

const SPEED_MIN = 50;
const SPEED_MAX = 1000;
const SPEED_STEP = 50;

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
  const liveStates = new Set<string>();
  for (const id of frontier) {
    const config = configsById.get(id);
    if (!config || liveStates.has(config.state)) continue;
    liveStates.add(config.state);
    live.push(config);
  }
  const acceptedStates = new Set(liveStates);
  const accepted: SimConfig[] = [];
  for (const config of configs) {
    if (config.outcome !== "accept" || acceptedStates.has(config.state)) continue;
    acceptedStates.add(config.state);
    accepted.push(config);
  }
  const tapes = automataKind === "tm" ? [...live, ...accepted] : live;
  const finished =
    status === "accepted" || status === "rejected" || status === "limited";

  return (
    <section className="panel run-panel">
      <h2>Run</h2>
      {machine.errors.length ? (
        <p className="error">{machine.errors.join(" ")}</p>
      ) : (
        <>
          <p className="muted">Load an input, then step or play.</p>
          <label htmlFor="automata-input">
            Input
            <input
              id="automata-input"
              ref={inputRef}
              value={input}
              maxLength={INPUT_CAP}
              disabled={status !== "idle"}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && status === "idle") load();
              }}
            />
          </label>
          <button
            type="button"
            title={status === "idle" ? "Load input" : "Edit input"}
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
                title="Restart"
                disabled={history.length === 0}
                onClick={stop}
              >
                <MdReplay />
              </button>
              <button
                type="button"
                title="Step backwards"
                onClick={back}
                disabled={history.length === 0 || status === "running"}
              >
                <MdSkipPrevious />
              </button>
              <button
                type="button"
                title={status === "running" ? "Pause" : "Play"}
                onClick={status === "running" ? pause : play}
                disabled={
                  status !== "running" &&
                  status !== "ready" &&
                  status !== "paused" &&
                  !finished
                }
              >
                {status === "running" ? <MdPause /> : <MdPlayArrow />}
              </button>
              <button
                type="button"
                title="Step forward"
                onClick={step}
                disabled={status !== "ready" && status !== "paused"}
              >
                <MdSkipNext />
              </button>
              <button
                type="button"
                title="Skip to end"
                onClick={skip}
                disabled={
                  status !== "ready" &&
                  status !== "paused" &&
                  status !== "running"
                }
              >
                <MdFastForward />
              </button>
            </div>
            <label className="speed-control">
              Speed
              <input
                type="range"
                min={SPEED_MIN}
                max={SPEED_MAX}
                step={SPEED_STEP}
                value={SPEED_MIN + SPEED_MAX - speed}
                style={{ flexGrow: 1 }}
                onChange={(event) => setSpeed(SPEED_MIN + SPEED_MAX - Number(event.target.value))}
              />
            </label>
            <p className="muted">
              Steps: <strong>{steps}</strong>
            </p>
          </div>
          {automataKind !== "tm" && <p className="muted">Note: &epsilon;-transitions are taken before the next symbol is read from the input.</p>}
          <p>Current Configuration</p>
          {automataKind === "dfa" && <p>
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
          </p>}
          </>
          ) : null}
          {automataKind === "tm"
            ? tapes.map((config) => (
                <Tape
                  key={config.id}
                  config={config}
                  label={labels.get(config.state) ?? config.state}
                  note={
                    config.outcome === "accept" ? `(accepted after ${config.steps} step${config.steps === 1 ? "" : "s"})` : undefined
                  }
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
          {automataKind === "pda" && symbols.length > 0
            ? <div className="stack-section">
                <p>State + Stack {live.length === 0 && <span className="muted">No states possible</span>}</p>
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
          {message && !finished && <p className="muted">{message}</p>}
          {message && finished && <p className="run-result">
            <b>{message}</b>{" "}
            (<span onClick={() => setTraceOpen(true)}>Open decision tree</span>)
            <Modal
              open={traceOpen}
              title="Decision tree"
              onClose={() => setTraceOpen(false)}
            >
              <DecisionTree configs={configs} labels={labels} />
            </Modal>
          </p>}
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
  label,
  note,
  inputLength,
}: {
  config: SimConfig;
  label: string;
  note?: string;
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
    <div className="tape-view">
      <span>
        <LatexLabel className="tape-state" label={label} />
        {note ? <span className="muted"> {note}</span> : null}
      </span>
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
    </div>
  );
}

function StackView({ config, label }: { config: SimConfig; label: string }) {
  return (
    <div className="stack-view">
      <LatexLabel className="stack-state" label={label+":"} />
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
