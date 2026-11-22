import { describe, expect, it } from "vitest";
import { DEFAULT_STATE_NODE_SIZE, fittedDiameter, snapCenter, STATE_INNER_SEP } from "./geometry";

describe("snapCenter", () => {
  it("snaps a center onto the same grid the lines use", () => {
    expect(snapCenter(32, 40, 120)).toEqual({ col: 0, row: 0, x: 0, y: 0 });
    expect(snapCenter(90, 200, 120)).toEqual({ col: 1, row: 2, x: 120, y: 240 });
  });
});

describe("fittedDiameter", () => {
  it("keeps the TikZ minimum when the label fits", () => {
    expect(fittedDiameter(4, 4)).toBeCloseTo(DEFAULT_STATE_NODE_SIZE);
  });

  it("grows by the text-corner radius plus inner sep", () => {
    const width = 40;
    const height = 10;
    const expected = 2 * Math.hypot(width / 2 + STATE_INNER_SEP, height / 2 + STATE_INNER_SEP);
    expect(fittedDiameter(width, height)).toBeCloseTo(expected);
    expect(expected).toBeGreaterThan(DEFAULT_STATE_NODE_SIZE);
  });
});
