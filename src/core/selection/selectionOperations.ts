import type { Bounds } from "@/core/geometry/bounds";
import type { SlideElement } from "@/core/schema/deck";

export function selectOnly(elementId: string | null): string[] {
  return elementId ? [elementId] : [];
}

export function toggleSelection(selectedElementIds: string[], elementId: string): string[] {
  if (selectedElementIds.includes(elementId)) {
    return selectedElementIds.filter((id) => id !== elementId);
  }

  return [...selectedElementIds, elementId];
}

export function primarySelectedId(selectedElementIds: string[]): string | null {
  return selectedElementIds[0] ?? null;
}

export function normalizeSelection(selectedElementIds: string[]): string[] {
  return Array.from(new Set(selectedElementIds));
}

export function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function elementIdsInMarquee(elements: SlideElement[], marquee: Bounds): string[] {
  return elements
    .filter((element) => !element.locked && boundsIntersect(element, marquee))
    .map((element) => element.id);
}
