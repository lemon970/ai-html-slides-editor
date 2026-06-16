"use client";

import { SlideCanvas } from "./SlideCanvas";
import { useDeckStore } from "@/store/useDeckStore";

export function SlideNavigator() {
  const deck = useDeckStore((state) => state.deck);
  const currentSlideId = useDeckStore((state) => state.currentSlideId);
  const selectSlide = useDeckStore((state) => state.selectSlide);

  return (
    <aside className="slide-navigator" aria-label="幻灯片">
      <div className="panel-heading">幻灯片</div>
      <div className="slide-list">
        {deck.slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={`slide-thumb ${slide.id === currentSlideId ? "is-active" : ""}`}
            onClick={() => selectSlide(slide.id)}
          >
            <span className="slide-thumb-number">{index + 1}</span>
            <SlideCanvas slide={slide} deckSize={deck.size} mode="thumbnail" />
          </button>
        ))}
      </div>
    </aside>
  );
}
