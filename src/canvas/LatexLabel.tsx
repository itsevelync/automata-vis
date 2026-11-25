import katex from "katex";
import { mathSource } from "../model/labels";

export function LatexLabel({ label, className="example-math" }: { label: string; className?: string }) {
  const { source, displayMode } = mathSource(label);
  if (!source) return null;
  const html = katex.renderToString(source, {
    throwOnError: false,
    displayMode,
    macros: {
      "\\sqcup":
        "\\kern.07em\\rule{0.4pt}{0.3ex}\\rule{0.28em}{0.4pt}\\rule{0.4pt}{0.3ex}\\kern.07em",
    },
  });
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}