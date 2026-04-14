import express from "express";
import u from "@/utils";
import db from "@/utils/db";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();
import { flowDataSchema } from "@/agents/productionAgent/tools";

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    episodesId: z.number(),
    data: z.any(),
  }),
  async (req, res) => {
    const {
      data,
      projectId,
      episodesId,
    }: {
      data: z.infer<typeof flowDataSchema>;
      projectId: number;
      episodesId: number;
    } = req.body;
    const sqlData = await db("o_agentWorkData").where("projectId", projectId).andWhere("episodesId", episodesId).first();
    const filterDatas = data.storyboard.filter((i) => !i.id);
    if (data.storyboard && data.storyboard.length && !filterDatas.length)
      await Promise.all(
        data.storyboard
          .filter((i) => i.id)
          .map(async (i, index) => {
            await db("o_storyboard").where("id", i.id).update({
              index: index,
            });
          }),
      );
    if (!sqlData) {
      await db("o_agentWorkData").insert({
        projectId,
        episodesId,
        key: "productionAgent",
        data: JSON.stringify(data),
      });
    } else {
      await db("o_agentWorkData")
        .where("projectId", projectId)
        .where("key", "productionAgent")
        .andWhere("episodesId", episodesId)
        .update({
          data: JSON.stringify(data),
        });
    }
    return res.status(200).send(success());
  },
);
