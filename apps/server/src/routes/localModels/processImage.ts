import { z } from "zod";
import { mediaModelRoute } from "@/lib/mediaModelRequest";
import u from "@/utils";

const options = z.discriminatedUnion("operation", [
  z.strictObject({ operation: z.literal("upscale"), scale: z.union([z.literal(2), z.literal(3), z.literal(4)]) }),
  z.strictObject({ operation: z.literal("normalMap"), convention: z.enum(["openGl", "directX"]), strength: z.number().min(0.1).max(2) }),
  z.strictObject({ operation: z.literal("lineArt"), ink: z.enum(["black", "white"]) }),
  z.strictObject({ operation: z.literal("animeMask"), part: z.int().min(0).max(6) }),
  z.strictObject({ operation: z.literal("handPose") }),
]);
export type ImageModelOptions = z.infer<typeof options>;

export default mediaModelRoute(options, u.processWorkspaceImage);
