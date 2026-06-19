"use client";

import { useSourceHtmlStore } from "@/store/useSourceHtmlStore";

export function SlideThumbList() {
  const slideElements = useSourceHtmlStore((s) => s.slideElements);
  const currentIndex = useSourceHtmlStore((s) => s.currentIndex);
  const setCurrentIndex = useSourceHtmlStore((s) => s.setCurrentIndex);

  return (
    <nav className="slide-thumb-list" aria-label="幻灯片导航">
      {slideElements.map((el, i) => {
        const title = el.querySelector("h1,h2,[class*='h1'],[class*='h2'],[class*='hero'],[class*='title']")?.textContent?.trim().slice(0, 24) ?? `第 ${i + 1} 页`;
        return (
          <button
            key={i}
            type="button"
            className={`slide-thumb-item ${i === currentIndex ? "is-active" : ""}`}
            onClick={() => setCurrentIndex(i)}
          >
            <span className="slide-thumb-index">{i + 1}</span>
            <span className="slide-thumb-title">{title}</span>
          </button>
        );
      })}
    </nav>
  );
}
