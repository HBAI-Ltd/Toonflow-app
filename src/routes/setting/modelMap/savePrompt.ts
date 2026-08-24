import express from "express";
import { error, success } from "@/lib/responseFormat";
import u from "@/utils";
import { z } from "zod";
import { validateFields } from "@/middleware/middleware";
import fs from "fs/promises";
import path from "path";
import { t, getLocale } from "@/i18n";
import { isShippedModelPrompt } from "@/lib/shippedPrompts";

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
    const filePath = path.join(dir, `${name}.md`);

    // 路径隧穿检测（name 由用户输入，未做校验，理论上可含 ../）
    const resolvedRoot = path.resolve(modelPromptRoot);
    const resolvedFile = path.resolve(filePath);
    if (!resolvedFile.startsWith(resolvedRoot + path.sep)) {
      return res.status(400).send(error(t("setting.modelMap.savePrompt.invalidPath", {}, locale)));
    }

    // 内置文件（原始 zh 版本或其 en/vi 翻译 sidecar）不允许被同名新建覆盖，理由同 deletePrompt.ts
    const relFromRoot = path.relative(resolvedRoot, resolvedFile).split(path.sep).join("/");
    if (isShippedModelPrompt(relFromRoot)) {
      return res.status(400).send(error(t("setting.modelMap.savePrompt.shipped", {}, locale)));
    }

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, data, "utf-8");

    res.status(200).send(success(null, t("setting.modelMap.savePrompt.saved", {}, locale)));
  },
);
