import { useState } from "react";
import { AUTOMATA_KINDS, type AutomataKind } from "../model/types";
import { useDiagram } from "../store/diagram";
import { Modal } from "./Modal";

export function Header() {
  const automataKind = useDiagram((state) => state.automataKind);
  const setAutomataKind = useDiagram((state) => state.setAutomataKind);
  const nodes = useDiagram((state) => state.nodes);
  const edges = useDiagram((state) => state.edges);
  const clear = useDiagram((state) => state.clear);
  const [pendingKind, setPendingKind] = useState<AutomataKind | null>(null);

  function requestKind(next: AutomataKind) {
    if (next === automataKind) return;
    if (nodes.length === 0 && edges.length === 0) {
      setAutomataKind(next);
      return;
    }
    setPendingKind(next);
  }

  function confirmKind() {
    if (!pendingKind) return;
    clear();
    setAutomataKind(pendingKind);
    setPendingKind(null);
  }

  return (
    <header>
      <div className="header-title">
        <h1>Automata Visualizer</h1>
        <p>Create state diagrams for automata and export as TikZ.</p>
      </div>
      <label className="automata-kind">
        Type
        <select
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
      <Modal
        open={pendingKind !== null}
        title="Change automata type"
        onClose={() => setPendingKind(null)}
      >
        <p>Changing the automata type will delete the current state machine.</p>
        <div className="modal-actions">
          <button type="button" onClick={() => setPendingKind(null)}>
            Cancel
          </button>
          <button type="button" onClick={confirmKind}>
            Delete
          </button>
        </div>
      </Modal>
    </header>
  );
}
