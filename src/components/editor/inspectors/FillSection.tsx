"use client";

import type { ImageElement, ShapeElement, TextElement } from "@/core/schema/deck";
import { imageAccept, fileToDataUrl } from "@/core/assets/imageDataUrl";
import { Field, InspectorSection } from "./InspectorFields";

type FillSectionProps = {
  element: TextElement | ShapeElement | ImageElement;
  onElementChange: (patch: Partial<ImageElement>) => void;
  onStyleChange: (style: Record<string, string | number>) => void;
};

export function FillSection({ element, onElementChange, onStyleChange }: FillSectionProps) {
  async function handleImageFile(file: File | undefined) {
    if (!file || element.type !== "image") {
      return;
    }
    onElementChange({ src: await fileToDataUrl(file) });
  }

  return (
    <InspectorSection title="填充">
      {element.type === "text" ? (
        <>
          <Field label="文字颜色">
            <input
              type="color"
              value={element.style.color ?? "#111111"}
              onChange={(event) => onStyleChange({ color: event.target.value })}
            />
          </Field>
          <Field label="背景">
            <input
              type="color"
              value={element.style.background ?? "#ffffff"}
              onChange={(event) => onStyleChange({ background: event.target.value })}
            />
          </Field>
          <Field label="内边距">
            <input
              type="number"
              min="0"
              value={element.style.padding ?? 0}
              onChange={(event) => onStyleChange({ padding: Number(event.target.value) })}
            />
          </Field>
        </>
      ) : null}

      {element.type === "shape" ? (
        <Field label="填充色">
          <input
            type="color"
            value={element.style.fill ?? "#2563eb"}
            onChange={(event) => onStyleChange({ fill: event.target.value })}
          />
        </Field>
      ) : null}

      {element.type === "image" ? (
        <>
          <Field label="图片地址">
            <input
              type="text"
              value={element.src}
              onChange={(event) => onElementChange({ src: event.target.value })}
            />
          </Field>
          <Field label="本地图片">
            <input
              type="file"
              accept={imageAccept}
              onChange={(event) => void handleImageFile(event.target.files?.[0])}
            />
          </Field>
          <Field label="适应方式">
            <select
              value={element.objectFit ?? "cover"}
              onChange={(event) =>
                onElementChange({
                  objectFit: event.target.value as ImageElement["objectFit"],
                })
              }
            >
              <option value="cover">填满裁切</option>
              <option value="contain">完整显示</option>
              <option value="fill">拉伸填充</option>
            </select>
          </Field>
        </>
      ) : null}
    </InspectorSection>
  );
}
