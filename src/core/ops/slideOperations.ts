import type { Deck, SlideBackground, SlideTransition } from "@/core/schema/deck";

function patchSlide<T extends object>(deck: Deck, slideId: string, patch: T): Deck {
  return {
    ...deck,
    slides: deck.slides.map((slide) =>
      slide.id === slideId ? { ...slide, ...patch } : slide,
    ),
  };
}

export function updateSlideBackground(deck: Deck, slideId: string, background: SlideBackground): Deck {
  return patchSlide(deck, slideId, { background });
}

export function updateSlideNotes(deck: Deck, slideId: string, notes: string): Deck {
  return patchSlide(deck, slideId, { notes: notes || undefined });
}

export function updateSlideTransition(deck: Deck, slideId: string, transition: SlideTransition | undefined): Deck {
  return patchSlide(deck, slideId, { transition });
}
