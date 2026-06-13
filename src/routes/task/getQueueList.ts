import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

// 分页查询生成队列任务（监控排队/执行/失败情况）
export default router.post(
  "/",
  validateFields({
    projectId: z.number().optional(),
    state: z.enum(["排队中", "执行中", "已完成", "失败"]).optional(),
    page: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
  }),
  async (req, res) => {
    const { projectId, state, page = 1, pageSize = 20 } = req.body;

    const base = u.db("o_genQueue");
    if (projectId != null) base.where("projectId", projectId);
    if (state) base.where("state", state);

    const countRows = await base.clone().count<{ c: number }[]>("id as c");
    const total = Number(countRows[0]?.c ?? 0);

    const list = await base
      .clone()
      .orderBy("id", "desc")
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .select("id", "projectId", "kind", "vendorId", "priority", "state", "retryCount", "maxRetry", "errorReason", "createTime", "updateTime");

    return res.status(200).send(success({ total, page, pageSize, list }));
  },
);
