import express from "express";
import { success, error } from "@/lib/responseFormat";
import { db } from "@/utils/db";

const router = express.Router();

export default router.post("/", async (req, res) => {
  try {
    const { tableName } = req.body;
    if (!tableName || typeof tableName !== "string") {
      return res.status(400).send(error("请提供有效的表名"));
    }

    // 验证表名存在（防止SQL注入）
    const tableExists: { name: string }[] = await db.raw(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      [tableName],
    );
    if (tableExists.length === 0) {
      return res.status(400).send(error("表不存在"));
    }

    // 使用 Knex 的 ref() 安全引用标识符，避免字符串拼接注入
    await db(db.ref(tableName)).del();

    res.status(200).send(success(`表 ${tableName} 已清空`));
  } catch (err: any) {
    res.status(500).send(error(err?.message || "清空表失败"));
  }
});
