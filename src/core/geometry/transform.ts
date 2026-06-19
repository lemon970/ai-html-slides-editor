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
  lockAspect = false,
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

  if (lockAspect && (handle === "ne" || handle === "nw" || handle === "se" || handle === "sw")) {
    const aspect = start.w / start.h;
    const dw = Math.abs(next.w - start.w) / start.w;
    const dh = Math.abs(next.h - start.h) / start.h;
    if (dw >= dh) {
      next.h = Math.max(minH, Math.round(next.w / aspect));
      if (handle.includes("n")) next.y = start.y + start.h - next.h;
    } else {
      next.w = Math.max(minW, Math.round(next.h * aspect));
      if (handle.includes("w")) next.x = start.x + start.w - next.w;
    }
  }

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

export function scaleBoundsWithinFrame(
  start: Bounds,
  startFrame: Bounds,
  nextFrame: Bounds,
): Bounds {
  const scaleX = startFrame.w === 0 ? 1 : nextFrame.w / startFrame.w;
  const scaleY = startFrame.h === 0 ? 1 : nextFrame.h / startFrame.h;

  return {
    x: Math.round(nextFrame.x + (start.x - startFrame.x) * scaleX),
    y: Math.round(nextFrame.y + (start.y - startFrame.y) * scaleY),
    w: Math.max(1, Math.round(start.w * scaleX)),
    h: Math.max(1, Math.round(start.h * scaleY)),
  };
}
