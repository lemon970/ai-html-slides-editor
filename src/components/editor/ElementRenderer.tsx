"use client";

import type { CSSProperties, PointerEvent } from "react";
import type { SlideElement } from "@/core/schema/deck";

type ElementRendererProps = {
  element: SlideElement;
  selected?: boolean;
  mode: "editable" | "thumbnail";
  onPointerDown?: (event: PointerEvent<HTMLDivElement>, element: SlideElement) => void;
};

function baseStyle(element: SlideElement): CSSProperties {
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

export function ElementRenderer({
  element,
  selected = false,
  mode,
  onPointerDown,
}: ElementRendererProps) {
  const className = `slide-element ${selected ? "is-selected" : ""}`;
  const commonProps = {
    "data-element-id": element.id,
    "data-element": true,
    className,
    onPointerDown:
      mode === "editable"
        ? (event: PointerEvent<HTMLDivElement>) => onPointerDown?.(event, element)
        : undefined,
  };

  if (element.type === "text") {
    return (
      <div
        {...commonProps}
        style={{
          ...baseStyle(element),
          fontFamily: element.style.fontFamily,
          fontSize: element.style.fontSize,
          fontWeight: element.style.fontWeight,
          color: element.style.color,
          lineHeight: element.style.lineHeight,
          textAlign: element.style.textAlign,
          background: element.style.background,
          padding: element.style.padding,
          borderRadius: element.style.borderRadius,
          boxShadow: element.style.shadow,
          whiteSpace: "pre-wrap",
        }}
      >
        {element.content}
      </div>
    );
  }

  if (element.type === "image") {
    return (
      <div
        {...commonProps}
        style={{
          ...baseStyle(element),
          background: element.style.background,
          borderRadius: element.style.borderRadius,
          boxShadow: element.style.shadow,
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={element.src} alt={element.alt ?? ""} style={{ objectFit: element.objectFit }} />
      </div>
    );
  }

  if (element.type === "shape") {
    return (
      <div
        {...commonProps}
        style={{
          ...baseStyle(element),
          background: element.style.fill,
          border: element.style.stroke
            ? `${element.style.strokeWidth ?? 1}px solid ${element.style.stroke}`
            : undefined,
          borderRadius:
            element.shape === "ellipse" ? "9999px" : element.style.borderRadius,
          boxShadow: element.style.shadow,
        }}
      />
    );
  }

  return (
    <div
      {...commonProps}
      style={baseStyle(element)}
      dangerouslySetInnerHTML={{ __html: element.html }}
    />
  );
}
