import express from "express";
import db from "@/utils/db";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    state: z.string().optional().nullable(),
    taskClass: z.string().optional().nullable(),
    projectId: z.number().optional().nullable(),
    page: z.number(),
    limit: z.number(),
  }),
  async (req, res) => {
    const { taskClass, state, projectId, page = 1, limit = 10 } = req.body as {
      taskClass?: string | null;
      state?: string | null;
      projectId?: number | null;
      page: number;
      limit: number;
    };
    const offset = (page - 1) * limit;

    const data = await db("o_tasks")
      .leftJoin("o_project", "o_project.id", "o_tasks.projectId")
      .andWhere((qb) => {
        if (taskClass) {
          qb.andWhere("o_tasks.taskClass", taskClass);
        }
        if (state) {
          qb.andWhere("o_tasks.state", state);
        }
        if (projectId) {
          qb.andWhere("o_tasks.projectId", projectId);
        }
      })
      .select("o_tasks.*", "o_project.* ")
      .offset(offset)
      .limit(limit)
      .orderBy("o_tasks.id", "desc");

    const totalQuery = (await db("o_tasks")
      .andWhere((qb) => {
        if (taskClass) {
          qb.andWhere("o_tasks.taskClass", taskClass);
        }
        if (projectId) {
          qb.andWhere("o_tasks.projectId", projectId);
        }
        if (state) {
          qb.andWhere("o_tasks.state", state);
        }
      })
      .count("* as total")
      .first()) as { total?: number | string } | undefined;

    res.status(200).send(success({ data, total: totalQuery?.total }));
  },
);
