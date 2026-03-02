import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

function normalizeInputPath(input: string): string {
  const value = input.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      return new URL(value).pathname;
    } catch {
      return value;
    }
  }
  return value;
}

// 保存分镜图
export default router.post(
  "/",
  validateFields({
    id: z.number(),
    filePath: z.string(),
    prompt: z.string(),
  }),
  async (req, res) => {
    const { filePath, id, prompt } = req.body;
    const savePath = normalizeInputPath(filePath);

    let imageUrl = "";

    const oldImage = await u.db("t_assets").where("id", id).select("filePath").first();
    const oldFilePath = oldImage?.filePath;

    if (!oldFilePath || oldFilePath !== savePath) {
      imageUrl = savePath;

      if (oldFilePath) {
        await u.db("t_image").insert({
          assetsId: id,
          filePath: oldFilePath,
          type: "分镜",
        });

        await u.db("t_image").where("assetsId", id).andWhere("filePath", savePath).del();
      }
    } else {
      imageUrl = oldFilePath;
    }

    await u.db("t_assets").where("id", id).update({
      filePath: imageUrl,
      prompt,
    });

    res.status(200).send({ message: "保存分镜图成功" });
  }
);
