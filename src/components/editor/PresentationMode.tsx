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
  const [elapsed, setElapsed] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
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
  const transType = slide.transition?.type ?? "none";
  const transDur = slide.transition?.duration ?? 0.4;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const progress = deck.slides.length > 1 ? (index / (deck.slides.length - 1)) * 100 : 100;

  return (
    <div className="presentation-overlay">
      <div className="presentation-progress-bar">
        <div className="presentation-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="presentation-stage">
        <div
          key={index}
          className={`presentation-slide-wrapper pres-trans-${transType}`}
          style={{ "--pres-dur": `${transDur}s` } as React.CSSProperties}
        >
          <SlideCanvas slide={slide} deckSize={deck.size} mode="thumbnail" />
        </div>
      </div>
      {showNotes && slide.notes && (
        <div className="presentation-notes">{slide.notes}</div>
      )}
      <div className="presentation-hud">
        <button type="button" onClick={() => setIndex((i) => Math.max(i - 1, 0))} disabled={index === 0}>←</button>
        <span className="pres-page">{index + 1} / {deck.slides.length}</span>
        <button type="button" onClick={() => setIndex((i) => Math.min(i + 1, deck.slides.length - 1))} disabled={index === deck.slides.length - 1}>→</button>
        <span className="pres-timer">{mm}:{ss}</span>
        {slide.notes && (
          <button
            type="button"
            className={showNotes ? "tb-btn toolbar-btn-active" : "tb-btn"}
            onClick={() => setShowNotes((v) => !v)}
            title="演讲者备注"
          >
            备注
          </button>
        )}
        <button type="button" className="presentation-close" onClick={onClose}>✕ 退出</button>
      </div>
    </div>
  );
}
