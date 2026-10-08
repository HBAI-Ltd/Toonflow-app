import { Router } from "express";
import { z } from "zod";
import { audioGenerationSchema, imageGenerationSchema, videoGenerationSchema } from "@toonflow/tool-media-generation/runtime";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";
import { validationOptions, translateMessage } from "@/lib/i18n";

export default Router().post("/", validateFields({ directory: z.string().min(1).max(4096), mediaType: z.enum(["image", "video", "audio"]) }), async (req, res) => {
  const { directory, mediaType, ...request } = req.body;
  const parsed = (mediaType === "image" ? imageGenerationSchema : mediaType === "video" ? videoGenerationSchema : audioGenerationSchema).safeParse(request, validationOptions());
  if (!parsed.success) {
    res.status(400).json({ code: 400, data: parsed.error.issues.map(issue => ({ ...issue, message: translateMessage(issue.message) })), message: "参数错误" });
    return;
  }
  const cwd = await u.workspace.resolveWorkspace(req, directory);
  res.status(202).json(success(await u.mediaTasks.createMediaTask(cwd, mediaType, parsed.data)));
});
