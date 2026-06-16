import type { SlideElement } from "@/core/schema/deck";

export function selectedGroupId(elements: SlideElement[], selectedElementIds: string[]) {
  const selectedElements = elements.filter((element) => selectedElementIds.includes(element.id));
  if (selectedElements.length === 0 || selectedElements.some((element) => !element.groupId)) {
    return null;
  }

  const groupIds = new Set(selectedElements.map((element) => element.groupId));

  return groupIds.size === 1 ? [...groupIds][0] : null;
}

export function elementIdsForGroup(elements: SlideElement[], groupId: string) {
  return elements.filter((element) => element.groupId === groupId).map((element) => element.id);
}

export function shouldSelectWholeGroup(element: SlideElement) {
  return Boolean(element.groupId);
}
