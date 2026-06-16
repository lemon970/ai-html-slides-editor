export const imageAccept = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";

export function isSupportedImage(file: File) {
  return ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"].includes(
    file.type,
  );
}

export async function fileToDataUrl(file: File) {
  if (!isSupportedImage(file)) {
    throw new Error("只支持 PNG、JPEG、WebP、GIF 或 SVG 图片。");
  }

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("图片读取失败。"));
    reader.readAsDataURL(file);
  });
}
