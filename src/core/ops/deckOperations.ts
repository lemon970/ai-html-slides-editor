import type { Deck, SlideElement } from "@/core/schema/deck";

type ElementPatch = Partial<SlideElement> & {
  style?: Record<string, unknown>;
};

function mergeElement(element: SlideElement, patch: ElementPatch): SlideElement {
  const next = {
    ...element,
    ...patch,
    style:
      "style" in patch
        ? {
            ...("style" in element ? element.style : {}),
            ...patch.style,
          }
        : "style" in element
          ? element.style
          : undefined,
  } as SlideElement;

  return next;
}

export function getSlide(deck: Deck, slideId: string) {
  return deck.slides.find((slide) => slide.id === slideId);
}

export function getElement(deck: Deck, slideId: string, elementId: string) {
  return getSlide(deck, slideId)?.elements.find((element) => element.id === elementId);
}

export function updateElement(
  deck: Deck,
  slideId: string,
  elementId: string,
  patch: ElementPatch,
): Deck {
  return {
    ...deck,
    slides: deck.slides.map((slide) => {
      if (slide.id !== slideId) {
        return slide;
      }

      return {
        ...slide,
        elements: slide.elements.map((element) =>
          element.id === elementId ? mergeElement(element, patch) : element,
        ),
      };
    }),
  };
}

export function updateElements(
  deck: Deck,
  slideId: string,
  patchesByElementId: Record<string, ElementPatch>,
): Deck {
  const patchIds = new Set(Object.keys(patchesByElementId));
  if (patchIds.size === 0) {
    return deck;
  }

  return {
    ...deck,
    slides: deck.slides.map((slide) => {
      if (slide.id !== slideId) {
        return slide;
      }

      return {
        ...slide,
        elements: slide.elements.map((element) =>
          patchIds.has(element.id) && !element.locked
            ? mergeElement(element, patchesByElementId[element.id])
            : element,
        ),
      };
    }),
  };
}

export function groupElements(
  deck: Deck,
  slideId: string,
  elementIds: string[],
  groupId: string,
): Deck {
  const ids = new Set(elementIds);
  if (ids.size < 2) {
    return deck;
  }

  return updateElements(
    deck,
    slideId,
    Object.fromEntries([...ids].map((elementId) => [elementId, { groupId }])),
  );
}

export function ungroupElements(deck: Deck, slideId: string, groupId: string): Deck {
  const slide = getSlide(deck, slideId);
  if (!slide) {
    return deck;
  }

  return updateElements(
    deck,
    slideId,
    Object.fromEntries(
      slide.elements
        .filter((element) => element.groupId === groupId)
        .map((element) => [element.id, { groupId: undefined }]),
    ),
  );
}

export function replaceDeck(deck: Deck): Deck {
  return {
    ...deck,
    slides: deck.slides.map((slide) => ({
      ...slide,
      elements: slide.elements.map((element) => ({ ...element })),
    })),
  };
}

export function sortElements(elements: SlideElement[]) {
  return [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
}
