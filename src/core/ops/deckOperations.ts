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

export function visibleElements(elements: SlideElement[]) {
  return elements.filter((element) => !element.hidden);
}

export function layerElements(elements: SlideElement[]) {
  return sortElements(elements).reverse();
}

export function deleteElements(deck: Deck, slideId: string, elementIds: string[]): Deck {
  const ids = new Set(elementIds);
  if (ids.size === 0) {
    return deck;
  }

  return {
    ...deck,
    slides: deck.slides.map((slide) => {
      if (slide.id !== slideId) {
        return slide;
      }

      const elements = slide.elements.filter((element) => !ids.has(element.id) || element.locked);
      if (elements.length === slide.elements.length) {
        return slide;
      }

      return {
        ...slide,
        elements,
      };
    }),
  };
}

export type DuplicateElementOptions = {
  idFactory: (element: SlideElement, index: number) => string;
  groupIdFactory: (groupId: string) => string;
  offset?: { x: number; y: number };
};

export function duplicateElements(
  deck: Deck,
  slideId: string,
  elementIds: string[],
  options: DuplicateElementOptions,
): { deck: Deck; duplicatedElementIds: string[] } {
  const ids = new Set(elementIds);
  const slide = getSlide(deck, slideId);
  if (!slide || ids.size === 0) {
    return { deck, duplicatedElementIds: [] };
  }

  const offset = options.offset ?? { x: 24, y: 24 };
  const groupIdMap = new Map<string, string>();
  const sourceElements = slide.elements.filter((element) => ids.has(element.id) && !element.locked);

  if (sourceElements.length === 0) {
    return { deck, duplicatedElementIds: [] };
  }

  const duplicatedElements = sourceElements.map((element, index) => {
    const nextGroupId = element.groupId
      ? (groupIdMap.get(element.groupId) ??
        (() => {
          const groupId = options.groupIdFactory(element.groupId);
          groupIdMap.set(element.groupId, groupId);
          return groupId;
        })())
      : undefined;

    return {
      ...structuredClone(element),
      id: options.idFactory(element, index),
      x: element.x + offset.x,
      y: element.y + offset.y,
      locked: false,
      hidden: false,
      groupId: nextGroupId,
      name: element.name ? `${element.name} 副本` : undefined,
    } as SlideElement;
  });

  return {
    deck: {
      ...deck,
      slides: deck.slides.map((item) =>
        item.id === slideId
          ? {
              ...item,
              elements: [...item.elements, ...duplicatedElements],
            }
          : item,
      ),
    },
    duplicatedElementIds: duplicatedElements.map((element) => element.id),
  };
}

export function nudgeElements(
  deck: Deck,
  slideId: string,
  elementIds: string[],
  delta: { x: number; y: number },
): Deck {
  const slide = getSlide(deck, slideId);
  if (!slide || elementIds.length === 0) {
    return deck;
  }

  const patches = Object.fromEntries(
    slide.elements
      .filter((element) => elementIds.includes(element.id) && !element.locked)
      .map((element) => [
        element.id,
        {
          x: element.x + delta.x,
          y: element.y + delta.y,
        },
      ]),
  );

  return updateElements(deck, slideId, patches);
}
