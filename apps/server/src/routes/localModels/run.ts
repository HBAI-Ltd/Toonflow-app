import { Router } from "express";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";
import u from "@/utils";

// 单次推理由插件直接调用，限制同一客户端对同一模型的请求频率。
const recentCalls = new Map<string, number>();

export default Router().post("/", validateFields(u.localModelInference.runSchema.shape), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const key = JSON.stringify([res.locals.multiTenantUser?.id ?? req.socket.remoteAddress, req.body.id]);
  const count = recentCalls.get(key) ?? 0;
  if (count >= 4) return res.set("Retry-After", "1").status(429).json(error("插件服务请求过于频繁", null, 429));
  if (!count) setTimeout(() => recentCalls.delete(key), 1000).unref();
  recentCalls.set(key, count + 1);
  const controller = new AbortController();
  const cancel = () => controller.abort();
  res.once("close", cancel);
  try {
    res.json(success(await u.localModelInference.runLocalModel(req.body, controller.signal)));
  } finally { res.off("close", cancel); }
});
