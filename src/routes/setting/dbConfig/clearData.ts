import express from "express";
import { success, error } from "@/lib/responseFormat";
import { db } from "@/utils/db";
import initDB from "@/lib/initDB";
import { t, getLocale } from "@/i18n";

const router = express.Router();

export default router.get("/", async (req, res) => {
  const locale = await getLocale(req as any);
  try {
    // 获取所有表名
    const tables: { name: string }[] = await db.raw(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'knex_%'`,
    );

    // 禁用外键约束，逐一删除所有表
    await db.raw("PRAGMA foreign_keys = OFF");
    for (const table of tables) {
      await db.schema.dropTableIfExists(table.name);
    }
    await db.raw("PRAGMA foreign_keys = ON");

    // 重新初始化数据库
    await initDB(db as any);

    res.status(200).send(success(null, t("setting.dbConfig.clearData.cleared", {}, locale)));
  } catch (err: any) {
    res.status(500).send(error(err?.message || t("setting.dbConfig.clearData.failed", {}, locale)));
  }
});
