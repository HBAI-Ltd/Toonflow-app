import { predictParts, renderParts, type PartsOptions } from "@toonflow/node-image/imageParts";
import { runLocalModel } from "@/utils/localModel/inference";

export async function extractImageParts(image: { width: number; height: number; rgba: Uint8Array }, options: PartsOptions,
  progress: (completed: number, total: number) => void, signal: AbortSignal) {
  progress(0, 2);
  const map = await predictParts(image, options.operation === "lineArt", runLocalModel, signal);
  progress(1, 2);
  const out = renderParts(image, options, map);
  signal.throwIfAborted();
  const { PhotonImage } = await import("@silvia-odwyer/photon-node");
  const png = new PhotonImage(out, image.width, image.height);
  try { return png.get_bytes(); } finally { png.free(); }
}
