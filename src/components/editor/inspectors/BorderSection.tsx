"use client";

import type { ImageElement, ShapeElement, TextElement } from "@/core/schema/deck";
import { Field, InspectorSection } from "./InspectorFields";

type BorderSectionProps = {
  element: TextElement | ShapeElement | ImageElement;
  onStyleChange: (style: Record<string, string | number>) => void;
};

export function BorderSection({ element, onStyleChange }: BorderSectionProps) {
  const style = element.style;

  return (
    <InspectorSection title="边框">
      <Field label="圆角">
        <input
          type="number"
          min="0"
          value={"borderRadius" in style ? (style.borderRadius ?? 0) : 0}
          onChange={(event) => onStyleChange({ borderRadius: Number(event.target.value) })}
        />
      </Field>
      {element.type === "shape" ? (
        <div className="field-grid-2">
          <Field label="描边">
            <input
              type="color"
              value={element.style.stroke ?? "#000000"}
              onChange={(event) => onStyleChange({ stroke: event.target.value })}
            />
          </Field>
          <Field label="宽度">
            <input
              type="number"
              min="0"
              value={element.style.strokeWidth ?? 0}
              onChange={(event) => onStyleChange({ strokeWidth: Number(event.target.value) })}
            />
          </Field>
        </div>
      ) : null}
    </InspectorSection>
  );
}
