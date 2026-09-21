import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({ url: z.string().min(1).max(8192) }), (req, res) => {
  u.desktop.getDesktopRuntime(req).openUrl(req.body.url);
  res.json(success(null));
});
