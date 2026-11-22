import { describe, expect, it } from "vitest";
import { STATE_INNER_SEP } from "./geometry";
import { bendEdge, curvePoint, labelCenter, loopEdge, straightEdge } from "./tikzPath";

const source = { x: 0, y: 0, r: 32 };
const right = { x: 120, y: 0, r: 32 };

describe("tikz paths", () => {
  it("draws a straight edge from border to border", () => {
    const curve = straightEdge(source, right);
    expect(curve).not.toBeNull();
    expect(curve!.start.x).toBeCloseTo(32);
    expect(curve!.end.x).toBeCloseTo(88);
    expect(curve!.start.y).toBeCloseTo(0);
  });

  it("puts a right loop on the right of the node", () => {
    const curve = loopEdge(source, "right", 20);
    expect(curve.start.x).toBeGreaterThan(source.r * 0.9);
    expect(curve.end.x).toBeGreaterThan(source.r * 0.9);
    expect(curvePoint(curve, 0.5).x).toBeGreaterThan(source.r + 20);
  });

  it("puts a left loop on the left of the node", () => {
    const curve = loopEdge(source, "left", 20);
    expect(curve.start.x).toBeLessThan(-source.r * 0.9);
    expect(curvePoint(curve, 0.5).x).toBeLessThan(-source.r - 20);
  });

  it("puts above and below loops on those sides", () => {
    expect(curvePoint(loopEdge(source, "above", 20), 0.5).y).toBeLessThan(-source.r);
    expect(curvePoint(loopEdge(source, "below", 20), 0.5).y).toBeGreaterThan(source.r);
  });

  it("bends left of the direction of travel", () => {
    const curve = bendEdge(source, right, "left");
    expect(curve).not.toBeNull();
    expect(curvePoint(curve!, 0.5).y).toBeLessThan(0);
  });

  it("bends less when the angle is smaller", () => {
    const gentle = bendEdge(source, right, "left", 10);
    const sharp = bendEdge(source, right, "left", 60);
    expect(gentle).not.toBeNull();
    expect(sharp).not.toBeNull();
    expect(curvePoint(gentle!, 0.5).y).toBeGreaterThan(curvePoint(sharp!, 0.5).y);
  });

  it("bends right of the direction of travel", () => {
    const curve = bendEdge(source, right, "right");
    expect(curve).not.toBeNull();
    expect(curvePoint(curve!, 0.5).y).toBeGreaterThan(0);
  });

  it("places an auto label on the TikZ left of the path", () => {
    const center = labelCenter({ x: 0, y: 0 }, { x: 1, y: 0 }, 20, 10, null, STATE_INNER_SEP);
    expect(center.y).toBeCloseTo(-(5 + STATE_INNER_SEP));
    expect(center.x).toBeCloseTo(0);
  });

  it("anchors an explicit below label by its top edge", () => {
    const center = labelCenter({ x: 0, y: 0 }, { x: 1, y: 0 }, 20, 10, {
      side: "below",
      distance: 32,
    });
    expect(center).toEqual({ x: 0, y: 37 });
  });

  it("arrives on the right side when bending right", () => {
    const curve = bendEdge({ x: 0, y: 100, r: 20 }, { x: 0, y: 0, r: 20 }, "right");
    expect(curve).not.toBeNull();
    expect(curve!.end.x).toBeGreaterThan(0);
    expect(curve!.start.x).toBeGreaterThan(0);
  });
});
