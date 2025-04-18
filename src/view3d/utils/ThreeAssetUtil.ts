import { CanvasTexture, TextureLoader, SRGBColorSpace, Texture } from "three";

export const toTexture = async (url: string): Promise<Texture> => {
  if (typeof url !== "string") {
    throw new Error("引数が String 型ではありません.");
  }

  let texture: Texture;
  if (typeof createImageBitmap !== "undefined") {
    const response = await fetch(url);
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);
    texture = new CanvasTexture(imageBitmap as any);
  } else {
    texture = new TextureLoader().load(url);
  }

  texture.colorSpace = SRGBColorSpace;
  return texture;
};
