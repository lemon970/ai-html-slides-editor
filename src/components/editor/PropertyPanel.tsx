"use client";

import type { ChangeEvent } from "react";
import { getElement } from "@/core/ops/deckOperations";
import { useDeckStore } from "@/store/useDeckStore";

function numberValue(value: number | undefined) {
  return Number.isFinite(value) ? String(value) : "";
}

export function PropertyPanel() {
  const deck = useDeckStore((state) => state.deck);
  const currentSlideId = useDeckStore((state) => state.currentSlideId);
  const selectedElementId = useDeckStore((state) => state.selectedElementId);
  const updateSelectedElement = useDeckStore((state) => state.updateSelectedElement);
  const element = selectedElementId ? getElement(deck, currentSlideId, selectedElementId) : null;

  function updateTextContent(event: ChangeEvent<HTMLTextAreaElement>) {
    updateSelectedElement({ content: event.target.value });
  }

  function updateStyle(key: string, value: string | number) {
    updateSelectedElement({ style: { [key]: value } });
  }

  return (
    <aside className="property-panel" aria-label="Properties">
      <div className="panel-heading">Properties</div>
      {!element ? (
        <div className="empty-state">选择画布中的元素后编辑属性。</div>
      ) : (
        <div className="property-stack">
          <div className="property-meta">
            <span>{element.type}</span>
            <code>{element.id}</code>
          </div>

          <label>
            X
            <input
              type="number"
              value={Math.round(element.x)}
              onChange={(event) => updateSelectedElement({ x: Number(event.target.value) })}
            />
          </label>
          <label>
            Y
            <input
              type="number"
              value={Math.round(element.y)}
              onChange={(event) => updateSelectedElement({ y: Number(event.target.value) })}
            />
          </label>

          {element.type === "text" ? (
            <>
              <label>
                文本
                <textarea value={element.content} onChange={updateTextContent} rows={5} />
              </label>
              <label>
                字号
                <input
                  type="number"
                  min="8"
                  value={numberValue(element.style.fontSize)}
                  onChange={(event) => updateStyle("fontSize", Number(event.target.value))}
                />
              </label>
              <label>
                颜色
                <input
                  type="color"
                  value={element.style.color ?? "#111111"}
                  onChange={(event) => updateStyle("color", event.target.value)}
                />
              </label>
              <label>
                背景
                <input
                  type="color"
                  value={element.style.background ?? "#ffffff"}
                  onChange={(event) => updateStyle("background", event.target.value)}
                />
              </label>
            </>
          ) : null}

          {element.type === "shape" ? (
            <>
              <label>
                填充
                <input
                  type="color"
                  value={element.style.fill ?? "#2563eb"}
                  onChange={(event) => updateStyle("fill", event.target.value)}
                />
              </label>
              <label>
                圆角
                <input
                  type="number"
                  min="0"
                  value={numberValue(element.style.borderRadius)}
                  onChange={(event) => updateStyle("borderRadius", Number(event.target.value))}
                />
              </label>
            </>
          ) : null}

          {element.type === "image" ? (
            <>
              <label>
                图片地址
                <input
                  type="text"
                  value={element.src}
                  onChange={(event) => updateSelectedElement({ src: event.target.value })}
                />
              </label>
              <label>
                背景
                <input
                  type="color"
                  value={element.style.background ?? "#ffffff"}
                  onChange={(event) => updateStyle("background", event.target.value)}
                />
              </label>
            </>
          ) : null}
        </div>
      )}
    </aside>
  );
}
