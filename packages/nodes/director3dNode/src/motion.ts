import { z } from "@toonflow/nodes-scaffold/runtime";
import { PerspectiveCamera } from "three";
import { cameraViewSchema, type CameraView } from "./scene";

export const anchorSchema = cameraViewSchema.extend({
  id: z.string().min(1).default(() => crypto.randomUUID()),
  time: z.number().min(0).max(300).optional(),
}).strip();
export type CameraAnchor = z.infer<typeof anchorSchema>;
export const cameraFramesSchema = z.array(z.strictObject({
  time: z.number().min(0).max(300),
  view: cameraViewSchema,
  easing: z.enum(["linear", "smooth", "cut"]),
})).min(1).max(120).refine(frames => frames.every((frame, index) => !index || frame.time > frames[index - 1]!.time), "镜头时间必须递增");

export function applyCamera(camera: PerspectiveCamera, view: CameraView) {
  const { position, fov, near, far } = view.camera;
  camera.position.set(position.x, position.y, position.z);
  Object.assign(camera, { fov, near, far });
  camera.lookAt(view.controls.target.x, view.controls.target.y, view.controls.target.z);
  camera.updateProjectionMatrix();
}

export function prepareMotion(value: z.infer<typeof cameraFramesSchema>) {
  return cameraFramesSchema.parse(value).map(frame => {
    const camera = new PerspectiveCamera();
    applyCamera(camera, frame.view);
    return { ...frame, camera };
  });
}

export function sampleMotion(camera: PerspectiveCamera, frames: ReturnType<typeof prepareMotion>, time: number) {
  if (!Number.isFinite(time)) throw new Error("运镜时间无效");
  const last = frames.at(-1)!;
  const end = frames.findIndex(frame => frame.time >= time);
  const next = frames[end < 0 ? frames.length - 1 : end]!;
  const previous = frames[Math.max(0, (end < 0 ? frames.length - 1 : end) - 1)]!;
  let progress = next === previous ? 1 : Math.min(1, Math.max(0, (time - previous.time) / (next.time - previous.time)));
  if (next.easing === "cut") progress = time >= next.time ? 1 : 0;
  if (next.easing === "smooth") progress = progress * progress * (3 - 2 * progress);
  camera.position.lerpVectors(previous.camera.position, next.camera.position, progress);
  camera.quaternion.slerpQuaternions(previous.camera.quaternion, next.camera.quaternion, progress);
  for (const field of ["fov", "near", "far"] as const) camera[field] = previous.camera[field] + (next.camera[field] - previous.camera[field]) * progress;
  camera.updateProjectionMatrix();
  return time >= last.time;
}
