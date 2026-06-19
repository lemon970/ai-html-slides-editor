import type { Bounds } from "./bounds";

export type SnapGuide = { axis: "x" | "y"; position: number };

export function snapPosition(
  dragging: Bounds,
  others: Bounds[],
  canvasSize: { width: number; height: number },
  threshold = 6,
  gridSize: number | null = null,
): { x: number; y: number; guides: SnapGuide[] } {
  let { x, y } = dragging;
  const guides: SnapGuide[] = [];

  const dxPoints = [x, x + dragging.w / 2, x + dragging.w];
  const dyPoints = [y, y + dragging.h / 2, y + dragging.h];

  const xTargets = [0, canvasSize.width / 2, canvasSize.width];
  const yTargets = [0, canvasSize.height / 2, canvasSize.height];
  for (const b of others) {
    xTargets.push(b.x, b.x + b.w / 2, b.x + b.w);
    yTargets.push(b.y, b.y + b.h / 2, b.y + b.h);
  }

  let bestXDelta = threshold;
  for (const dp of dxPoints) {
    for (const t of xTargets) {
      const d = t - dp;
      if (Math.abs(d) < Math.abs(bestXDelta)) bestXDelta = d;
    }
  }
  if (Math.abs(bestXDelta) < threshold) {
    x += bestXDelta;
    const snapped = dxPoints.map((p) => p + bestXDelta);
    for (const t of xTargets) {
      if (snapped.some((p) => Math.abs(p - t) < 0.5)) guides.push({ axis: "x", position: t });
    }
  } else if (gridSize) {
    x = Math.round(x / gridSize) * gridSize;
  }

  let bestYDelta = threshold;
  for (const dp of dyPoints) {
    for (const t of yTargets) {
      const d = t - dp;
      if (Math.abs(d) < Math.abs(bestYDelta)) bestYDelta = d;
    }
  }
  if (Math.abs(bestYDelta) < threshold) {
    y += bestYDelta;
    const snapped = dyPoints.map((p) => p + bestYDelta);
    for (const t of yTargets) {
      if (snapped.some((p) => Math.abs(p - t) < 0.5)) guides.push({ axis: "y", position: t });
    }
  } else if (gridSize) {
    y = Math.round(y / gridSize) * gridSize;
  }

  return { x, y, guides };
}
