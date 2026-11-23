import { formatLabel } from "../model/labels";
import { formatLength, parseLength } from "../model/length";
import type { Diagram, DiagramEdge, DiagramNode, LabelPos } from "../model/types";
import { placeNodes } from "./place";

function nodeOptions(node: DiagramNode): string {
  const options = ["state"];
  if (node.initial) options.push("initial");
  if (node.accepting) options.push("accepting");
  return options.join(",");
}

function formatNode(node: DiagramNode, placement: string | null): string {
  const where = placement ? ` [${placement}]` : "";
  return `    \\node[${nodeOptions(node)}] (${node.id})${where} {${formatLabel(node.label)}};`;
}

function formatLabelPos(pos?: LabelPos): string {
  if (!pos) return "";
  if (pos.distance) return ` [${pos.side}=${pos.distance}]`;
  return ` [${pos.side}]`;
}

function isLoop(edge: DiagramEdge): boolean {
  return edge.source === edge.target || edge.loop !== undefined;
}

function formatEdge(edge: DiagramEdge): string {
  const options: string[] = [];
  if (isLoop(edge)) options.push(`loop ${edge.loop ?? "right"}`);
  else if (edge.bend) {
    options.push(
      edge.bendAngle === undefined ? `bend ${edge.bend}` : `bend ${edge.bend}=${edge.bendAngle}`,
    );
  }
  const optionText = options.length ? ` [${options.join(", ")}]` : "";
  const label = edge.label
    ? ` node${formatLabelPos(edge.labelPos)} {${formatLabel(edge.label)}}`
    : "";
  const target = isLoop(edge) ? "()" : `(${edge.target})`;
  return `    (${edge.source}) edge${optionText}${label} ${target}`;
}

export function generateTikZ(diagram: Diagram): string {
  const distance = parseLength(diagram.defaults.nodeDistance);
  if (!distance) throw new Error("Invalid node distance");
  const lines = [
    "\\begin{tikzpicture}[",
    "    ->,",
    "    >=stealth',",
    "    shorten >=1pt,",
    "    auto,",
    "    on grid,",
    `    node distance=${formatLength(distance)},`,
    `    scale=${diagram.defaults.scale},`,
    "    transform shape",
    "]",
  ];
  for (const placed of placeNodes(diagram.nodes, distance)) {
    lines.push(formatNode(placed.node, placed.placement));
  }
  if (diagram.edges.length > 0) {
    lines.push("    \\path");
    diagram.edges.forEach((edge, index) => {
      const end = index === diagram.edges.length - 1 ? ";" : "";
      lines.push(`${formatEdge(edge)}${end}`);
    });
  }
  lines.push("\\end{tikzpicture}");
  return lines.join("\n");
}
