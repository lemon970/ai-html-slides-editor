"use client";

import { ChangeEvent, useRef } from "react";
import { fileToDataUrl, imageAccept } from "@/core/assets/imageDataUrl";
import { useDeckStore } from "@/store/useDeckStore";

export function MediaPanel() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const assets = useDeckStore((state) => state.deck.assets) ?? [];
  const selectedElementId = useDeckStore((state) => state.selectedElementId);
  const selectedElement = useDeckStore((state) => {
    const slide = state.deck.slides.find((item) => item.id === state.currentSlideId);
    return slide?.elements.find((item) => item.id === state.selectedElementId) ?? null;
  });
  const addImageElement = useDeckStore((state) => state.addImageElement);
  const insertImageAsset = useDeckStore((state) => state.insertImageAsset);
  const replaceSelectedImageWithAsset = useDeckStore((state) => state.replaceSelectedImageWithAsset);
  const setError = useDeckStore((state) => state.setError);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      addImageElement(await fileToDataUrl(file), file.name, file.type);
    } catch (error) {
      setError(error instanceof Error ? error.message : "导入图片失败。");
    }
  }

  const canReplace = selectedElementId && selectedElement?.type === "image";

  return (
    <section className="media-panel" aria-label="媒体资源">
      <div className="panel-heading">媒体</div>
      <button type="button" className="media-import-button" onClick={() => inputRef.current?.click()}>
        导入图片
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={imageAccept}
        className="visually-hidden"
        onChange={handleFile}
      />

      <div className="media-grid">
        {assets.length === 0 ? (
          <div className="media-empty">暂无图片资源</div>
        ) : (
          assets.map((asset) => (
            <div key={asset.id} className="media-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.src} alt={asset.name} />
              <div className="media-name" title={asset.name}>{asset.name}</div>
              <div className="media-actions">
                <button type="button" onClick={() => insertImageAsset(asset.id)}>
                  插入
                </button>
                <button
                  type="button"
                  disabled={!canReplace}
                  onClick={() => replaceSelectedImageWithAsset(asset.id)}
                >
                  替换
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
