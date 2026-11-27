import { makeHandPosePixels } from "@toonflow/node-image/handPose";
import { runLocalModel } from "@/utils/localModel/inference";

export async function createHandPose(image: { width: number; height: number; rgba: Uint8Array },
  progress: (completed: number, total: number) => void, signal: AbortSignal) {
  const pixels = await makeHandPosePixels(image, runLocalModel, progress, signal);
  signal.throwIfAborted();
  const { PhotonImage } = await import("@silvia-odwyer/photon-node");
  const result = new PhotonImage(pixels, image.width, image.height);
  try { return result.get_bytes(); }
  finally { result.free(); }
}
