import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { t, translateError } from "@/lib/i18n";
import u from "@/utils";
import { thinkingLevels } from "@/lib/modelReasoning";
import { getAgentModelConfiguration } from "@/agent/runtime/model";
import { detectMimeType } from "@/utils/media/priceReference";

const maxImageBytes = 10 * 1024 * 1024;
const imageSchema = z.strictObject({
  type: z.literal("image"),
  data: z.string().min(4).max(Math.ceil(maxImageBytes / 3) * 4).regex(/^[A-Za-z0-9+/]+={0,2}$/),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
}).refine(image => {
  const bytes = Buffer.from(image.data, "base64");
  return bytes.byteLength > 0 && bytes.byteLength <= maxImageBytes && bytes.toString("base64") === image.data
    && detectMimeType(bytes, "") === image.mimeType;
}, { error: () => t`图片内容、格式或大小无效，单张图片不能超过 10 MiB` });

const inputSchema = z.strictObject({
  sessionId: z.uuid(), runId: z.uuid(), prompt: z.string().trim().min(1).max(100000),
  providerId: z.string().min(1).max(200), modelId: z.string().min(1).max(500),
  thinkingLevel: z.enum(thinkingLevels).optional(),
  includeToolResults: z.boolean().optional(),
  images: z.array(imageSchema).max(16).refine(images => images.reduce((total, image) => total + Buffer.byteLength(image.data, "base64"), 0) <= 64 * 1024 * 1024, { error: () => t`本次对话图片总量不能超过 64 MiB` }).optional(),
});

export default Router().post("/", validateFields(inputSchema.shape), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const input = inputSchema.parse(req.body);
  await getAgentModelConfiguration(input.providerId, input.modelId, input.thinkingLevel);
  const controller = new AbortController();
  const abort = () => controller.abort();
  res.once("close", abort);
  req.once("aborted", abort);
  req.socket.once("close", abort);
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  try {
    await u.singleAgent.run(input, event => {
      if (!res.destroyed) res.write(`${JSON.stringify(event.type === "error" ? { ...event, message: translateError(new Error(event.message)) } : event)}\n`);
    }, controller.signal, () => {
      res.set({ "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" });
      res.flushHeaders();
      heartbeat = setInterval(() => { if (!res.destroyed && !res.writableNeedDrain) res.write("\n"); }, 1000);
    });
    if (!res.destroyed) res.end();
  } finally {
    clearInterval(heartbeat);
    res.off("close", abort);
    req.off("aborted", abort);
    req.socket.off("close", abort);
  }
});
