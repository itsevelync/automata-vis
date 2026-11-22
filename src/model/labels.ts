import type { AutomataKind } from "./types";

export function mathSource(label: string): { source: string; displayMode: boolean } {
  const trimmed = label.trim();
  if (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length > 4) {
    return { source: trimmed.slice(2, -2), displayMode: true };
  }
  if (trimmed.startsWith("$") && trimmed.endsWith("$") && trimmed.length > 2) {
    const source = trimmed.slice(1, -1);
    return { source, displayMode: source.includes("\\begin") };
  }
  return { source: trimmed, displayMode: trimmed.includes("\\begin") };
}

const EPSILON = "\\varepsilon";
const BLANK = "\\textvisiblespace";
const INPUT_SYMBOLS: [string, string][] = [
  [BLANK, "\u2423"],
  [EPSILON, "\u03b5"],
];

export function labelToInput(value: string): string {
  return INPUT_SYMBOLS.reduce((text, [command, symbol]) => text.replaceAll(command, symbol), value);
}

export function inputToLabel(value: string): string {
  return INPUT_SYMBOLS.reduce((text, [command, symbol]) => text.replaceAll(symbol, command), value);
}

export function displayEdgeLabel(lines: string[], kind: AutomataKind): string {
  const rendered = lines.map((line) => renderEdgeLine(line, kind));
  if (kind === "dfa") return rendered.join(",");
  return joinLabels(rendered);
}

export function transitionText(
  lines: string[] | undefined,
  label: string | undefined,
  kind: AutomataKind,
): string[] {
  const raw = lines && lines.length > 0 ? lines : splitLabelLines(label ?? "");
  return raw.map((line) => renderEdgeLine(line, kind));
}

function splitLabelLines(label: string): string[] {
  const source = label.trim().replace(/^\$/, "").replace(/\$$/, "").trim();
  const match = source.match(/^\\begin\{array\}\{c\}([\s\S]*)\\end\{array\}$/);
  if (!match) return [source];
  return match[1]
    .split("\\\\")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

function renderEdgeLine(line: string, kind: AutomataKind): string {
  if (kind === "dfa") return line === "" ? EPSILON : line;
  const parts = splitTransition(line, kind).map((part, index) => {
    if (part !== "") return part;
    if (kind === "tm" && index === 2) return "R";
    return EPSILON;
  }) as TransitionParts;
  return joinTransition(parts, kind);
}

export function joinLabels(lines: string[]): string {
  if (lines.length <= 1) return lines[0] ?? "";
  return `$\\begin{array}{c} ${lines.join("\\\\ ")} \\end{array}$`;
}

export type TransitionKind = "tm" | "pda";
export type TransitionParts = [string, string, string];

const ARROW = "\\to";

export function splitTransition(line: string, kind: TransitionKind): TransitionParts {
  const arrow = line.indexOf(ARROW);
  if (arrow < 0) return [line, "", ""];
  const left = line.slice(0, arrow);
  const right = line.slice(arrow + ARROW.length);
  if (kind === "tm") {
    const comma = right.indexOf(",");
    if (comma < 0) return [left, right, ""];
    return [left, right.slice(0, comma), right.slice(comma + 1)];
  }
  const comma = left.indexOf(",");
  if (comma < 0) return [left, "", right];
  return [left.slice(0, comma), left.slice(comma + 1), right];
}

export function joinTransition(parts: TransitionParts, kind: TransitionKind): string {
  if (parts.every((part) => part === "")) return "";
  const [first, second, third] = parts;
  if (kind === "tm") return `${first}${ARROW}${second},${third}`;
  return `${first},${second}${ARROW}${third}`;
}

export function formatLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("$")) return trimmed;
  return `$${trimmed}$`;
}
