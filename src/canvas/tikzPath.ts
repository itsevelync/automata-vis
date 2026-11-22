import type { Side } from "../model/types";

export interface Point {
  x: number;
  y: number;
}

export interface Circle {
  x: number;
  y: number;
  r: number;
}

export interface Curve {
  start: Point;
  c1: Point;
  c2: Point;
  end: Point;
}

const CONTROL_FACTOR = 0.3915;

export function loopAngles(side: Side): { out: number; inn: number } {
  if (side === "right") return { out: 15, inn: -15 };
  if (side === "above") return { out: 105, inn: 75 };
  if (side === "left") return { out: 195, inn: 165 };
  return { out: 285, inn: 255 };
}

export function bendAngles(bend: "left" | "right", angle = 30): { out: number; inn: number } {
  if (bend === "left") return { out: angle, inn: 180 - angle };
  return { out: -angle, inn: 180 + angle };
}

function polar(deg: number, distance: number): Point {
  const radians = (deg * Math.PI) / 180;
  return {
    x: distance * Math.cos(radians),
    y: -distance * Math.sin(radians),
  };
}

function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

function sub(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

function scale(point: Point, factor: number): Point {
  return { x: point.x * factor, y: point.y * factor };
}

function length(point: Point): number {
  return Math.hypot(point.x, point.y);
}

function normalize(point: Point): Point {
  const magnitude = length(point) || 1;
  return scale(point, 1 / magnitude);
}

function rotateTikz(point: Point, deg: number): Point {
  const radians = (deg * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: point.x * cos + point.y * sin,
    y: -point.x * sin + point.y * cos,
  };
}

function borderToward(circle: Circle, direction: Point): Point {
  const unit = normalize(direction);
  return add(circle, scale(unit, circle.r));
}

function borderAt(circle: Circle, deg: number): Point {
  return add(circle, polar(deg, circle.r));
}

function controlDistance(from: Point, to: Point, looseness: number, minDistance: number): number {
  const span = length(sub(to, from));
  return Math.max(minDistance, CONTROL_FACTOR * span * looseness);
}

export function straightEdge(source: Circle, target: Circle): Curve | null {
  const delta = sub(target, source);
  if (length(delta) <= source.r + target.r) return null;
  const unit = normalize(delta);
  return {
    start: add(source, scale(unit, source.r)),
    c1: add(source, scale(unit, source.r)),
    c2: sub(target, scale(unit, target.r)),
    end: sub(target, scale(unit, target.r)),
  };
}

export function bendEdge(
  source: Circle,
  target: Circle,
  bend: "left" | "right",
  angle = 30,
): Curve | null {
  const delta = sub(target, source);
  if (length(delta) === 0) return null;
  const { out, inn } = bendAngles(bend, angle);
  const start = borderToward(source, rotateTikz(delta, out));
  const end = borderToward(target, rotateTikz(delta, inn));
  const distance = controlDistance(start, end, 1, 0);
  const travel = normalize(sub(end, start));
  const left = { x: travel.y, y: -travel.x };
  return {
    start,
    end,
    c1: add(add(start, scale(travel, distance * Math.cos((out * Math.PI) / 180))), scale(left, distance * Math.sin((out * Math.PI) / 180))),
    c2: add(add(end, scale(travel, distance * Math.cos((inn * Math.PI) / 180))), scale(left, distance * Math.sin((inn * Math.PI) / 180))),
  };
}

export function loopEdge(circle: Circle, side: Side, minDistance: number): Curve {
  const { out, inn } = loopAngles(side);
  const start = borderAt(circle, out);
  const end = borderAt(circle, inn);
  const distance = controlDistance(start, end, 8, minDistance);
  return {
    start,
    end,
    c1: add(start, polar(out, distance)),
    c2: add(end, polar(inn, distance)),
  };
}

export function curvePoint(curve: Curve, t: number): Point {
  const u = 1 - t;
  return {
    x:
      u * u * u * curve.start.x +
      3 * u * u * t * curve.c1.x +
      3 * u * t * t * curve.c2.x +
      t * t * t * curve.end.x,
    y:
      u * u * u * curve.start.y +
      3 * u * u * t * curve.c1.y +
      3 * u * t * t * curve.c2.y +
      t * t * t * curve.end.y,
  };
}

export function curveTangent(curve: Curve, t = 0.5): Point {
  const u = 1 - t;
  const d1 = sub(curve.c1, curve.start);
  const d2 = sub(curve.c2, curve.c1);
  const d3 = sub(curve.end, curve.c2);
  return {
    x: 3 * u * u * d1.x + 6 * u * t * d2.x + 3 * t * t * d3.x,
    y: 3 * u * u * d1.y + 6 * u * t * d2.y + 3 * t * t * d3.y,
  };
}

export function labelCenter(
  point: Point,
  tangent: Point,
  width: number,
  height: number,
  placement: { side: Side; distance: number } | null,
  gap = 0,
): Point {
  if (placement?.side === "right") {
    return { x: point.x + placement.distance + width / 2, y: point.y };
  }
  if (placement?.side === "left") {
    return { x: point.x - placement.distance - width / 2, y: point.y };
  }
  if (placement?.side === "below") {
    return { x: point.x, y: point.y + placement.distance + height / 2 };
  }
  if (placement?.side === "above") {
    return { x: point.x, y: point.y - placement.distance - height / 2 };
  }
  const span = Math.hypot(tangent.x, tangent.y) || 1;
  const nx = tangent.y / span;
  const ny = -tangent.x / span;
  const reach = Math.abs(nx) * width / 2 + Math.abs(ny) * height / 2 + gap;
  return { x: point.x + nx * reach, y: point.y + ny * reach };
}

export function curvePath(curve: Curve, straight = false): string {
  if (straight) return `M ${curve.start.x} ${curve.start.y} L ${curve.end.x} ${curve.end.y}`;
  return `M ${curve.start.x} ${curve.start.y} C ${curve.c1.x} ${curve.c1.y} ${curve.c2.x} ${curve.c2.y} ${curve.end.x} ${curve.end.y}`;
}
