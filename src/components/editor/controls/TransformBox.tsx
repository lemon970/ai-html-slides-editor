"use client";

import type { PointerEvent } from "react";
import type { Bounds } from "@/core/geometry/bounds";
import type { ResizeHandle as ResizeHandleName } from "@/core/geometry/transform";
import { ResizeHandle } from "./ResizeHandle";
import { RotationHandle } from "./RotationHandle";

const handles: ResizeHandleName[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

type TransformBoxProps = {
  element: Bounds & { rotation?: number; zIndex?: number };
  onMovePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onResizePointerDown: (event: PointerEvent<HTMLButtonElement>, handle: ResizeHandleName) => void;
  onRotatePointerDown?: (event: PointerEvent<HTMLButtonElement>) => void;
  showRotation?: boolean;
};

export function TransformBox({
  element,
  onMovePointerDown,
  onResizePointerDown,
  onRotatePointerDown,
  showRotation = true,
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
      {showRotation && onRotatePointerDown ? (
        <RotationHandle onPointerDown={onRotatePointerDown} />
      ) : null}
    </div>
  );
}
