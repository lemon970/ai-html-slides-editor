"use client";

import { useEffect, useState } from "react";
import { getElement } from "@/core/ops/deckOperations";
import type { ImageElement, ShapeElement, TextElement } from "@/core/schema/deck";
import { useDeckStore } from "@/store/useDeckStore";
import { BackgroundSection } from "./inspectors/BackgroundSection";
import { BorderSection } from "./inspectors/BorderSection";
import { FillSection } from "./inspectors/FillSection";
import { LayoutSection } from "./inspectors/LayoutSection";
import { ShadowSection } from "./inspectors/ShadowSection";
import { TextSection } from "./inspectors/TextSection";

export function PropertyPanel() {
  const deck = useDeckStore((state) => state.deck);
  const currentSlideId = useDeckStore((state) => state.currentSlideId);
  const selectedElementId = useDeckStore((state) => state.selectedElementId);
  const updateSelectedElement = useDeckStore((state) => state.updateSelectedElement);
  const updateCurrentSlideBackground = useDeckStore(
    (state) => state.updateCurrentSlideBackground,
  );
  const element = selectedElementId ? getElement(deck, currentSlideId, selectedElementId) : null;
  const slide = deck.slides.find((item) => item.id === currentSlideId) ?? deck.slides[0];
  const zValues = slide.elements.map((item) => item.zIndex ?? 0);
  const zRange = {
    min: Math.min(...zValues, 0),
    max: Math.max(...zValues, 0),
  };
  const [isTextOverflowing, setIsTextOverflowing] = useState(false);

  useEffect(() => {
    if (!element || element.type !== "text") {
      setIsTextOverflowing(false);
      return;
    }

    const node = document.querySelector<HTMLElement>(
      `.slide-viewport [data-element-id="${CSS.escape(element.id)}"]`,
    );
    if (!node) {
      setIsTextOverflowing(false);
      return;
    }

    setIsTextOverflowing(node.scrollHeight > node.clientHeight + 2);
  }, [element]);

  function updateStyle(style: Record<string, string | number>) {
    updateSelectedElement({ style });
  }

  function fitTextHeight(textElement: TextElement) {
    const node = document.querySelector<HTMLElement>(
      `.slide-viewport [data-element-id="${CSS.escape(textElement.id)}"]`,
    );
    if (!node) {
      return;
    }

    updateSelectedElement({ h: Math.ceil(node.scrollHeight + 4) });
  }

  return (
    <aside className="property-panel" aria-label="Properties">
      <div className="panel-heading">Properties</div>
      {!element ? (
        <div className="property-stack">
          <div className="empty-state">未选择元素，正在编辑当前页面。</div>
          <BackgroundSection
            background={slide.background}
            onChange={updateCurrentSlideBackground}
          />
        </div>
      ) : (
        <div className="property-stack">
          <div className="property-meta">
            <span>{element.type}</span>
            <code>{element.id}</code>
          </div>

          <LayoutSection
            element={element}
            slideSize={deck.size}
            zRange={zRange}
            onChange={updateSelectedElement}
          />

          {element.type === "text" ? (
            <>
              <TextSection
                element={element}
                onElementChange={updateSelectedElement}
                onStyleChange={updateStyle}
                isOverflowing={isTextOverflowing}
                onFitHeight={() => fitTextHeight(element)}
              />
              <FillSection
                element={element}
                onElementChange={updateSelectedElement as (patch: Partial<ImageElement>) => void}
                onStyleChange={updateStyle}
              />
              <BorderSection element={element} onStyleChange={updateStyle} />
              <ShadowSection element={element} onStyleChange={updateStyle} />
            </>
          ) : null}

          {element.type === "shape" ? (
            <>
              <FillSection
                element={element}
                onElementChange={updateSelectedElement as (patch: Partial<ImageElement>) => void}
                onStyleChange={updateStyle}
              />
              <BorderSection element={element as ShapeElement} onStyleChange={updateStyle} />
              <ShadowSection element={element as ShapeElement} onStyleChange={updateStyle} />
            </>
          ) : null}

          {element.type === "image" ? (
            <>
              <FillSection
                element={element}
                onElementChange={updateSelectedElement as (patch: Partial<ImageElement>) => void}
                onStyleChange={updateStyle}
              />
              <BorderSection element={element} onStyleChange={updateStyle} />
              <ShadowSection element={element} onStyleChange={updateStyle} />
            </>
          ) : null}
        </div>
      )}
    </aside>
  );
}
