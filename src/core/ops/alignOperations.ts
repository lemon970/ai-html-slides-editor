import type { SlideElement } from "@/core/schema/deck";
import { boundsFromElements } from "@/core/geometry/bounds";

export type AlignAxis = "left" | "hCenter" | "right" | "top" | "vCenter" | "bottom";

export function alignElements(
  elements: SlideElement[],
  ids: string[],
  axis: AlignAxis,
  canvasSize: { width: number; height: number },
): Record<string, { x?: number; y?: number }> {
  const targets = elements.filter((e) => ids.includes(e.id) && !e.locked);
  if (targets.length === 0) return {};

  const ref =
    targets.length === 1
      ? { x: 0, y: 0, w: canvasSize.width, h: canvasSize.height }
      : boundsFromElements(targets)!;

  const patches: Record<string, { x?: number; y?: number }> = {};

  for (const el of targets) {
    if (axis === "left") patches[el.id] = { x: ref.x };
    else if (axis === "hCenter") patches[el.id] = { x: Math.round(ref.x + (ref.w - el.w) / 2) };
    else if (axis === "right") patches[el.id] = { x: ref.x + ref.w - el.w };
    else if (axis === "top") patches[el.id] = { y: ref.y };
    else if (axis === "vCenter") patches[el.id] = { y: Math.round(ref.y + (ref.h - el.h) / 2) };
    else if (axis === "bottom") patches[el.id] = { y: ref.y + ref.h - el.h };
  }

  return patches;
}

export function distributeElements(
  elements: SlideElement[],
  ids: string[],
  axis: "horizontal" | "vertical",
): Record<string, { x?: number; y?: number }> {
  const targets = elements.filter((e) => ids.includes(e.id) && !e.locked);
  if (targets.length < 3) return {};

  const sorted = [...targets].sort((a, b) =>
    axis === "horizontal" ? a.x - b.x : a.y - b.y,
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalSpan =
    axis === "horizontal"
      ? last.x + last.w - first.x
      : last.y + last.h - first.y;
  const totalSize = sorted.reduce((s, e) => s + (axis === "horizontal" ? e.w : e.h), 0);
  const gap = (totalSpan - totalSize) / (sorted.length - 1);

  const patches: Record<string, { x?: number; y?: number }> = {};
  let cursor = axis === "horizontal" ? first.x : first.y;

  for (const el of sorted) {
    if (axis === "horizontal") {
      patches[el.id] = { x: Math.round(cursor) };
      cursor += el.w + gap;
    } else {
      patches[el.id] = { y: Math.round(cursor) };
      cursor += el.h + gap;
    }
  }

  return patches;
}
