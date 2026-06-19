import type { AnimationDef } from "@/core/schema/deck";

// CSS individual transform properties (Level 5) compose with transform:rotate()
export const KEYFRAME_CSS: Record<string, string> = {
  "fade":       "@keyframes anim-fade       { from { opacity:0 }                                    to { opacity:1 } }",
  "slide-up":   "@keyframes anim-slide-up   { from { opacity:0; translate:0 40px }                  to { opacity:1; translate:none } }",
  "slide-down": "@keyframes anim-slide-down { from { opacity:0; translate:0 -40px }                 to { opacity:1; translate:none } }",
  "slide-left": "@keyframes anim-slide-left { from { opacity:0; translate:40px 0 }                  to { opacity:1; translate:none } }",
  "slide-right":"@keyframes anim-slide-right{ from { opacity:0; translate:-40px 0 }                 to { opacity:1; translate:none } }",
  "scale":      "@keyframes anim-scale      { from { opacity:0; scale:0.7 }                         to { opacity:1; scale:none } }",
  "zoom-in":    "@keyframes anim-zoom-in    { from { opacity:0; scale:1.2 }                         to { opacity:1; scale:none } }",
  "spin":       "@keyframes anim-spin       { from { opacity:0; rotate:-90deg; scale:0.8 }          to { opacity:1; rotate:0deg; scale:none } }",
};

export function collectKeyframes(types: string[]): string {
  return [...new Set(types)]
    .map((t) => KEYFRAME_CSS[t] ?? "")
    .filter(Boolean)
    .join("\n");
}

export function entranceInlineStyle(def: AnimationDef): string {
  return [
    `animation-name:anim-${def.type}`,
    `animation-duration:${def.duration}s`,
    `animation-delay:${def.delay}s`,
    `animation-timing-function:${def.easing}`,
    `animation-fill-mode:both`,
    `animation-play-state:paused`,
  ].join(";");
}

/** Apply a preview animation directly to a DOM element (editor-side only) */
export function previewEntranceOnDom(el: HTMLElement, def: AnimationDef): void {
  el.style.animationName = `anim-${def.type}`;
  el.style.animationDuration = `${def.duration}s`;
  el.style.animationDelay = `${def.delay}s`;
  el.style.animationTimingFunction = def.easing;
  el.style.animationFillMode = "both";
  el.style.animationPlayState = "running";
  const ms = (def.duration + def.delay) * 1000 + 100;
  setTimeout(() => {
    el.style.removeProperty("animation-name");
    el.style.removeProperty("animation-duration");
    el.style.removeProperty("animation-delay");
    el.style.removeProperty("animation-timing-function");
    el.style.removeProperty("animation-fill-mode");
    el.style.removeProperty("animation-play-state");
  }, ms);
}
