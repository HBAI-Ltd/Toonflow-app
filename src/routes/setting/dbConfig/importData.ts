import express from "express";
import { success, error } from "@/lib/responseFormat";
import { db } from "@/utils/db";
import initDB from "@/lib/initDB";

const router = express.Router();

export default router.post("/", async (req, res) => {
  try {
    const { tables: importTables } = req.body;
    if (!importTables || typeof importTables !== "object") {
      return res.status(400).send(error("无效的导入数据格式"));
    }

    // 删除所有现有表
    const existingTables: { name: string }[] = await db.raw(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'knex_%'`,
    );

    await db.raw("PRAGMA foreign_keys = OFF");
    for (const table of existingTables) {
      await db.schema.dropTableIfExists(table.name);
    }
    await db.raw("PRAGMA foreign_keys = ON");

    // 重新初始化表结构
    await initDB(db as any);

    // 导入数据
    await db.raw("PRAGMA foreign_keys = OFF");
    for (const [tableName, rows] of Object.entries(importTables)) {
      if (!Array.isArray(rows) || rows.length === 0) continue;

      // 验证表名合法性（防止SQL注入）
      const tableExists = await db.raw(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [tableName],
      );
      if (tableExists.length === 0) continue;

      // 使用 Knex 的 ref() 安全引用标识符，避免字符串拼接注入
      await db(db.ref(tableName)).del();
      // 分批插入，每批100条
      for (let i = 0; i < rows.length; i += 100) {
        const batch = rows.slice(i, i + 100);
        await db(tableName).insert(batch);
      }
    }
    await db.raw("PRAGMA foreign_keys = ON");

    res.status(200).send(success("数据库导入成功"));
  } catch (err: any) {
    res.status(500).send(error(err?.message || "导入失败"));
  }
});
