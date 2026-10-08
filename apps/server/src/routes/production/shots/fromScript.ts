import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().post("/", validateFields({ directory: z.string().min(1).max(4096), script: z.string().trim().min(1).max(200000) }), async (req, res) => {
  const directory = await u.workspace.resolveWorkspace(req, req.body.directory);
  const lines = req.body.script.split(/\r?\n+/).map((line: string) => line.trim()).filter(Boolean);
  if (!lines.length) throw Object.assign(new Error("剧本没有可拆分的内容"), { status: 400 });
  const current = await u.production.readProductionManifest(directory);
  const shots = lines.map((line: string, index: number) => ({
    id: crypto.randomUUID(), order: current.shots.length + index, title: line.slice(0, 48), prompt: line,
    status: "draft" as const, mediaType: "video" as const,
  }));
  res.json(success(await u.production.writeProductionManifest(directory, { ...current, shots: [...current.shots, ...shots] })));
});
