import type { Deck, SlideElement } from "@/core/schema/deck";
import { getSlide } from "./deckOperations";

export type LayerMoveAction = "bring-to-front" | "send-to-back" | "bring-forward" | "send-backward";

function sortedBackToFront(elements: SlideElement[]) {
  return [...elements].sort((a, b) => {
    const zDiff = (a.zIndex ?? 0) - (b.zIndex ?? 0);
    return zDiff === 0 ? elements.indexOf(a) - elements.indexOf(b) : zDiff;
  });
}

function reorderSelectedBlock(
  ordered: SlideElement[],
  selectedIds: Set<string>,
  action: LayerMoveAction,
) {
  const movable = ordered.filter((element) => selectedIds.has(element.id) && !element.locked);
  if (movable.length === 0) {
    return ordered;
  }

  const movableIds = new Set(movable.map((element) => element.id));
  const remaining = ordered.filter((element) => !movableIds.has(element.id));

  if (action === "send-to-back") {
    return [...movable, ...remaining];
  }

  if (action === "bring-to-front") {
    return [...remaining, ...movable];
  }

  const firstIndex = ordered.findIndex((element) => movableIds.has(element.id));
  const lastIndex =
    ordered.length - 1 - [...ordered].reverse().findIndex((element) => movableIds.has(element.id));

  if (action === "send-backward") {
    const targetIndex = Math.max(0, firstIndex - 1);
    const withoutMovable = [...remaining];
    withoutMovable.splice(targetIndex, 0, ...movable);
    return withoutMovable;
  }

  const targetIndex = Math.min(remaining.length, lastIndex - movable.length + 2);
  const withoutMovable = [...remaining];
  withoutMovable.splice(targetIndex, 0, ...movable);
  return withoutMovable;
}

export function moveElementsInLayerOrder(
  deck: Deck,
  slideId: string,
  elementIds: string[],
  action: LayerMoveAction,
): Deck {
  const slide = getSlide(deck, slideId);
  const selectedIds = new Set(elementIds);
  if (!slide || selectedIds.size === 0) {
    return deck;
  }

  const ordered = sortedBackToFront(slide.elements);
  const movableIds = new Set(
    ordered
      .filter((element) => selectedIds.has(element.id) && !element.locked)
      .map((element) => element.id),
  );
  if (movableIds.size === 0) {
    return deck;
  }

  const reordered = reorderSelectedBlock(ordered, selectedIds, action);
  const zIndexById = Object.fromEntries(
    reordered.map((element, index) => [element.id, index]),
  );

  const changed = slide.elements.some((element) => (element.zIndex ?? 0) !== zIndexById[element.id]);
  if (!changed) {
    return deck;
  }

  return {
    ...deck,
    slides: deck.slides.map((item) =>
      item.id === slideId
        ? {
            ...item,
            elements: item.elements.map((element) => ({
              ...element,
              zIndex: zIndexById[element.id],
            })),
          }
        : item,
    ),
  };
}
