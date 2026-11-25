import { describe, expect, it } from "vitest";
import { dfaEnds101Diagram, dfaDiv3Diagram, nfaEnds101Diagram, pda0n1nDiagram } from "../example";
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
    expect(tokenize("01 \\sqcup\\varepsilon")).toEqual(["0", "1", "\\sqcup"]);
    expect(tokenize("\\#\\$")).toEqual(["#", "$"]);
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
  });

  it("treats read-1 and read-1-then-epsilon as one configuration", () => {
    const nodes = [node("q0", { initial: true }), node("q1"), node("q2"), node("q3", { accepting: true })];
    const edges = [
      edge("e1", "q0", "q1", "1"),
      edge("e2", "q0", "q2", "1"),
      edge("e3", "q2", "q1", "\\varepsilon"),
      edge("e4", "q1", "q3", "0"),
    ];
    const machine = compile("dfa", nodes, edges);
    const symbols = tokenize("10");
    const engine = stepEngine(createEngine(machine, symbols), machine, symbols);
    const states = engine.frontier.map((id) => engine.configs.find((config) => config.id === id)?.state);
    expect(states.filter((state) => state === "q1")).toEqual(["q1"]);
  });

  it("explores a repeated configuration once", () => {
    const nodes = [node("q0", { initial: true }), node("q1"), node("q2", { accepting: true })];
    const edges = [edge("e1", "q0", "q1", "a"), edge("e2", "q0", "q1", "a"), edge("e3", "q1", "q2", "b")];
    const machine = compile("dfa", nodes, edges);
    let engine = createEngine(machine, tokenize("ab"));
    engine = stepEngine(engine, machine, tokenize("ab"));
    expect(engine.frontier).toHaveLength(1);
    engine = stepEngine(engine, machine, tokenize("ab"));
    expect(engine.status).toBe("accepted");
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
    expect(run("dfa", dfaEnds101Diagram.nodes, dfaEnds101Diagram.edges, "101").status).toBe("accepted");
    expect(run("dfa", dfaEnds101Diagram.nodes, dfaEnds101Diagram.edges, "11").status).toBe("rejected");
    expect(run("dfa", dfaDiv3Diagram.nodes, dfaDiv3Diagram.edges, "110").status).toBe("accepted");
    expect(run("dfa", dfaDiv3Diagram.nodes, dfaDiv3Diagram.edges, "1").status).toBe("rejected");
    expect(run("dfa", nfaEnds101Diagram.nodes, nfaEnds101Diagram.edges, "101").status).toBe("accepted");
    expect(run("dfa", nfaEnds101Diagram.nodes, nfaEnds101Diagram.edges, "101").steps).toBe(3);
    expect(run("dfa", nfaEnds101Diagram.nodes, nfaEnds101Diagram.edges, "100").status).toBe("rejected");
    expect(run("pda", pda0n1nDiagram.nodes, pda0n1nDiagram.edges, "").status).toBe("accepted");
    const pda = compile("pda", pda0n1nDiagram.nodes, pda0n1nDiagram.edges);
    const started = createEngine(pda, tokenize("0011"));
    expect(started.frontier.map((id) => started.configs.find((config) => config.id === id)?.state)).toContain("q1");
    expect(run("pda", pda0n1nDiagram.nodes, pda0n1nDiagram.edges, "0011").status).toBe("accepted");
    expect(run("pda", pda0n1nDiagram.nodes, pda0n1nDiagram.edges, "001").status).toBe("rejected");
  });

  it("pops a hash from the stack", () => {
    const nodes = [node("q0", { initial: true }), node("q1", { accepting: true })];
    const edges = [
      edge("e1", "q0", "q0", "#,\\varepsilon\\to\\#"),
      edge("e2", "q0", "q1", "\\varepsilon,\\#\\to\\varepsilon"),
    ];
    const machine = compile("pda", nodes, edges);
    expect(machine.transitions.map((item) => [item.pop, item.push])).toEqual([
      ["", ["#"]],
      ["#", []],
    ]);
    expect(run("pda", nodes, edges, "#").status).toBe("accepted");
  });

  it("keeps an epsilon move after the last PDA symbol", () => {
    const nodes = [
      node("q1", { initial: true, accepting: true }),
      node("q2", { accepting: true }),
    ];
    const edges = [
      edge("e1", "q1", "q1", "0,\\varepsilon\\to 0"),
      edge("e2", "q1", "q2", "\\varepsilon,\\varepsilon\\to\\varepsilon"),
    ];
    const machine = compile("pda", nodes, edges);
    const symbols = tokenize("00");
    let engine = createEngine(machine, symbols);
    engine = stepEngine(engine, machine, symbols);
    engine = stepEngine(engine, machine, symbols);
    const bottom = engine.configs.filter((config) => config.steps === engine.steps).map((config) => config.state);
    expect(bottom).toContain("q1");
    expect(bottom).toContain("q2");
  });

  it("rejects a Turing machine epsilon transition", () => {
    const nodes = [node("q0", { initial: true }), node("q1", { accepting: true })];
    const edges = [edge("e1", "q0", "q1", "\\varepsilon\\to\\varepsilon,R")];
    expect(compile("tm", nodes, edges).errors.join(" ")).toContain("ε-transition");
  });

  it("requires a single initial state", () => {
    expect(compile("dfa", [node("q0"), node("q1", { accepting: true })], []).errors).toContain(
      "Mark one state as initial.",
    );
  });
});