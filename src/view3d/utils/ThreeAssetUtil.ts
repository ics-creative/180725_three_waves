import { CanvasTexture, TextureLoader } from "three";

export const toTexture = async (base64: string) => {
  if (typeof base64 !== "string") {
    throw new Error("引数が String 型ではありません.");
  }
  if (typeof document !== "undefined") {
    return new TextureLoader().load(base64);
  } else {
    const blob = toBlob(base64);
    const imageBitmap = await createImageBitmap(blob);
    return new CanvasTexture(imageBitmap as any);
  }
};

/**
 * @param base64
 */
function toBlob(base64: string): Blob {
  if (typeof base64 !== "string") {
    throw new Error("引数が String 型ではありません.");
  }
  const bin = atob(base64.replace(/^.*,/, ""));
  const buffer = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    buffer[i] = bin.charCodeAt(i);
  }

  // Blobを作成
  const blob = new Blob([buffer.buffer], {
    type: "image/png",
  });
  return blob;
}
