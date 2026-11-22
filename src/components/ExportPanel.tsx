import { useMemo, useState } from "react";
import { useDiagram } from "../store/diagram";
import { generateTikZ } from "../tikz/generate";

export function ExportPanel() {
  const nodes = useDiagram((state) => state.nodes);
  const edges = useDiagram((state) => state.edges);
  const nodeDistance = useDiagram((state) => state.nodeDistance);
  const scale = useDiagram((state) => state.scale);
  const [copied, setCopied] = useState(false);
  const tikz = useMemo(
    () =>
      generateTikZ({
        defaults: { nodeDistance, scale },
        nodes,
        edges,
      }),
    [nodes, edges, nodeDistance, scale],
  );

  return (
    <section className="panel export-panel">
      <div className="panel-head">
        <h2>TikZ</h2>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(tikz).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            });
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <textarea readOnly value={tikz} spellCheck={false} />
    </section>
  );
}
