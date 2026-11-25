import { useState } from "react";
import { AUTOMATA_KINDS, type AutomataKind } from "../model/types";
import { useDiagram } from "../store/diagram";
import { useRun } from "../store/run";
import { useSession, type AppMode } from "../store/session";
import { Modal } from "./Modal";
import { MdInfoOutline } from "react-icons/md";
import About from "./About";

export function Header() {
  const automataKind = useDiagram((state) => state.automataKind);
  const setAutomataKind = useDiagram((state) => state.setAutomataKind);
  const nodes = useDiagram((state) => state.nodes);
  const edges = useDiagram((state) => state.edges);
  const clear = useDiagram((state) => state.clear);
  const mode = useSession((state) => state.mode);
  const setMode = useSession((state) => state.setMode);
  const [pendingKind, setPendingKind] = useState<AutomataKind | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  function chooseMode(next: AppMode) {
    if (next === mode) return;
    useRun.getState().reset();
    setMode(next);
  }

  function requestKind(next: AutomataKind) {
    if (next === automataKind) return;
    if (nodes.length === 0 && edges.length === 0) {
      useRun.getState().reset();
      setAutomataKind(next);
      return;
    }
    setPendingKind(next);
  }

  function confirmKind() {
    if (!pendingKind) return;
    clear();
    useRun.getState().reset();
    setAutomataKind(pendingKind);
    setPendingKind(null);
  }

  return (
    <header>
      <div className="header-title">
        <h1>Automata Visualizer</h1>
        <p>Create and visualize state diagrams for automata.</p>
      </div>
      <div className="header-controls">
        <button title="About" className="info-btn" onClick={() => setInfoOpen(true)}>
          <MdInfoOutline />
        </button>
        <Modal
          open={infoOpen}
          title="About"
          onClose={() => setInfoOpen(false)}
        >
          <About />
        </Modal>
        <div className="mode-toggle" role="group" aria-label="Mode">
          <button type="button" aria-pressed={mode === "build"} onClick={() => chooseMode("build")}>
            Build
          </button>
          <button type="button" aria-pressed={mode === "run"} onClick={() => chooseMode("run")}>
            Run
          </button>
        </div>
        <label htmlFor="automata-type" className="automata-kind">
        Type
        <select
          id="automata-type"
          aria-label="Automata type"
          value={automataKind}
          onChange={(event) => requestKind(event.target.value as AutomataKind)}
        >
          {AUTOMATA_KINDS.map((option) => (
            <option key={option.kind} value={option.kind}>
              {option.label}
            </option>
          ))}
        </select>
        </label>
      </div>
      <Modal
        open={pendingKind !== null}
        title="Warning"
        showClose={false}
        onClose={() => setPendingKind(null)}
      >
        <p>Changing the automata type will delete the current state machine.</p>
        <div className="modal-actions">
          <button type="button" className="delete" onClick={() => setPendingKind(null)}>
            Cancel
          </button>
          <button type="button" onClick={confirmKind}>
            I understand
          </button>
        </div>
      </Modal>
    </header>
  );
}
