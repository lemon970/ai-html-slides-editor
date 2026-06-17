"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import { layerElements } from "@/core/ops/deckOperations";
import type { SlideElement } from "@/core/schema/deck";
import { useDeckStore } from "@/store/useDeckStore";

function elementLabel(element: SlideElement) {
  if (element.name) {
    return element.name;
  }

  if (element.type === "text") {
    const text = element.content.trim().replace(/\s+/g, " ");
    return text ? text.slice(0, 28) : "文本";
  }

  if (element.type === "shape") {
    return element.shape === "ellipse" ? "椭圆" : "矩形";
  }

  return element.type === "image" ? "图片" : "HTML";
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
  const renameElementById = useDeckStore((state) => state.renameElementById);
  const executeCommand = useDeckStore((state) => state.executeCommand);
  const slide = deck.slides.find((item) => item.id === currentSlideId) ?? deck.slides[0];
  const layers = layerElements(slide.elements);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  function handleLayerClick(event: MouseEvent<HTMLButtonElement>, element: SlideElement) {
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      toggleElementSelection(element.id);
      return;
    }

    selectElement(element.id);
  }

  function targetElementIds(element: SlideElement) {
    return selectedElementIds.includes(element.id) ? selectedElementIds : [element.id];
  }

  function moveLayer(element: SlideElement, action: "bring-to-front" | "bring-forward" | "send-backward" | "send-to-back") {
    executeCommand({ type: "move-layer", elementIds: targetElementIds(element), action });
  }

  function handleLayerContextMenu(event: MouseEvent<HTMLDivElement>, element: SlideElement) {
    event.preventDefault();
    if (!selectedElementIds.includes(element.id)) {
      selectElement(element.id);
    }

    const elementIds = targetElementIds(element);
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          label: "复制",
          onSelect: () => executeCommand({ type: "copy-elements", elementIds }),
        },
        {
          label: "快速复制",
          onSelect: () => executeCommand({ type: "duplicate-elements", elementIds }),
        },
        {
          label: "删除",
          onSelect: () => executeCommand({ type: "delete-elements", elementIds }),
        },
        {
          label: element.locked ? "解锁" : "锁定",
          onSelect: () => executeCommand({ type: "toggle-locked", elementIds }),
        },
        {
          label: element.hidden ? "显示" : "隐藏",
          onSelect: () => executeCommand({ type: "toggle-hidden", elementIds }),
        },
        {
          label: "置顶",
          onSelect: () => executeCommand({ type: "move-layer", elementIds, action: "bring-to-front" }),
        },
        {
          label: "置底",
          onSelect: () => executeCommand({ type: "move-layer", elementIds, action: "send-to-back" }),
        },
      ],
    });
  }

  function handleRenameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  }

  function commitRename(element: SlideElement, value: string) {
    const nextName = value.trim();
    if (element.name ? nextName === element.name : nextName === elementLabel(element)) {
      return;
    }

    renameElementById(element.id, nextName);
  }

  return (
    <section className="layers-panel" aria-label="图层">
      <div className="panel-heading">图层</div>
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
                } ${element.locked ? "is-locked" : ""} ${element.groupId ? "is-grouped" : ""}`}
                onContextMenu={(event) => handleLayerContextMenu(event, element)}
              >
                <button
                  type="button"
                  className="layer-main"
                  onClick={(event) => handleLayerClick(event, element)}
                  title={element.id}
                >
                  <span className="layer-type">{elementTypeLabel(element)}</span>
                </button>
                <input
                  key={element.name ?? elementLabel(element)}
                  className="layer-name-input"
                  aria-label="图层名称"
                  defaultValue={element.name ?? elementLabel(element)}
                  onFocus={() => selectElement(element.id)}
                  onBlur={(event) => commitRename(element, event.target.value)}
                  onKeyDown={handleRenameKeyDown}
                />
                <div className="layer-controls">
                  <button
                    type="button"
                    className="layer-icon-button"
                    aria-pressed={Boolean(element.locked)}
                    title={element.locked ? "解锁" : "锁定"}
                    onClick={() => toggleElementLocked(element.id)}
                  >
                    {element.locked ? "解锁" : "锁定"}
                  </button>
                  <button
                    type="button"
                    className="layer-icon-button"
                    aria-pressed={Boolean(element.hidden)}
                    title={element.hidden ? "显示" : "隐藏"}
                    onClick={() => toggleElementHidden(element.id)}
                  >
                    {element.hidden ? "显示" : "隐藏"}
                  </button>
                  <button type="button" className="layer-icon-button" onClick={() => moveLayer(element, "bring-to-front")}>
                    置顶
                  </button>
                  <button type="button" className="layer-icon-button" onClick={() => moveLayer(element, "bring-forward")}>
                    上移
                  </button>
                  <button type="button" className="layer-icon-button" onClick={() => moveLayer(element, "send-backward")}>
                    下移
                  </button>
                  <button type="button" className="layer-icon-button" onClick={() => moveLayer(element, "send-to-back")}>
                    置底
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {contextMenu ? (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      ) : null}
    </section>
  );
}
