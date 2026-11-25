import { describe, expect, it } from "vitest";
import { isValidId, nextStateId } from "./ids";
import {
  displayEdgeLabel,
  formatLabel,
  inputToLabel,
  joinLabels,
  joinTransition,
  labelToInput,
  mathSource,
  splitTransition,
  transitionText,
} from "./labels";

describe("formatLabel", () => {
  it("wraps plain math", () => {
    expect(formatLabel("q_0")).toBe("$q_0$");
  });

  it("joins extra lines into an array", () => {
    expect(joinLabels(["z\\to z,R", "y\\to y,R"])).toBe(
      "$\\begin{array}{c} z\\to z,R\\\\ y\\to y,R \\end{array}$",
    );
  });

  it("wraps every label as math, including arrays", () => {
    expect(formatLabel("$q_0$")).toBe("$q_0$");
    expect(formatLabel("$\\begin{array}{c} a \\end{array}$")).toBe(
      "$\\begin{array}{c} a \\end{array}$",
    );
    expect(formatLabel("\\begin{array}{c} a \\end{array}")).toBe(
      "$\\begin{array}{c} a \\end{array}$",
    );
    expect(mathSource("1\\tob").source).toBe("1\\to b");
    expect(mathSource("$").source).toBe("\\$");
    expect(mathSource("\\$").source).toBe("\\$");
    expect(mathSource("#").source).toBe("\\#");
    expect(mathSource("\\#").source).toBe("\\#");
    expect(formatLabel("a,Z\\toaZ")).toBe("$a,Z\\to aZ$");
  });
});

describe("label input symbols", () => {
  it("shows epsilon and visible space in the input", () => {
    expect(labelToInput("\\varepsilon\\to\\sqcup")).toBe("\u03b5\\to\u2423");
    expect(inputToLabel("\u03b5\u2423")).toBe("\\varepsilon\\sqcup");
    expect(inputToLabel("$")).toBe("\\$");
    expect(labelToInput("\\$")).toBe("$");
    expect(inputToLabel("#")).toBe("\\#");
    expect(labelToInput("\\#")).toBe("#");
  });
});

describe("transition labels", () => {
  it("formats a TM label as read, write, move", () => {
    expect(joinTransition(["1", "y", "R"], "tm")).toBe("1\\toy,R");
    expect(splitTransition("1\\toy,R", "tm")).toEqual(["1", "y", "R"]);
  });

  it("formats a PDA label as input, pop, push", () => {
    expect(joinTransition(["a", "Z", "aZ"], "pda")).toBe("a,Z\\toaZ");
    expect(splitTransition("a,Z\\toaZ", "pda")).toEqual(["a", "Z", "aZ"]);
  });

  it("keeps an empty transition empty", () => {
    expect(joinTransition(["", "", ""], "tm")).toBe("");
    expect(splitTransition("", "pda")).toEqual(["", "", ""]);
  });

  it("renders empty inputs as varepsilon", () => {
    expect(displayEdgeLabel([""], "dfa")).toBe("\\varepsilon");
    expect(displayEdgeLabel(["0", "1"], "dfa")).toBe("0,1");
    expect(displayEdgeLabel(["1\\to,R"], "tm")).toBe("1\\to\\sqcup,R");
    expect(displayEdgeLabel([""], "tm")).toBe("\\sqcup\\to\\sqcup,R");
    expect(displayEdgeLabel(["a,\\to"], "pda")).toBe("a,\\varepsilon\\to\\varepsilon");
    expect(displayEdgeLabel([""], "pda")).toBe("\\varepsilon,\\varepsilon\\to\\varepsilon");
    expect(transitionText(undefined, "\\varepsilon,\\varepsilon\\to\\$", "pda")).toEqual([
      "\\varepsilon,\\varepsilon\\to\\$",
    ]);
  });
});

describe("ids", () => {
  it("accepts TikZ names and suggests the next q id", () => {
    expect(isValidId("qa")).toBe(true);
    expect(isValidId("q0")).toBe(true);
    expect(isValidId("1q")).toBe(false);
    expect(isValidId("q_0")).toBe(false);
    expect(nextStateId(["q0", "q1", "qa"])).toBe("q2");
  });
});
