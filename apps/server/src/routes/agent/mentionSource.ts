import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const router = Router();
const shape = {
  operation: z.enum(["canvases", "nodes", "outputs", "selectCanvas", "assets", "selectAsset"]),
  directory: z.string().min(1).max(4096), canvasId: z.string().min(1).max(4096).optional(),
  nodeId: z.string().min(1).max(256).optional(), outputId: z.string().min(1).max(256).optional(),
  path: z.string().max(4096).optional(), query: z.string().max(200).optional(), cursor: z.string().max(4096).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
};

export default router.get("/", validateFields(shape, "query"), async (req, res) => {
  const args = z.object(shape).parse(req.query);
  const directory = await u.workspace.resolveWorkspace(req, args.directory);
  const controller = new AbortController();
  const cancel = () => { if (!res.writableEnded) controller.abort(new Error("查询已取消")); };
  res.on("close", cancel);
  try {
    const options = { query: args.query, cursor: args.cursor, limit: args.limit, signal: controller.signal };
    let result: unknown;
    if (args.operation === "canvases") result = await u.mentionFiles.listMentionCanvases(directory, controller.signal);
    else if (args.operation === "assets") result = await u.mentionFiles.queryMentionAssets({ ...options, path: args.path });
    else if (args.operation === "selectAsset") {
      if (!args.path) throw Object.assign(new Error("请选择素材"), { status: 400 });
      result = await u.mentionFiles.selectMentionAsset(args.path);
    } else {
      if (!args.canvasId) throw Object.assign(new Error("请选择画布"), { status: 400 });
      if (args.operation === "nodes") result = await u.mentionFiles.queryStoredMentionNodes(directory, args.canvasId, options);
      else {
        if (!args.nodeId) throw Object.assign(new Error("请选择节点"), { status: 400 });
        result = await u.mentionFiles.storedMentionOutput(directory, args.canvasId, args.nodeId, args.operation === "selectCanvas" ? args.outputId ?? null : undefined);
      }
    }
    controller.signal.throwIfAborted();
    res.set("Cache-Control", "no-store").json(success(result));
  } finally { res.off("close", cancel); }
});
