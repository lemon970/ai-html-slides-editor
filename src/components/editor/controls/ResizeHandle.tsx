"use client";

import type { PointerEvent } from "react";
import type { ResizeHandle as ResizeHandleName } from "@/core/geometry/transform";

type ResizeHandleProps = {
  handle: ResizeHandleName;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>, handle: ResizeHandleName) => void;
};

export function ResizeHandle({ handle, onPointerDown }: ResizeHandleProps) {
  return (
    <button
      type="button"
      className={`resize-handle resize-handle-${handle}`}
      aria-label={`Resize ${handle}`}
      onPointerDown={(event) => onPointerDown(event, handle)}
    />
  );
}
