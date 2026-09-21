import { Router } from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";

export default Router().get("/", (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const runtime = u.mcpRuntime.getMcpRuntime();
  const origin = u.mcpControl.getAppOrigin(req);
  res.set("Cache-Control", "no-store").json(success({
    enabled: u.mcpControl.getMcpSettings().enabled,
    connections: u.mcpControl.listConnections(),
    ...runtime,
    endpoint: ["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname) ? runtime.endpoint : `${origin}/mcp`,
  }));
});
