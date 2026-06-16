import type { Deck, SlideBackground } from "@/core/schema/deck";

export function updateSlideBackground(
  deck: Deck,
  slideId: string,
  background: SlideBackground,
): Deck {
  return {
    ...deck,
    slides: deck.slides.map((slide) =>
      slide.id === slideId
        ? {
            ...slide,
            background,
          }
        : slide,
    ),
  };
}
