import { useEffect, useState } from "react";
import { useDiagram } from "../store/diagram";

export function DefaultsForm() {
  const nodeDistance = useDiagram((state) => state.nodeDistance);
  const setNodeDistance = useDiagram((state) => state.setNodeDistance);
  const [draft, setDraft] = useState(nodeDistance);
  const [invalid, setInvalid] = useState(false);
  useEffect(() => setDraft(nodeDistance), [nodeDistance]);

  return (
    <section className="panel">
      <label>
        Node distance
        <input
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setInvalid(false);
          }}
          onBlur={() => {
            if (draft.trim() === nodeDistance) return;
            const ok = setNodeDistance(draft);
            setInvalid(!ok);
            if (!ok) setDraft(nodeDistance);
          }}
        />
      </label>
      {invalid ? <p className="error">Use one positive length, such as 3cm.</p> : null}
      <p className="muted">Center-to-center. Changing it rescales the grid and does not move cells.</p>
    </section>
  );
}
