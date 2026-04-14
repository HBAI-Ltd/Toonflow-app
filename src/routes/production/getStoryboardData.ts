import express from "express";
import u from "@/utils";
import db from "@/utils/db";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    scriptId: z.number(),
  }),
  async (req, res) => {
    const { scriptId } = req.body;
    const storyboardData = await db("o_storyboard").where({ scriptId }).orderBy("index", "asc");
    const data = await Promise.all(
      storyboardData.map(async (i) => {
        return {
          ...i,
          filePath: i.filePath ? await u.oss.getFileUrl(i.filePath!) : "",
        };
      }),
    );

    //获取相关资产
    const storyboardIds = storyboardData.map((s) => s.id as number);

    // 修复：o_assets.id 关联 o_assets2Storyboard.assetId，按 storyboardId 过滤
    const storyboardConfigs = await db("o_assets2Storyboard")
      .leftJoin("o_assets", "o_assets2Storyboard.assetId", "o_assets.id")
      .leftJoin("o_image", "o_assets.imageId", "o_image.id")
      .whereIn("o_assets2Storyboard.storyboardId", storyboardIds)
      .select("o_assets2Storyboard.storyboardId", "o_assets.id as assetId", "o_assets.name", "o_assets.type", "o_image.filePath as avatar");

    // 按 storyboardId 分组，生成 characters 列表
    const storyboardCharactersMap = storyboardConfigs.reduce<Record<number, { name: string; type: string; avatar?: string }[]>>((acc, cur) => {
      const storyboardId = cur.storyboardId as number;
      if (!acc[storyboardId]) {
        acc[storyboardId] = [];
      }
      const character: { name: string; type: string; avatar?: string } = {
        name: cur.name ?? "",
        type: cur.type ?? "",
      };
      if (cur.avatar) {
        character.avatar = cur.avatar;
      }
      acc[storyboardId].push(character);
      return acc;
    }, {});

    // 组装最终数据，符合 Shot 接口格式
    const result = await Promise.all(
      data.map(async (item) => {
        const characters = storyboardCharactersMap[item.id as number] ?? [];
        // 处理 characters 中的 avatar OSS 路径
        const charactersWithUrl = await Promise.all(
          characters.map(async (c) => {
            if (c.avatar) {
              return { ...c, avatar: await u.oss.getFileUrl(c.avatar) };
            }
            return c;
          }),
        );
        return {
          id: String(item.id),
          createTime: item.createTime ?? undefined,
          duration: item.duration ? Number(item.duration) : undefined,
          filePath: item.filePath || undefined,
          prompt: item.prompt ?? undefined,
          scriptId: item.scriptId ?? undefined,
          characters: charactersWithUrl,
        };
      }),
    );
    res.status(200).send(success(result));
  },
);
