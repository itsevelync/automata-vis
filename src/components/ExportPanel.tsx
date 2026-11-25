import { useMemo, useState } from "react";
import { useDiagram } from "../store/diagram";
import { generateTikZ } from "../tikz/generate";

const TIKZ_PREAMBLE = "\\usepackage{tikz}\n\\usetikzlibrary{automata,arrows,positioning}";

export function ExportPanel() {
  const nodes = useDiagram((state) => state.nodes);
  const edges = useDiagram((state) => state.edges);
  const nodeDistance = useDiagram((state) => state.nodeDistance);
  const scale = useDiagram((state) => state.scale);
  const [copied, setCopied] = useState<"preamble" | "tikz" | null>(null);
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
        <h2>Packages</h2>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(TIKZ_PREAMBLE).then(() => {
              setCopied("preamble");
              window.setTimeout(() => setCopied(null), 1200);
            });
          }}
        >
          {copied === "preamble" ? "Copied" : "Copy"}
        </button>
      </div>
      <textarea id="tikz-preamble" className="tikz-preamble" readOnly value={TIKZ_PREAMBLE} spellCheck={false} rows={2} />
      <div className="panel-head">
        <h2>State Diagram</h2>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(tikz).then(() => {
              setCopied("tikz");
              window.setTimeout(() => setCopied(null), 1200);
            });
          }}
        >
          {copied === "tikz" ? "Copied" : "Copy"}
        </button>
      </div>
      <textarea id="tikz-code" readOnly value={tikz} spellCheck={false} />
      <p className="muted"><i>Tip:</i> Adjust <span className="code">scale=1</span> to ensure your state diagram fits on the page.</p>
    </section>
  );
}
