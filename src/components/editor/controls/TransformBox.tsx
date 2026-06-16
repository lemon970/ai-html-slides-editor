"use client";

import type { PointerEvent } from "react";
import type { SlideElement } from "@/core/schema/deck";
import type { ResizeHandle as ResizeHandleName } from "@/core/geometry/transform";
import { ResizeHandle } from "./ResizeHandle";
import { RotationHandle } from "./RotationHandle";

const handles: ResizeHandleName[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

type TransformBoxProps = {
  element: SlideElement;
  onMovePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onResizePointerDown: (event: PointerEvent<HTMLButtonElement>, handle: ResizeHandleName) => void;
  onRotatePointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
};

export function TransformBox({
  element,
  onMovePointerDown,
  onResizePointerDown,
  onRotatePointerDown,
}: TransformBoxProps) {
  return (
    <div
      className="transform-box"
      style={{
        left: element.x,
        top: element.y,
        width: element.w,
        height: element.h,
        transform: `rotate(${element.rotation ?? 0}deg)`,
        zIndex: (element.zIndex ?? 0) + 1000,
      }}
      onPointerDown={onMovePointerDown}
    >
      {handles.map((handle) => (
        <ResizeHandle key={handle} handle={handle} onPointerDown={onResizePointerDown} />
      ))}
      <RotationHandle onPointerDown={onRotatePointerDown} />
    </div>
  );
}
