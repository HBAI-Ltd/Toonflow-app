import express from "express";
import u from "@/utils";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    name: z.string(),
    fileUrl: z.string(),
    prompt: z.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { name, fileUrl, prompt } = req.body;
    const imagePath = `/artStyle/${uuidv4()}.jpg`;
    const matches = fileUrl.match(/^data:image\/\w+;base64,(.+)$/);
    const realBase64 = matches ? matches[1] : fileUrl;
    await u.oss.writeFile(imagePath, Buffer.from(realBase64, "base64"));
    await u.db("o_artStyle").insert({
      name,
      fileUrl: imagePath,
      label: name,
      prompt,
    });
    res.status(200).send(success(t("artStyle.addArtStyle.added", {}, locale)));
  },
);
