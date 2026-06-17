"use client";

import { SlideCanvas } from "./SlideCanvas";
import { useDeckStore } from "@/store/useDeckStore";

export function SlideNavigator() {
  const deck = useDeckStore((state) => state.deck);
  const currentSlideId = useDeckStore((state) => state.currentSlideId);
  const selectSlide = useDeckStore((state) => state.selectSlide);
  const addSlide = useDeckStore((state) => state.addSlide);
  const duplicateSlide = useDeckStore((state) => state.duplicateSlide);
  const deleteSlide = useDeckStore((state) => state.deleteSlide);
  const moveSlide = useDeckStore((state) => state.moveSlide);

  return (
    <aside className="slide-navigator" aria-label="幻灯片">
      <div className="panel-heading">幻灯片</div>
      <div className="slide-list">
        {deck.slides.map((slide, index) => (
          <div key={slide.id} className="slide-thumb-wrapper">
            <button
              type="button"
              className={`slide-thumb ${slide.id === currentSlideId ? "is-active" : ""}`}
              onClick={() => selectSlide(slide.id)}
            >
              <span className="slide-thumb-number">{index + 1}</span>
              <SlideCanvas slide={slide} deckSize={deck.size} mode="thumbnail" />
            </button>
            <div className="slide-thumb-actions">
              <button
                type="button"
                title="复制页面"
                onClick={() => duplicateSlide(slide.id)}
              >
                ⎘
              </button>
              <button
                type="button"
                title="上移"
                disabled={index === 0}
                onClick={() => moveSlide(slide.id, index - 1)}
              >
                ↑
              </button>
              <button
                type="button"
                title="下移"
                disabled={index === deck.slides.length - 1}
                onClick={() => moveSlide(slide.id, index + 1)}
              >
                ↓
              </button>
              <button
                type="button"
                title="删除页面"
                disabled={deck.slides.length <= 1}
                onClick={() => deleteSlide(slide.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="add-slide-button" onClick={() => addSlide()}>
        + 新建幻灯片
      </button>
    </aside>
  );
}
