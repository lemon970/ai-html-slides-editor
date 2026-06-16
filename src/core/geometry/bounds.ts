import type { SlideElement } from "@/core/schema/deck";

export type Bounds = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export function elementBounds(element: SlideElement): Bounds {
  return {
    x: element.x,
    y: element.y,
    w: element.w,
    h: element.h,
  };
}

export function boundsFromElements(elements: SlideElement[]): Bounds | null {
  if (elements.length === 0) {
    return null;
  }

  const left = Math.min(...elements.map((element) => element.x));
  const top = Math.min(...elements.map((element) => element.y));
  const right = Math.max(...elements.map((element) => element.x + element.w));
  const bottom = Math.max(...elements.map((element) => element.y + element.h));

  return {
    x: left,
    y: top,
    w: right - left,
    h: bottom - top,
  };
}

export function clampSize(bounds: Bounds, minW = 24, minH = 24): Bounds {
  return {
    ...bounds,
    w: Math.max(bounds.w, minW),
    h: Math.max(bounds.h, minH),
  };
}

export function clampToCanvas(bounds: Bounds, canvas: { width: number; height: number }): Bounds {
  const w = Math.min(bounds.w, canvas.width);
  const h = Math.min(bounds.h, canvas.height);
  return {
    x: Math.min(Math.max(bounds.x, 0), canvas.width - w),
    y: Math.min(Math.max(bounds.y, 0), canvas.height - h),
    w,
    h,
  };
}
