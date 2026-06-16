"use client";

import type { TextElement } from "@/core/schema/deck";
import { fontFamilies, fontWeights } from "@/core/style/fonts";
import { Field, InspectorSection, SegmentedControl } from "./InspectorFields";

type TextSectionProps = {
  element: TextElement;
  onElementChange: (patch: Partial<TextElement>) => void;
  onStyleChange: (style: Record<string, string | number>) => void;
  onFitHeight: () => void;
  isOverflowing: boolean;
};

export function TextSection({
  element,
  onElementChange,
  onStyleChange,
  onFitHeight,
  isOverflowing,
}: TextSectionProps) {
  const fontWeightValue = String(element.style.fontWeight ?? "normal");

  return (
    <InspectorSection title="文本">
      <Field label="内容">
        <textarea
          value={element.content}
          rows={5}
          onChange={(event) => onElementChange({ content: event.target.value })}
        />
      </Field>
      {isOverflowing ? (
        <div className="overflow-warning">
          文本超出当前文本框。
          <button type="button" onClick={onFitHeight}>
            适应高度
          </button>
        </div>
      ) : null}
      <Field label="字体">
        <select
          value={element.style.fontFamily ?? fontFamilies[0]}
          onChange={(event) => onStyleChange({ fontFamily: event.target.value })}
        >
          {fontFamilies.map((font) => (
            <option key={font} value={font}>
              {font.replaceAll("'", "")}
            </option>
          ))}
        </select>
      </Field>
      <Field label="本机字体名">
        <input
          type="text"
          value={element.style.fontFamily ?? ""}
          placeholder="例如：霞鹜文楷、HarmonyOS Sans SC"
          onChange={(event) => onStyleChange({ fontFamily: event.target.value })}
        />
      </Field>
      <div className="field-grid-2">
        <Field label="字号">
          <input
            type="number"
            min="8"
            value={element.style.fontSize ?? 24}
            onChange={(event) => onStyleChange({ fontSize: Number(event.target.value) })}
          />
        </Field>
        <Field label="字重">
          <select
            value={fontWeightValue}
            onChange={(event) =>
              onStyleChange({
                fontWeight:
                  event.target.value === "normal" || event.target.value === "bold"
                    ? event.target.value
                    : Number(event.target.value),
              })
            }
          >
            {fontWeights.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="行高">
          <input
            type="number"
            min="0.8"
            step="0.05"
            value={element.style.lineHeight ?? 1.2}
            onChange={(event) => onStyleChange({ lineHeight: Number(event.target.value) })}
          />
        </Field>
        <Field label="字距">
          <input
            type="number"
            step="0.5"
            value={element.style.letterSpacing ?? 0}
            onChange={(event) => onStyleChange({ letterSpacing: Number(event.target.value) })}
          />
        </Field>
      </div>
      <SegmentedControl
        label="对齐"
        value={element.style.textAlign ?? "left"}
        options={[
          { label: "左", value: "left" },
          { label: "中", value: "center" },
          { label: "右", value: "right" },
          { label: "齐", value: "justify" },
        ]}
        onChange={(value) => onStyleChange({ textAlign: value })}
      />
      <SegmentedControl
        label="垂直"
        value={element.style.verticalAlign ?? "top"}
        options={[
          { label: "上", value: "top" },
          { label: "中", value: "middle" },
          { label: "下", value: "bottom" },
        ]}
        onChange={(value) => onStyleChange({ verticalAlign: value })}
      />
      <SegmentedControl
        label="样式"
        value={element.style.fontStyle ?? "normal"}
        options={[
          { label: "常规", value: "normal" },
          { label: "斜体", value: "italic" },
        ]}
        onChange={(value) => onStyleChange({ fontStyle: value })}
      />
    </InspectorSection>
  );
}
