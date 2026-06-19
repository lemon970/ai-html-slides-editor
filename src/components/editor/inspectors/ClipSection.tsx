"use client";

import { InspectorSection, Field } from "./InspectorFields";
import type { ImageElement } from "@/core/schema/deck";

type Clip = { top: number; right: number; bottom: number; left: number };

type Props = {
  element: ImageElement;
  onUpdate: (patch: Partial<ImageElement>) => void;
};

export function ClipSection({ element, onUpdate }: Props) {
  const clip: Clip = { top: 0, right: 0, bottom: 0, left: 0, ...element.style.clip };

  function setClip(key: keyof Clip, val: number) {
    const next = { ...clip, [key]: Math.max(0, Math.min(50, val || 0)) };
    onUpdate({ style: { ...element.style, clip: (next.top || next.right || next.bottom || next.left) ? next : undefined } });
  }

  return (
    <InspectorSection title="裁切">
      {(["top", "right", "bottom", "left"] as (keyof Clip)[]).map((side) => (
        <Field key={side} label={{ top: "上", right: "右", bottom: "下", left: "左" }[side]}>
          <input
            type="number"
            min={0}
            max={50}
            step={1}
            value={clip[side]}
            onChange={(e) => setClip(side, parseFloat(e.target.value))}
          />
          <span className="unit-label">%</span>
        </Field>
      ))}
    </InspectorSection>
  );
}
