import type { Bounds } from "./bounds";
import { clampSize } from "./bounds";

export type ResizeHandle =
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "nw";

export function moveBounds(start: Bounds, delta: { x: number; y: number }): Bounds {
  return {
    ...start,
    x: Math.round(start.x + delta.x),
    y: Math.round(start.y + delta.y),
  };
}

export function resizeBounds(
  start: Bounds,
  handle: ResizeHandle,
  delta: { x: number; y: number },
  minimum: { w?: number; h?: number } = {},
): Bounds {
  let next = { ...start };

  if (handle.includes("e")) {
    next.w = start.w + delta.x;
  }
  if (handle.includes("s")) {
    next.h = start.h + delta.y;
  }
  if (handle.includes("w")) {
    next.x = start.x + delta.x;
    next.w = start.w - delta.x;
  }
  if (handle.includes("n")) {
    next.y = start.y + delta.y;
    next.h = start.h - delta.y;
  }

  const minW = minimum.w ?? 24;
  const minH = minimum.h ?? 24;

  if (next.w < minW) {
    if (handle.includes("w")) {
      next.x = start.x + start.w - minW;
    }
    next.w = minW;
  }

  if (next.h < minH) {
    if (handle.includes("n")) {
      next.y = start.y + start.h - minH;
    }
    next.h = minH;
  }

  return clampSize(
    {
      x: Math.round(next.x),
      y: Math.round(next.y),
      w: Math.round(next.w),
      h: Math.round(next.h),
    },
    minW,
    minH,
  );
}

export function rotationFromPointer(
  center: { x: number; y: number },
  pointer: { x: number; y: number },
) {
  const radians = Math.atan2(pointer.y - center.y, pointer.x - center.x);
  return Math.round((radians * 180) / Math.PI + 90);
}
