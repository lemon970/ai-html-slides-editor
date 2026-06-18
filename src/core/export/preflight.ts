import type { Deck, Slide, SlideBackground, SlideElement } from "@/core/schema/deck";

function isRemoteUrl(src: string) {
  return /^https?:\/\//i.test(src);
}

function isSameOrigin(src: string) {
  if (typeof window === "undefined" || !isRemoteUrl(src)) {
    return true;
  }
  try {
    return new URL(src).origin === window.location.origin;
  } catch {
    return false;
  }
}

function assertImageSource(src: string, label: string) {
  if (!src || src === "[omitted]") {
    throw new Error(`${label} 缺少图片数据，无法导出。`);
  }
  if (isRemoteUrl(src) && !isSameOrigin(src)) {
    throw new Error(`${label} 使用跨域图片，可能导致导出失败。请先导入到媒体库。`);
  }
}

function assertBackground(background: SlideBackground, slideIndex: number) {
  if (background.type === "image") {
    assertImageSource(background.src, `第 ${slideIndex + 1} 页背景`);
  }
}

function assertElement(element: SlideElement, slideIndex: number) {
  if (element.type !== "image") {
    return;
  }
  if (element.assetStatus === "omitted") {
    throw new Error(`第 ${slideIndex + 1} 页图片「${element.name ?? element.id}」未保存图片数据，无法导出。`);
  }
  assertImageSource(element.src, `第 ${slideIndex + 1} 页图片「${element.name ?? element.id}」`);
}

export function assertDeckRasterExportable(deck: Deck) {
  deck.slides.forEach((slide, slideIndex) => {
    assertBackground(slide.background, slideIndex);
    slide.elements.forEach((element) => assertElement(element, slideIndex));
  });
}

export function assertSlideRasterExportable(slide: Slide, slideIndex = 0) {
  assertBackground(slide.background, slideIndex);
  slide.elements.forEach((element) => assertElement(element, slideIndex));
}
