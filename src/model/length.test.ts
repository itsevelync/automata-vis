import { describe, expect, it } from "vitest";
import { formatLength, multiplyLength, parseLength } from "./length";

describe("parseLength", () => {
  it("accepts a positive length with a unit", () => {
    expect(parseLength("3cm")).toEqual({ magnitude: 3, unit: "cm" });
    expect(parseLength("1.5cm")).toEqual({ magnitude: 1.5, unit: "cm" });
    expect(parseLength("12mm")).toEqual({ magnitude: 12, unit: "mm" });
    expect(parseLength(".5em")).toEqual({ magnitude: 0.5, unit: "em" });
  });

  it("rejects two-part, unitless, and non-positive values", () => {
    expect(parseLength("3cm and 4cm")).toBeNull();
    expect(parseLength("3")).toBeNull();
    expect(parseLength("0cm")).toBeNull();
    expect(parseLength("-1cm")).toBeNull();
    expect(parseLength("3.cm")).toBeNull();
  });
});

describe("multiplyLength", () => {
  it("keeps the unit and multiplies the number", () => {
    const length = parseLength("3cm");
    expect(length).not.toBeNull();
    expect(formatLength(multiplyLength(length!, 2))).toBe("6cm");
  });
});
