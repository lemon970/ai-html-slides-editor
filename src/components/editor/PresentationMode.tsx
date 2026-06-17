"use client";

import { useEffect, useState } from "react";
import type { Deck } from "@/core/schema/deck";
import { SlideCanvas } from "./SlideCanvas";

type Props = {
  deck: Deck;
  startSlideId: string;
  onClose: () => void;
};

export function PresentationMode({ deck, startSlideId, onClose }: Props) {
  const startIndex = deck.slides.findIndex((s) => s.id === startSlideId);
  const [index, setIndex] = useState(startIndex >= 0 ? startIndex : 0);

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown")
        setIndex((i) => Math.min(i + 1, deck.slides.length - 1));
      if (e.key === "ArrowLeft" || e.key === "PageUp")
        setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, deck.slides.length]);

  const slide = deck.slides[index];

  return (
    <div className="presentation-overlay">
      <div className="presentation-stage">
        <SlideCanvas slide={slide} deckSize={deck.size} mode="thumbnail" />
      </div>
      <div className="presentation-hud">
        <button type="button" onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          disabled={index === 0}>← 上一页</button>
        <span>{index + 1} / {deck.slides.length}</span>
        <button type="button" onClick={() => setIndex((i) => Math.min(i + 1, deck.slides.length - 1))}
          disabled={index === deck.slides.length - 1}>下一页 →</button>
        <button type="button" className="presentation-close" onClick={onClose}>✕ 退出</button>
      </div>
    </div>
  );
}
