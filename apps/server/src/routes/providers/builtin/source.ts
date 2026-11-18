import { Router } from "express";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const inputSchema = u.builtinProvider.sourceSchema;

export default Router().get("/", validateFields(inputSchema.shape, "query"), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const { id, kind } = inputSchema.parse(req.query);
  const controller = new AbortController();
  res.set("Cache-Control", "no-store");
  const abort = () => controller.abort();
  res.on("close", abort);
  try {
    const data = await u.builtinProvider.getSource(id, kind, controller.signal);
    res.json(success(data));
  } finally { res.off("close", abort); }
});

