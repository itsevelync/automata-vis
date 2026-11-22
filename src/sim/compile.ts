import { splitTransition, transitionText } from "../model/labels";
import type { AutomataKind, DiagramEdge, DiagramNode } from "../model/types";

export const EPSILON = "\\varepsilon";
export const BLANK = "\\textvisiblespace";
export const STEP_CAP = 500;
export const BRANCH_CAP = 80;

export interface CompiledTransition {
  edgeId: string;
  source: string;
  target: string;
  read: string;
  pop: string;
  push: string[];
  write: string;
  move: "L" | "R";
}

export interface Machine {
  kind: AutomataKind;
  initial: string | null;
  accepting: string[];
  transitions: CompiledTransition[];
  errors: string[];
}

export function isEpsilon(symbol: string): boolean {
  const trimmed = symbol.trim();
  return trimmed === "" || trimmed === EPSILON;
}

export function tokenize(input: string): string[] {
  const symbols: string[] = [];
  let index = 0;
  while (index < input.length) {
    const char = input[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (char === "\\") {
      let end = index + 1;
      while (end < input.length && /[A-Za-z]/.test(input[end])) end += 1;
      const command = end > index + 1 ? input.slice(index, end) : input.slice(index, index + 1);
      index = end > index + 1 ? end : index + 1;
      if (!isEpsilon(command)) symbols.push(command);
      continue;
    }
    symbols.push(char);
    index += 1;
  }
  return symbols;
}

function tokenizePush(value: string): string[] {
  if (isEpsilon(value)) return [];
  return tokenize(value);
}

export function compile(kind: AutomataKind, nodes: DiagramNode[], edges: DiagramEdge[]): Machine {
  const errors: string[] = [];
  if (nodes.length === 0) errors.push("Add a state.");
  const initials = nodes.filter((node) => node.initial);
  if (nodes.length > 0 && initials.length === 0) errors.push("Mark one state as initial.");
  if (initials.length > 1) errors.push("Mark only one state as initial.");
  if (nodes.length > 0 && !nodes.some((node) => node.accepting)) {
    errors.push("Mark at least one state as accepting.");
  }
  const transitions: CompiledTransition[] = [];
  for (const edge of edges) {
    const raw = edge.lines && edge.lines.length > 0 ? edge.lines : [edge.label ?? ""];
    raw.forEach((line, index) => {
      if (kind !== "dfa" && line.trim() && !line.includes("\\to")) {
        errors.push(`Edge ${edge.id} label ${index + 1} is missing \\to.`);
      }
    });
    transitionText(edge.lines, edge.label, kind).forEach((line) => {
      if (kind === "dfa") {
        transitions.push({
          edgeId: edge.id,
          source: edge.source,
          target: edge.target,
          read: isEpsilon(line) ? "" : line.trim(),
          pop: "",
          push: [],
          write: "",
          move: "R",
        });
        return;
      }
      const [first, second, third] = splitTransition(line, kind).map((part) => part.trim());
      if (kind === "tm") {
        transitions.push({
          edgeId: edge.id,
          source: edge.source,
          target: edge.target,
          read: first,
          pop: "",
          push: [],
          write: second || EPSILON,
          move: third === "L" ? "L" : "R",
        });
        return;
      }
      transitions.push({
        edgeId: edge.id,
        source: edge.source,
        target: edge.target,
        read: isEpsilon(first) ? "" : first,
        pop: isEpsilon(second) ? "" : second,
        push: tokenizePush(third),
        write: "",
        move: "R",
      });
    });
  }
  return {
    kind,
    initial: initials.length === 1 ? initials[0].id : null,
    accepting: nodes.filter((node) => node.accepting).map((node) => node.id),
    transitions,
    errors,
  };
}
