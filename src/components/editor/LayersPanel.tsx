"use client";

import type { MouseEvent } from "react";
import { layerElements } from "@/core/ops/deckOperations";
import type { SlideElement } from "@/core/schema/deck";
import { useDeckStore } from "@/store/useDeckStore";

function elementLabel(element: SlideElement) {
  if (element.name) {
    return element.name;
  }

  if (element.type === "text") {
    const text = element.content.trim().replace(/\s+/g, " ");
    return text ? text.slice(0, 28) : "Text";
  }

  if (element.type === "shape") {
    return element.shape === "ellipse" ? "Ellipse" : "Rectangle";
  }

  return element.type === "image" ? "Image" : "HTML";
}

function elementTypeLabel(element: SlideElement) {
  const labels = {
    text: "文本",
    image: "图片",
    shape: "形状",
    html: "HTML",
  } as const;

  return labels[element.type];
}

export function LayersPanel() {
  const deck = useDeckStore((state) => state.deck);
  const currentSlideId = useDeckStore((state) => state.currentSlideId);
  const selectedElementIds = useDeckStore((state) => state.selectedElementIds);
  const selectElement = useDeckStore((state) => state.selectElement);
  const toggleElementSelection = useDeckStore((state) => state.toggleElementSelection);
  const toggleElementLocked = useDeckStore((state) => state.toggleElementLocked);
  const toggleElementHidden = useDeckStore((state) => state.toggleElementHidden);
  const slide = deck.slides.find((item) => item.id === currentSlideId) ?? deck.slides[0];
  const layers = layerElements(slide.elements);

  function handleLayerClick(event: MouseEvent<HTMLButtonElement>, element: SlideElement) {
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      toggleElementSelection(element.id);
      return;
    }

    selectElement(element.id);
  }

  return (
    <section className="layers-panel" aria-label="Layers">
      <div className="panel-heading">Layers</div>
      {layers.length === 0 ? (
        <div className="empty-state">当前页面没有元素。</div>
      ) : (
        <div className="layer-list">
          {layers.map((element) => {
            const isSelected = selectedElementIds.includes(element.id);
            return (
              <div
                key={element.id}
                className={`layer-row ${isSelected ? "is-selected" : ""} ${
                  element.hidden ? "is-hidden" : ""
                } ${element.groupId ? "is-grouped" : ""}`}
              >
                <button
                  type="button"
                  className="layer-main"
                  onClick={(event) => handleLayerClick(event, element)}
                  title={element.id}
                >
                  <span className="layer-type">{elementTypeLabel(element)}</span>
                  <span className="layer-name">{elementLabel(element)}</span>
                  {element.groupId ? <span className="layer-group">{element.groupId}</span> : null}
                </button>
                <button
                  type="button"
                  className="layer-icon-button"
                  aria-pressed={Boolean(element.locked)}
                  title={element.locked ? "解锁" : "锁定"}
                  onClick={() => toggleElementLocked(element.id)}
                >
                  {element.locked ? "锁" : "开"}
                </button>
                <button
                  type="button"
                  className="layer-icon-button"
                  aria-pressed={Boolean(element.hidden)}
                  title={element.hidden ? "显示" : "隐藏"}
                  onClick={() => toggleElementHidden(element.id)}
                >
                  {element.hidden ? "隐" : "显"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
