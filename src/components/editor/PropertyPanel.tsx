"use client";

import { useEffect, useState } from "react";
import { getElement } from "@/core/ops/deckOperations";
import type { ImageElement, ShapeElement, TextElement } from "@/core/schema/deck";
import { useDeckStore } from "@/store/useDeckStore";
import { AnimationSection } from "./inspectors/AnimationSection";
import { BackgroundSection } from "./inspectors/BackgroundSection";
import { BorderSection } from "./inspectors/BorderSection";
import { ClipSection } from "./inspectors/ClipSection";
import { FillSection } from "./inspectors/FillSection";
import { InspectorSection, Field, SegmentedControl } from "./inspectors/InspectorFields";
import { LayoutSection } from "./inspectors/LayoutSection";
import { ShadowSection } from "./inspectors/ShadowSection";
import { TextSection } from "./inspectors/TextSection";

const TRANS_TYPES = [
  { label: "无", value: "none" },
  { label: "淡入", value: "fade" },
  { label: "滑动", value: "slide" },
  { label: "推移", value: "push" },
] as const;

export function PropertyPanel() {
  const deck = useDeckStore((state) => state.deck);
  const currentSlideId = useDeckStore((state) => state.currentSlideId);
  const selectedElementId = useDeckStore((state) => state.selectedElementId);
  const selectedElementIds = useDeckStore((state) => state.selectedElementIds);
  const updateSelectedElement = useDeckStore((state) => state.updateSelectedElement);
  const updateCurrentSlideBackground = useDeckStore((state) => state.updateCurrentSlideBackground);
  const updateCurrentSlideNotes = useDeckStore((state) => state.updateCurrentSlideNotes);
  const updateCurrentSlideTransition = useDeckStore((state) => state.updateCurrentSlideTransition);

  const element =
    selectedElementIds.length === 1 && selectedElementId
      ? getElement(deck, currentSlideId, selectedElementId)
      : null;
  const slide = deck.slides.find((item) => item.id === currentSlideId) ?? deck.slides[0];
  const zValues = slide.elements.map((item) => item.zIndex ?? 0);
  const zRange = { min: Math.min(...zValues, 0), max: Math.max(...zValues, 0) };
  const [notesValue, setNotesValue] = useState(slide.notes ?? "");
  useEffect(() => { setNotesValue(slide.notes ?? ""); }, [slide.id]);

  const [isTextOverflowing, setIsTextOverflowing] = useState(false);
  const elementTypeLabel = { text: "文本", image: "图片", shape: "形状", html: "HTML" } as const;

  useEffect(() => {
    if (!element || element.type !== "text") { setIsTextOverflowing(false); return; }
    const node = document.querySelector<HTMLElement>(`.slide-viewport [data-element-id="${CSS.escape(element.id)}"]`);
    setIsTextOverflowing(node ? node.scrollHeight > node.clientHeight + 2 : false);
  }, [element]);

  function updateStyle(style: Record<string, string | number>) {
    updateSelectedElement({ style });
  }

  function fitTextHeight(textElement: TextElement) {
    const node = document.querySelector<HTMLElement>(`.slide-viewport [data-element-id="${CSS.escape(textElement.id)}"]`);
    if (node) updateSelectedElement({ h: Math.ceil(node.scrollHeight + 4) });
  }

  const transType = slide.transition?.type ?? "none";
  const transDur = slide.transition?.duration ?? 0.4;

  return (
    <aside className="property-panel" aria-label="属性">
      <div className="panel-heading">属性</div>
      {!element ? (
        <div className="property-stack">
          <div className="empty-state">
            {selectedElementIds.length > 1
              ? `已选择 ${selectedElementIds.length} 个元素。多元素属性编辑将在后续步骤接入。`
              : "未选择元素，正在编辑当前页面。"}
          </div>
          <BackgroundSection background={slide.background} onChange={updateCurrentSlideBackground} />
          <InspectorSection title="演讲者备注">
            <textarea
              className="notes-textarea"
              placeholder="在此输入演讲者备注（仅在演示模式中显示）…"
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={(e) => { if (e.target.value !== (slide.notes ?? "")) updateCurrentSlideNotes(e.target.value); }}
            />
          </InspectorSection>
          <InspectorSection title="页面转场">
            <SegmentedControl
              label="类型"
              value={transType}
              options={TRANS_TYPES as unknown as Array<{ label: string; value: string }>}
              onChange={(v) => updateCurrentSlideTransition(v === "none" ? undefined : { type: v as "fade" | "slide" | "push", duration: transDur })}
            />
            {transType !== "none" && (
              <Field label="时长(s)">
                <input
                  type="number"
                  min={0.1}
                  max={3}
                  step={0.1}
                  value={transDur}
                  onChange={(e) => updateCurrentSlideTransition({ type: transType as "fade" | "slide" | "push", duration: parseFloat(e.target.value) || 0.4 })}
                />
              </Field>
            )}
          </InspectorSection>
        </div>
      ) : (
        <div className="property-stack">
          <div className="property-meta">
            <span>{elementTypeLabel[element.type]}</span>
            <code>{element.id}</code>
          </div>
          <LayoutSection element={element} slideSize={deck.size} zRange={zRange} onChange={updateSelectedElement} />
          {element.type === "text" ? (
            <>
              <TextSection element={element} onElementChange={updateSelectedElement} onStyleChange={updateStyle} isOverflowing={isTextOverflowing} onFitHeight={() => fitTextHeight(element)} />
              <FillSection element={element} onElementChange={updateSelectedElement as (patch: Partial<ImageElement>) => void} onStyleChange={updateStyle} />
              <BorderSection element={element} onStyleChange={updateStyle} />
              <ShadowSection element={element} onStyleChange={updateStyle} />
            </>
          ) : null}
          {element.type === "shape" ? (
            <>
              <FillSection element={element} onElementChange={updateSelectedElement as (patch: Partial<ImageElement>) => void} onStyleChange={updateStyle} />
              <BorderSection element={element as ShapeElement} onStyleChange={updateStyle} />
              <ShadowSection element={element as ShapeElement} onStyleChange={updateStyle} />
            </>
          ) : null}
          {element.type === "image" ? (
            <>
              <FillSection element={element} onElementChange={updateSelectedElement as (patch: Partial<ImageElement>) => void} onStyleChange={updateStyle} />
              <ClipSection element={element as ImageElement} onUpdate={updateSelectedElement as (patch: Partial<ImageElement>) => void} />
              <BorderSection element={element} onStyleChange={updateStyle} />
              <ShadowSection element={element} onStyleChange={updateStyle} />
            </>
          ) : null}
          <AnimationSection element={element} onUpdate={updateSelectedElement} />
        </div>
      )}
    </aside>
  );
}
