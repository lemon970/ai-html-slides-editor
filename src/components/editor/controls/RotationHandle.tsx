"use client";

import type { PointerEvent } from "react";

type RotationHandleProps = {
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
};

export function RotationHandle({ onPointerDown }: RotationHandleProps) {
  return (
    <button
      type="button"
      className="rotation-handle"
      aria-label="旋转元素"
      onPointerDown={onPointerDown}
    />
  );
}
