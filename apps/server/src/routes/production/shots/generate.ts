import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().post("/", validateFields({ directory: z.string().min(1).max(4096), shotIds: z.array(z.uuid()).min(1).max(1000), providerId: z.string().regex(/^[a-z][a-zA-Z0-9]{0,95}$/), modelId: z.string().trim().min(1).max(256), mediaType: z.enum(["image", "video", "audio"]).optional() }), async (req, res) => {
  const directory = await u.workspace.resolveWorkspace(req, req.body.directory);
  const manifest = await u.production.readProductionManifest(directory);
  const selected = new Set(req.body.shotIds as string[]);
  const chosen = manifest.shots.filter(shot => selected.has(shot.id));
  if (chosen.length !== selected.size) throw Object.assign(new Error("部分镜头不存在"), { status: 404 });
  const created: { shotId: string; taskId: string }[] = [];
  for (const shot of chosen) {
    const mediaType = req.body.mediaType ?? shot.mediaType ?? "video";
    const task = await u.mediaTasks.createMediaTask(directory, mediaType, {
      providerId: req.body.providerId, modelId: req.body.modelId, prompt: shot.prompt,
      outputDirectory: shot.outputDirectory ?? `assets/production/${shot.id}`,
      ...(shot.duration ? { duration: shot.duration } : {}),
    });
    shot.providerId = req.body.providerId;
    shot.modelId = req.body.modelId;
    shot.mediaType = mediaType;
    shot.taskId = task.id;
    shot.status = "generating";
    created.push({ shotId: shot.id, taskId: task.id });
  }
  await u.production.writeProductionManifest(directory, manifest);
  res.status(202).json(success({ tasks: created, manifest }));
});
