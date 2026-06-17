"use client";

import type { CSSProperties, MouseEvent, PointerEvent } from "react";
import type { SlideElement } from "@/core/schema/deck";
import { elementBaseReactStyle, textReactStyle } from "@/core/style/css";

type ElementRendererProps = {
  element: SlideElement;
  selected?: boolean;
  mode: "editable" | "thumbnail";
  onPointerDown?: (event: PointerEvent<HTMLDivElement>, element: SlideElement) => void;
  onContextMenu?: (event: MouseEvent<HTMLDivElement>, element: SlideElement) => void;
  onDoubleClick?: (element: SlideElement) => void;
};

function baseStyle(element: SlideElement): CSSProperties {
  return elementBaseReactStyle(element);
}

export function ElementRenderer({
  element,
  selected = false,
  mode,
  onPointerDown,
  onContextMenu,
  onDoubleClick,
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
    onContextMenu:
      mode === "editable"
        ? (event: MouseEvent<HTMLDivElement>) => onContextMenu?.(event, element)
        : undefined,
    onDoubleClick:
      mode === "editable"
        ? (event: MouseEvent<HTMLDivElement>) => { event.stopPropagation(); onDoubleClick?.(element); }
        : undefined,
  };

  if (element.type === "text") {
    return (
      <div
        {...commonProps}
        style={textReactStyle(element)}
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
