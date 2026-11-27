import { z } from "zod";
import { mediaModelRoute } from "@/lib/mediaModelRequest";
import u from "@/utils";

const area = { x: z.number().min(0).lt(100), y: z.number().min(0).lt(100),
  width: z.number().min(0.01).max(100), height: z.number().min(0.01).max(100) };
const time = z.number().min(0).max(86400);
const options = z.discriminatedUnion("operation", [
  z.strictObject({ operation: z.literal("portraitMatting"), outputMode: z.enum(["transparent", "mask"]) }),
  z.strictObject({ operation: z.literal("restoreSubtitles"), ...area }),
  z.strictObject({ operation: z.literal("readSubtitles"), ...area }),
  z.strictObject({ operation: z.literal("trackTarget"), ...area }),
  z.strictObject({ operation: z.literal("repairBadFrame"), time }),
  z.strictObject({ operation: z.literal("upscale"), scale: z.union([z.literal(2), z.literal(3), z.literal(4)]) }),
  z.strictObject({ operation: z.literal("interpolate"), factor: z.union([z.literal(2), z.literal(4)]) }),
  z.strictObject({ operation: z.literal("reframe"), aspect: z.enum(["portrait", "square", "fourFive"]), smooth: z.int().min(0).max(100) }),
  z.strictObject({ operation: z.literal("blurBackground"), radius: z.int().min(2).max(48) }),
]);
export type VideoModelOptions = z.infer<typeof options>;

export default mediaModelRoute(options, u.processWorkspaceVideo);
