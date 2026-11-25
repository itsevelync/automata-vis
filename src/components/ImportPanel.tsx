import { useState } from "react";
import { useDiagram } from "../store/diagram";
import { importTikZ } from "../tikz/import";

export function ImportPanel({ onImported }: { onImported: () => void }) {
  const importDiagram = useDiagram((state) => state.importDiagram);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");

  return (
    <section className="panel export-panel">
      <textarea
        value={source}
        spellCheck={false}
        placeholder="Paste a tikzpicture for your state diagram."
        onChange={(event) => {
          setSource(event.target.value);
          setError("");
        }}
      />
      {error ? <p className="error">{error}</p> : null}
      <button
        type="button"
        onClick={() => {
          const imported = importTikZ(source);
          if (typeof imported === "string") {
            setError(imported);
            return;
          }
          importDiagram({
            kind: imported.kind,
            defaults: { nodeDistance: imported.nodeDistance, scale: imported.scale },
            nodes: imported.nodes,
            edges: imported.edges,
          });
          onImported();
        }}
      >
        Import
      </button>
      <p className="muted"><i>Note:</i> Diagrams created outside this website may not be supported.</p>
    </section>
  );
}
