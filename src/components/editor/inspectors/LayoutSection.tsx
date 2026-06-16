"use client";

import type { SlideElement } from "@/core/schema/deck";
import { Field, InspectorSection } from "./InspectorFields";

type LayoutSectionProps = {
  element: SlideElement;
  slideSize: { width: number; height: number };
  zRange: { min: number; max: number };
  onChange: (patch: Partial<SlideElement>) => void;
};

export function LayoutSection({ element, slideSize, zRange, onChange }: LayoutSectionProps) {
  return (
    <InspectorSection title="布局">
      <div className="field-grid-2">
        <Field label="X">
          <input
            type="number"
            value={Math.round(element.x)}
            onChange={(event) => onChange({ x: Number(event.target.value) })}
          />
        </Field>
        <Field label="Y">
          <input
            type="number"
            value={Math.round(element.y)}
            onChange={(event) => onChange({ y: Number(event.target.value) })}
          />
        </Field>
        <Field label="宽">
          <input
            type="number"
            min="1"
            value={Math.round(element.w)}
            onChange={(event) => onChange({ w: Number(event.target.value) })}
          />
        </Field>
        <Field label="高">
          <input
            type="number"
            min="1"
            value={Math.round(element.h)}
            onChange={(event) => onChange({ h: Number(event.target.value) })}
          />
        </Field>
      </div>
      <Field label="旋转">
        <input
          type="number"
          value={Math.round(element.rotation ?? 0)}
          onChange={(event) => onChange({ rotation: Number(event.target.value) })}
        />
      </Field>
      <Field label="透明度">
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={element.opacity ?? 1}
          onChange={(event) => onChange({ opacity: Number(event.target.value) })}
        />
      </Field>
      <div className="button-grid-2">
        <button type="button" onClick={() => onChange({ x: 0 })}>
          左对齐
        </button>
        <button type="button" onClick={() => onChange({ x: slideSize.width - element.w })}>
          右对齐
        </button>
        <button type="button" onClick={() => onChange({ y: 0 })}>
          顶对齐
        </button>
        <button type="button" onClick={() => onChange({ y: slideSize.height - element.h })}>
          底对齐
        </button>
        <button type="button" onClick={() => onChange({ x: (slideSize.width - element.w) / 2 })}>
          水平居中
        </button>
        <button type="button" onClick={() => onChange({ y: (slideSize.height - element.h) / 2 })}>
          垂直居中
        </button>
      </div>
      <div className="button-grid-2">
        <button type="button" onClick={() => onChange({ zIndex: (element.zIndex ?? 0) + 1 })}>
          上移一层
        </button>
        <button type="button" onClick={() => onChange({ zIndex: (element.zIndex ?? 0) - 1 })}>
          下移一层
        </button>
        <button type="button" onClick={() => onChange({ zIndex: zRange.max + 1 })}>
          置顶
        </button>
        <button type="button" onClick={() => onChange({ zIndex: zRange.min - 1 })}>
          置底
        </button>
      </div>
    </InspectorSection>
  );
}
