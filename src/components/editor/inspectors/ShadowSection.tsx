"use client";

import type { ImageElement, ShapeElement, TextElement } from "@/core/schema/deck";
import { Field, InspectorSection } from "./InspectorFields";

type ShadowSectionProps = {
  element: TextElement | ShapeElement | ImageElement;
  onStyleChange: (style: Record<string, string | number>) => void;
};

export function ShadowSection({ element, onStyleChange }: ShadowSectionProps) {
  const shadow = "shadow" in element.style ? (element.style.shadow ?? "") : "";

  return (
    <InspectorSection title="阴影">
      <Field label="CSS 阴影">
        <input
          type="text"
          value={shadow}
          placeholder="0 12px 30px rgba(15,23,42,.18)"
          onChange={(event) => onStyleChange({ shadow: event.target.value })}
        />
      </Field>
    </InspectorSection>
  );
}
