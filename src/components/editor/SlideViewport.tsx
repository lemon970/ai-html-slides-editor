"use client";

import { SlideCanvas } from "./SlideCanvas";
import { useDeckStore } from "@/store/useDeckStore";

export function SlideViewport() {
  const deck = useDeckStore((state) => state.deck);
  const currentSlideId = useDeckStore((state) => state.currentSlideId);
  const slide = deck.slides.find((item) => item.id === currentSlideId) ?? deck.slides[0];

  return (
    <section className="slide-viewport" aria-label="Current slide">
      <div className="viewport-stage">
        <SlideCanvas slide={slide} deckSize={deck.size} mode="editable" />
      </div>
    </section>
  );
}
