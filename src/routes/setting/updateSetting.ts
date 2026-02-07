import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

// 修改全局配置
export default router.post(
  "/",
  validateFields({
    userId: z.number(),
    imageModel: z.object().optional(),
    videoModel: z.array(z.object()).optional(),
    languageModel: z.object().optional(),
    name: z.string().optional(),
    password: z.string().optional(),
  }),
  async (req, res) => {
    const { userId, imageModel, videoModel, languageModel, name, password } = req.body;

    await u
      .db("t_setting")
      .where("userId", userId)
      .update({
        imageModel: JSON.stringify(imageModel),
        languageModel: JSON.stringify(languageModel),
      });

    if (videoModel) {
      await u.db("t_config").where("type", "video").delete();

      for (const item of videoModel) {
        await u.db("t_config").insert({
          type: "video",
          name: item.name,
          model: item.model,
          apiKey: item.apiKey,
          baseUrl: item.baseUrl,
          sortIndex: item.index,
          createTime: Date.now(),
          userId,
          manufacturer: item.manufacturer,
        });
      }
    }

    await u.db("t_user").where("id", userId).update({
      name,
      password,
    });

    // 自动记录模型历史（用于下拉选择）
    const modelEntries: Array<{ modelId: string; type: string; manufacturer: string; baseUrl: string }> = [];
    if (languageModel?.model) {
      modelEntries.push({ modelId: languageModel.model, type: "language", manufacturer: languageModel.manufacturer || "", baseUrl: languageModel.baseURL || "" });
    }
    if (imageModel?.model) {
      modelEntries.push({ modelId: imageModel.model, type: "image", manufacturer: imageModel.manufacturer || "", baseUrl: imageModel.baseURL || "" });
    }
    for (const entry of modelEntries) {
      const existing = await u.db("t_model_history").where({ modelId: entry.modelId, type: entry.type, userId }).first();
      if (existing) {
        await u.db("t_model_history").where({ id: existing.id }).update({ manufacturer: entry.manufacturer, baseUrl: entry.baseUrl, lastUsedTime: Date.now() });
      } else {
        await u.db("t_model_history").insert({ id: Date.now() + Math.floor(Math.random() * 1000), modelId: entry.modelId, type: entry.type, manufacturer: entry.manufacturer, baseUrl: entry.baseUrl, lastUsedTime: Date.now(), userId });
      }
    }

    res.status(200).send(success({ message: "修改全局配置成功" }));
  }
);
