import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({
  text: z.string().optional(),
  format: z.literal("image").optional(),
  image: z.string().optional(),
}), async (req, res) => {
  const desktop = u.desktop.getDesktopRuntime(req);
  if (req.body.format === "image") {
    if (!req.body.image) return res.status(400).json(error("缺少图片数据", null, 400));
    const png = await new Bun.Image(Buffer.from(req.body.image, "base64")).png().buffer();
    desktop.writeClipboardImage(new Uint8Array(png));
  } else if (typeof req.body.text === "string") {
    desktop.writeClipboardText(req.body.text);
  } else {
    return res.status(400).json(error("缺少剪贴板内容", null, 400));
  }
  res.json(success());
});
