"use client";

import { useEffect, useRef } from "react";
import { registerIframeNotify, unregisterIframeNotify, useSourceHtmlStore } from "@/store/useSourceHtmlStore";

export function SourceHtmlPreview() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const injectedHtml = useSourceHtmlStore((s) => s.injectedHtml);
  const currentIndex = useSourceHtmlStore((s) => s.currentIndex);

  useEffect(() => {
    registerIframeNotify((msg) => {
      iframeRef.current?.contentWindow?.postMessage(msg, "*");
    });
    return () => unregisterIframeNotify();
  }, []);

  function handleLoad() {
    setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { __sls: 1, type: "navigate", index: currentIndex },
        "*",
      );
    }, 500);
  }

  return (
    <iframe
      ref={iframeRef}
      className="source-html-preview"
      srcDoc={injectedHtml}
      sandbox="allow-scripts"
      title="演示文稿预览"
      onLoad={handleLoad}
    />
  );
}
