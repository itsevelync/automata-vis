import { LatexLabel } from "../canvas/LatexLabel";
import { SimConfig } from "../sim/step";
import { useDiagram } from "../store/diagram";

export default function DecisionTree({
  configs,
  labels,
}: {
  configs: SimConfig[];
  labels: Map<string, string>;
}) {
  const displaySizes = useDiagram((state) => state.displaySizes);
  const nodeSize = useDiagram((state) => state.nodeSize);
  const radiusOf = (state: string) => (displaySizes[state] ?? nodeSize) / 2;
  const byId = new Map(configs.map((config) => [config.id, config]));
  const levels = new Map<number, Map<string, SimConfig["outcome"]>>();
  for (const config of configs) {
    const row = levels.get(config.steps) ?? new Map();
    const current = row.get(config.state);
    row.set(config.state, betterOutcome(current, config.outcome));
    levels.set(config.steps, row);
  }
  const steps = [...levels.keys()].sort((left, right) => left - right);
  const rows = steps.map((step) => [...(levels.get(step)?.entries() ?? [])]);
  const links: { from: string; to: string }[] = [];
  const seen = new Set<string>();
  for (const config of configs) {
    if (!config.parentId) continue;
    const parent = previousLevel(config, byId);
    if (!parent) continue;
    const key = `${parent.steps}:${parent.state}:${config.steps}:${config.state}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({
      from: `${parent.steps}:${parent.state}`,
      to: `${config.steps}:${config.state}`,
    });
  }
  const gapX = 22;
  const gapY = 28;
  const pad = 8;
  const rowWidths = rows.map(
    (row) =>
      row.reduce((sum, [state]) => sum + radiusOf(state) * 2, 0) +
      gapX * Math.max(0, row.length - 1),
  );
  const width = pad * 2 + Math.max(1, ...rowWidths);
  const position = new Map<string, { x: number; y: number; r: number }>();
  let cursorY = pad;
  rows.forEach((row, level) => {
    const radii = row.map(([state]) => radiusOf(state));
    const maxR = Math.max(radiusOf(""), ...radii);
    cursorY += maxR;
    let cursorX = (width - rowWidths[level]) / 2;
    row.forEach(([state], index) => {
      const r = radii[index];
      cursorX += r;
      position.set(`${steps[level]}:${state}`, {
        x: cursorX,
        y: cursorY,
        r,
      });
      cursorX += r + gapX;
    });
    cursorY += maxR + gapY;
  });
  const height = Math.max(pad * 2, cursorY - gapY + pad);
  return (
    <svg
      className="level-tree"
      width={width}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Decision tree"
    >
      {links.map((link) => {
        const start = position.get(link.from);
        const end = position.get(link.to);
        if (!start || !end) return null;
        const segment = shorten(
          start.x,
          start.y,
          start.r + 1,
          end.x,
          end.y,
          end.r + 1,
        );
        return (
          <line
            key={`${link.from}-${link.to}`}
            x1={segment.x1}
            y1={segment.y1}
            x2={segment.x2}
            y2={segment.y2}
            stroke="#000000"
            strokeWidth={1}
          />
        );
      })}
      {rows.flatMap((row, level) =>
        row.map(([state, outcome]) => {
          const point = position.get(`${steps[level]}:${state}`);
          if (!point) return null;
          const label = labels.get(state) ?? state;
          return (
            <g key={`${steps[level]}:${state}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={point.r}
                fill="#ffffff"
                stroke="#000000"
                strokeWidth={outcome === "accept" ? 2.4 : 1}
                strokeDasharray={
                  outcome === "reject" || outcome === "loop"
                    ? "3 2"
                    : undefined
                }
              />
              {outcome === "accept" ? (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={point.r - 4}
                  fill="none"
                  stroke="#000000"
                  strokeWidth={1}
                />
              ) : null}
              <foreignObject
                x={point.x - point.r}
                y={point.y - point.r}
                width={point.r * 2}
                height={point.r * 2}
              >
                <div className="level-label">
                  <LatexLabel
                    className="state-token"
                    label={label}
                  />
                </div>
              </foreignObject>
            </g>
          );
        }),
      )}
    </svg>
  );
}

function previousLevel(config: SimConfig, byId: Map<string, SimConfig>): SimConfig | null {
  let current = config;
  while (current.parentId) {
    const parent = byId.get(current.parentId);
    if (!parent) return null;
    if (parent.steps !== config.steps) return parent;
    current = parent;
  }
  return null;
}

function betterOutcome(
  current: SimConfig["outcome"] | undefined,
  next: SimConfig["outcome"],
): SimConfig["outcome"] {
  const rank = { accept: 3, open: 2, reject: 1, loop: 0 };
  if (!current || rank[next] > rank[current]) return next;
  return current;
}

function shorten(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x1: x1 + (dx / length) * r1,
    y1: y1 + (dy / length) * r1,
    x2: x2 - (dx / length) * r2,
    y2: y2 - (dy / length) * r2,
  };
}
