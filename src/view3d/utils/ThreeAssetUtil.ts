import { CanvasTexture, TextureLoader } from "three";

export const toTexture = async (base64: string) => {
  if (typeof document !== "undefined") {
    return new TextureLoader().load(base64);
  } else {
    const blob = toBlob(base64);
    const imageBitmap = await createImageBitmap(blob);
    return new CanvasTexture(imageBitmap as any);
  }
};

/**
 *
 * @param base64
 */
function toBlob(base64: string): Blob {
  const bin = atob(base64.replace(/^.*,/, ""));
  const buffer = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    buffer[i] = bin.charCodeAt(i);
  }
  let blob;
  // Blobを作成
  try {
    blob = new Blob([buffer.buffer], {
      type: "image/png"
    });
  } catch (e) {
    console.error(e);
    return null;
  }
  return blob;
}
