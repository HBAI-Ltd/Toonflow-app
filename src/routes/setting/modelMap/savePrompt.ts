import express from "express";
import { error, success } from "@/lib/responseFormat";
import u from "@/utils";
import { z } from "zod";
import { validateFields } from "@/middleware/middleware";
import fs from "fs/promises";
import path from "path";
import { t, getLocale } from "@/i18n";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    name: z.string().min(1),
    data: z.string(),
    type: z.enum(["image", "video"]),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { name, data, type } = req.body;

    const modelPromptRoot = u.getPath(["modelPrompt"]);
    const dir = path.join(modelPromptRoot, type);

    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, `${name}.md`);
    await fs.writeFile(filePath, data, "utf-8");

    res.status(200).send(success(null, t("setting.modelMap.savePrompt.saved", {}, locale)));
  },
);
