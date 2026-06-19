"use client";

import { InspectorSection, Field, SegmentedControl } from "./InspectorFields";
import type { SlideElement, AnimationDef, ElementAnimations } from "@/core/schema/deck";
import { previewEntranceOnDom } from "@/core/render/animationStyles";

const ANIM_TYPES = [
  { label: "淡入", value: "fade" },
  { label: "上滑", value: "slide-up" },
  { label: "下滑", value: "slide-down" },
  { label: "左滑", value: "slide-left" },
  { label: "右滑", value: "slide-right" },
  { label: "缩放", value: "scale" },
  { label: "放大", value: "zoom-in" },
  { label: "旋转", value: "spin" },
] as const;

const EASINGS = [
  { label: "缓出", value: "ease-out" },
  { label: "缓入缓出", value: "ease-in-out" },
  { label: "线性", value: "linear" },
  { label: "缓入", value: "ease-in" },
  { label: "默认", value: "ease" },
] as const;

type Props = {
  element: SlideElement;
  onUpdate: (patch: Partial<SlideElement>) => void;
};

type Phase = "entrance" | "exit" | "emphasis";

const DEFAULT_DEF: AnimationDef = { type: "fade", duration: 0.6, delay: 0, easing: "ease-out" };

export function AnimationSection({ element, onUpdate }: Props) {
  const anims = element.animations ?? {};

  function setDef(phase: Phase, def: AnimationDef | undefined) {
    const next: ElementAnimations = { ...anims, [phase]: def };
    onUpdate({ animations: next });
  }

  function handlePreview(def: AnimationDef) {
    const el = document.querySelector<HTMLElement>(
      `.slide-viewport [data-element-id="${CSS.escape(element.id)}"]`,
    );
    if (el) previewEntranceOnDom(el, def);
  }

  return (
    <InspectorSection title="动画">
      {(["entrance", "exit", "emphasis"] as Phase[]).map((phase) => {
        const label = phase === "entrance" ? "入场" : phase === "exit" ? "退场" : "强调";
        const def = anims[phase];
        return (
          <div key={phase} className="anim-phase">
            <div className="anim-phase-header">
              <span className="anim-phase-label">{label}</span>
              <label className="anim-toggle">
                <input
                  type="checkbox"
                  checked={!!def}
                  onChange={(e) => setDef(phase, e.target.checked ? { ...DEFAULT_DEF } : undefined)}
                />
                启用
              </label>
              {def && phase === "entrance" && (
                <button type="button" className="anim-preview-btn" onClick={() => handlePreview(def)}>
                  预览
                </button>
              )}
            </div>
            {def && (
              <div className="anim-def-fields">
                <Field label="类型">
                  <select
                    value={def.type}
                    onChange={(e) => setDef(phase, { ...def, type: e.target.value as AnimationDef["type"] })}
                  >
                    {ANIM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="时长(s)">
                  <input
                    type="number"
                    min={0.1}
                    max={5}
                    step={0.1}
                    value={def.duration}
                    onChange={(e) => setDef(phase, { ...def, duration: parseFloat(e.target.value) || 0.6 })}
                  />
                </Field>
                <Field label="延迟(s)">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={def.delay}
                    onChange={(e) => setDef(phase, { ...def, delay: parseFloat(e.target.value) || 0 })}
                  />
                </Field>
                <SegmentedControl
                  label="缓动"
                  value={def.easing}
                  options={EASINGS as unknown as Array<{ label: string; value: string }>}
                  onChange={(v) => setDef(phase, { ...def, easing: v as AnimationDef["easing"] })}
                />
              </div>
            )}
          </div>
        );
      })}
    </InspectorSection>
  );
}
