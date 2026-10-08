import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().post("/", validateFields({ directory: z.string().min(1).max(4096) }), async (req, res) => {
  const directory = await u.workspace.resolveWorkspace(req, req.body.directory);
  let changed = false;
  const manifest = await u.production.readProductionManifest(directory);
  const tasks = await u.mediaTasks.getMediaTasks(directory, manifest.shots.flatMap(shot => shot.taskId ? [shot.taskId] : []));
  const byId = new Map(tasks.map(task => [task.id, task]));
  const next = await u.production.updateProductionManifest(directory, current => {
    for (const shot of current.shots) {
      if (!shot.taskId) continue;
      const task = byId.get(shot.taskId);
      if (!task) continue;
      const status = task.status === "completed" ? "review" : task.status === "failed" ? "needsRedo" : task.status === "cancelled" ? "draft" : "generating";
      if (shot.status !== status || (task.result?.[0]?.path && shot.outputPath !== task.result[0].path)) {
        shot.status = status;
        if (task.result?.[0]?.path) shot.outputPath = task.result[0].path;
        changed = true;
      }
    }
  });
  res.json(success({ changed, manifest: next }));
});
