import { describe, expect, it } from "vitest";
import { dfaDiagram, pdaDiagram } from "../example";
import type { DiagramEdge, DiagramNode } from "../model/types";
import { compile, tokenize } from "./compile";
import { createEngine, stepEngine } from "./step";

function node(id: string, extra: Partial<DiagramNode> = {}): DiagramNode {
  return { id, label: id, col: 0, row: 0, ...extra };
}

function edge(id: string, source: string, target: string, label: string): DiagramEdge {
  return { id, source, target, label };
}

function run(kind: "dfa" | "pda" | "tm", nodes: DiagramNode[], edges: DiagramEdge[], input: string) {
  const machine = compile(kind, nodes, edges);
  expect(machine.errors).toEqual([]);
  let engine = createEngine(machine, tokenize(input));
  let guard = 0;
  while (engine.status === "ready" && guard < 20) {
    engine = stepEngine(engine, machine, tokenize(input));
    guard += 1;
  }
  return engine;
}

describe("simulator", () => {
  it("tokenizes characters and latex commands", () => {
    expect(tokenize("01 \\textvisiblespace\\varepsilon")).toEqual(["0", "1", "\\textvisiblespace"]);
  });

  it("accepts a DFA run and rejects a missing symbol", () => {
    const nodes = [node("q0", { initial: true }), node("q1", { accepting: true })];
    const edges = [edge("e1", "q0", "q1", "0")];
    expect(run("dfa", nodes, edges, "0").status).toBe("accepted");
    expect(run("dfa", nodes, edges, "1").status).toBe("rejected");
  });

  it("accepts an empty input through an epsilon transition", () => {
    const nodes = [node("q0", { initial: true }), node("q1", { accepting: true })];
    const edges = [edge("e1", "q0", "q1", "\\varepsilon")];
    const engine = run("dfa", nodes, edges, "");
    expect(engine.status).toBe("accepted");
    expect(engine.steps).toBe(1);
  });

  it("accepts when one branch matches", () => {
    const nodes = [
      node("q0", { initial: true }),
      node("q1", { accepting: true }),
      node("q2"),
    ];
    const edges = [edge("e1", "q0", "q1", "a"), edge("e2", "q0", "q2", "a")];
    const engine = run("dfa", nodes, edges, "a");
    expect(engine.status).toBe("accepted");
    expect(engine.configs.filter((config) => config.parentId === "c0")).toHaveLength(2);
  });

  it("pushes and pops a PDA stack", () => {
    const nodes = [
      node("q0", { initial: true }),
      node("q1"),
      node("q2", { accepting: true }),
    ];
    const edges = [
      edge("e1", "q0", "q1", "\\varepsilon,\\varepsilon\\to Z"),
      edge("e2", "q1", "q2", "a,Z\\to\\varepsilon"),
    ];
    expect(run("pda", nodes, edges, "a").status).toBe("accepted");
    expect(run("pda", nodes, edges, "").status).toBe("rejected");
  });

  it("writes a tape cell and moves the TM head", () => {
    const nodes = [node("q0", { initial: true }), node("q1", { accepting: true })];
    const edges = [edge("e1", "q0", "q1", "0\\to1,R")];
    const engine = run("tm", nodes, edges, "0");
    expect(engine.status).toBe("accepted");
    const accepted = engine.configs.find((config) => config.outcome === "accept");
    expect(accepted?.tape[0]).toBe("1");
    expect(accepted?.head).toBe(1);
  });

  it("rejects a TM with no move", () => {
    const nodes = [node("q0", { initial: true }), node("q1", { accepting: true })];
    const edges = [edge("e1", "q0", "q1", "1\\to1,R")];
    expect(run("tm", nodes, edges, "0").status).toBe("rejected");
  });

  it("loads the DFA and PDA examples", () => {
    expect(run("dfa", dfaDiagram.nodes, dfaDiagram.edges, "101").status).toBe("accepted");
    expect(run("dfa", dfaDiagram.nodes, dfaDiagram.edges, "11").status).toBe("rejected");
    expect(run("pda", pdaDiagram.nodes, pdaDiagram.edges, "").status).toBe("accepted");
    expect(run("pda", pdaDiagram.nodes, pdaDiagram.edges, "0011").status).toBe("accepted");
    expect(run("pda", pdaDiagram.nodes, pdaDiagram.edges, "001").status).toBe("rejected");
  });

  it("requires a single initial state", () => {
    expect(compile("dfa", [node("q0"), node("q1", { accepting: true })], []).errors).toContain(
      "Mark one state as initial.",
    );
  });
});