import { makeNormalPixels, type NormalOptions } from "@toonflow/node-image/materialNormals";
import { runLocalModel } from "@/utils/localModel/inference";

export async function createMaterialNormals(image: { width: number; height: number; rgba: Uint8Array }, options: NormalOptions,
  onProgress: (completed: number, total: number) => void, signal: AbortSignal) {
  const pixels = await makeNormalPixels(image, options, runLocalModel, onProgress, signal);
  signal.throwIfAborted();
  const { PhotonImage } = await import("@silvia-odwyer/photon-node");
  const result = new PhotonImage(pixels, image.width, image.height);
  try { return result.get_bytes(); }
  finally { result.free(); }
}
