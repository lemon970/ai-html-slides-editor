import type { CSSProperties } from "react";
import type { SlideBackground, SlideElement } from "@/core/schema/deck";

export type HtmlStyleValue = string | number | undefined;

export function styleToString(style: Record<string, HtmlStyleValue>) {
  return Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
}

export function elementBaseReactStyle(element: SlideElement): CSSProperties {
  return {
    position: "absolute",
    left: element.x,
    top: element.y,
    width: element.w,
    height: element.h,
    opacity: element.opacity ?? 1,
    zIndex: element.zIndex ?? 0,
    transform: `rotate(${element.rotation ?? 0}deg)`,
    transformOrigin: "center center",
  };
}

export function elementBaseHtmlStyle(element: SlideElement) {
  return {
    position: "absolute",
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.w}px`,
    height: `${element.h}px`,
    opacity: element.opacity ?? 1,
    "z-index": element.zIndex ?? 0,
    transform: `rotate(${element.rotation ?? 0}deg)`,
    "transform-origin": "center center",
  };
}

export function slideBackgroundReactStyle(background: SlideBackground): CSSProperties {
  if (background.type === "solid") {
    return { background: background.color };
  }

  if (background.type === "gradient") {
    return {
      background: `linear-gradient(${background.angle}deg, ${background.from}, ${background.to})`,
    };
  }

  return {
    backgroundImage: [
      background.overlay ? `linear-gradient(${background.overlay}, ${background.overlay})` : "",
      `url("${background.src}")`,
    ]
      .filter(Boolean)
      .join(", "),
    backgroundSize: background.fit === "fill" ? "100% 100%" : background.fit,
    backgroundPosition: background.position,
    backgroundRepeat: "no-repeat",
  };
}

export function slideBackgroundHtmlStyle(background: SlideBackground) {
  if (background.type === "solid") {
    return { background: background.color };
  }

  if (background.type === "gradient") {
    return { background: `linear-gradient(${background.angle}deg, ${background.from}, ${background.to})` };
  }

  return {
    "background-image": [
      background.overlay ? `linear-gradient(${background.overlay}, ${background.overlay})` : "",
      `url("${background.src}")`,
    ]
      .filter(Boolean)
      .join(", "),
    "background-size": background.fit === "fill" ? "100% 100%" : background.fit,
    "background-position": background.position,
    "background-repeat": "no-repeat",
  };
}

export function textReactStyle(element: Extract<SlideElement, { type: "text" }>): CSSProperties {
  const verticalMap = {
    top: "flex-start",
    middle: "center",
    bottom: "flex-end",
  } as const;

  return {
    ...elementBaseReactStyle(element),
    display: "flex",
    flexDirection: "column",
    justifyContent: verticalMap[element.style.verticalAlign ?? "top"],
    fontFamily: element.style.fontFamily,
    fontSize: element.style.fontSize,
    fontWeight: element.style.fontWeight,
    fontStyle: element.style.fontStyle,
    color: element.style.color,
    lineHeight: element.style.lineHeight,
    letterSpacing: element.style.letterSpacing,
    textAlign: element.style.textAlign,
    background: element.style.background,
    padding: element.style.padding,
    borderRadius: element.style.borderRadius,
    boxShadow: element.style.shadow,
    whiteSpace: "pre-wrap",
    overflow: element.style.overflow === "visible" ? "visible" : "hidden",
  };
}

export function textHtmlStyle(element: Extract<SlideElement, { type: "text" }>) {
  const verticalMap = {
    top: "flex-start",
    middle: "center",
    bottom: "flex-end",
  } as const;

  return {
    ...elementBaseHtmlStyle(element),
    display: "flex",
    "flex-direction": "column",
    "justify-content": verticalMap[element.style.verticalAlign ?? "top"],
    "font-family": element.style.fontFamily,
    "font-size": element.style.fontSize ? `${element.style.fontSize}px` : undefined,
    "font-weight": element.style.fontWeight,
    "font-style": element.style.fontStyle,
    color: element.style.color,
    "line-height": element.style.lineHeight,
    "letter-spacing": element.style.letterSpacing
      ? `${element.style.letterSpacing}px`
      : undefined,
    "text-align": element.style.textAlign,
    background: element.style.background,
    padding: element.style.padding ? `${element.style.padding}px` : undefined,
    "border-radius": element.style.borderRadius ? `${element.style.borderRadius}px` : undefined,
    "box-shadow": element.style.shadow,
    "white-space": "pre-wrap",
    overflow: element.style.overflow === "visible" ? "visible" : "hidden",
  };
}
