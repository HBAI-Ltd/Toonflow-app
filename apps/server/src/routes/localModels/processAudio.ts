import { z } from "zod";
import { mediaModelRoute } from "@/lib/mediaModelRequest";
import u from "@/utils";

const pcm = z.strictObject({
    sampleRate: z.int().min(1).max(384000),
    channels: z.int().min(1).max(32),
    format: z.enum(["u8", "s16le", "s24le", "s32le", "f32le", "s16be", "s24be", "s32be", "f32be"]),
}).optional();
const options = z.discriminatedUnion("operation", [
  z.strictObject({ operation: z.literal("separateVocals"), pcm }),
  z.strictObject({ operation: z.literal("denoiseSpeech"), pcm }),
  z.strictObject({ operation: z.literal("tightenSpeech"), pauseMs: z.int().min(200).max(2500), pcm }),
  z.strictObject({ operation: z.literal("transcribe"), language: z.enum(["auto", "zh", "en", "ja", "ko"]), pcm }),
]);
export type AudioModelOptions = z.infer<typeof options>;

export default mediaModelRoute(options, u.processWorkspaceAudio);
