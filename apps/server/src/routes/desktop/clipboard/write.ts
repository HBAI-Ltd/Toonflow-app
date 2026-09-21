import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({ text: z.string() }), (req, res) => {
  u.desktop.getDesktopRuntime(req).writeClipboardText(req.body.text);
  res.json(success());
});
