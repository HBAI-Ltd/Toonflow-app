import { Router } from "express";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const inputSchema = u.builtinProvider.listSchema;

export default Router().get("/", validateFields(inputSchema.shape, "query"), async (req, res) => {
  await u.multiTenant.authorize(req);
  const { kind } = inputSchema.parse(req.query);
  const controller = new AbortController();
  res.set("Cache-Control", "no-store");
  const abort = () => controller.abort();
  res.on("close", abort);
  try {
    const data = await u.channel.getChannel().getVendors(kind, { signal: controller.signal });
    res.json(success(data));
  } finally { res.off("close", abort); }
});

