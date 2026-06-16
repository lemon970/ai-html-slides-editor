"use client";

import type { SlideBackground } from "@/core/schema/deck";
import { imageAccept, fileToDataUrl } from "@/core/assets/imageDataUrl";
import { Field, InspectorSection, SegmentedControl } from "./InspectorFields";

type BackgroundSectionProps = {
  background: SlideBackground;
  onChange: (background: SlideBackground) => void;
};

type ImageBackground = Extract<SlideBackground, { type: "image" }>;

export function BackgroundSection({ background, onChange }: BackgroundSectionProps) {
  async function handleImageFile(file: File | undefined) {
    if (!file) {
      return;
    }

    onChange({
      type: "image",
      src: await fileToDataUrl(file),
      fit: background.type === "image" ? background.fit : "cover",
      position: background.type === "image" ? background.position : "center",
    });
  }

  return (
    <InspectorSection title="画布背景">
      <SegmentedControl
        label="类型"
        value={background.type}
        options={[
          { label: "纯色", value: "solid" },
          { label: "渐变", value: "gradient" },
          { label: "图片", value: "image" },
        ]}
        onChange={(type) => {
          if (type === "solid") {
            onChange({ type: "solid", color: "#ffffff" });
          } else if (type === "gradient") {
            onChange({ type: "gradient", from: "#ffffff", to: "#dbeafe", angle: 135 });
          } else {
            onChange({ type: "image", src: "", fit: "cover", position: "center" });
          }
        }}
      />
      {background.type === "solid" ? (
        <Field label="颜色">
          <input
            type="color"
            value={background.color}
            onChange={(event) => onChange({ ...background, color: event.target.value })}
          />
        </Field>
      ) : null}
      {background.type === "gradient" ? (
        <>
          <div className="field-grid-2">
            <Field label="起始">
              <input
                type="color"
                value={background.from}
                onChange={(event) => onChange({ ...background, from: event.target.value })}
              />
            </Field>
            <Field label="结束">
              <input
                type="color"
                value={background.to}
                onChange={(event) => onChange({ ...background, to: event.target.value })}
              />
            </Field>
          </div>
          <Field label="角度">
            <input
              type="number"
              value={background.angle}
              onChange={(event) => onChange({ ...background, angle: Number(event.target.value) })}
            />
          </Field>
        </>
      ) : null}
      {background.type === "image" ? (
        <>
          <Field label="图片地址">
            <input
              type="text"
              value={background.src}
              onChange={(event) => onChange({ ...background, src: event.target.value })}
            />
          </Field>
          <Field label="本地图片">
            <input
              type="file"
              accept={imageAccept}
              onChange={(event) => void handleImageFile(event.target.files?.[0])}
            />
          </Field>
          <div className="field-grid-2">
            <Field label="适应">
              <select
                value={background.fit}
                onChange={(event) =>
                  onChange({ ...background, fit: event.target.value as ImageBackground["fit"] })
                }
              >
                <option value="cover">cover</option>
                <option value="contain">contain</option>
                <option value="fill">fill</option>
              </select>
            </Field>
            <Field label="位置">
              <select
                value={background.position}
                onChange={(event) =>
                  onChange({
                    ...background,
                    position: event.target.value as ImageBackground["position"],
                  })
                }
              >
                <option value="center">center</option>
                <option value="top">top</option>
                <option value="bottom">bottom</option>
                <option value="left">left</option>
                <option value="right">right</option>
              </select>
            </Field>
          </div>
        </>
      ) : null}
    </InspectorSection>
  );
}
