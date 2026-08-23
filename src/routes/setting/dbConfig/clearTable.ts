import express from "express";
import { success, error } from "@/lib/responseFormat";
import { db } from "@/utils/db";
import { t, getLocale } from "@/i18n";

const router = express.Router();

export default router.post("/", async (req, res) => {
  const locale = await getLocale(req as any);
  try {
    const { tableName } = req.body;
    if (!tableName || typeof tableName !== "string") {
      return res.status(400).send(error(t("setting.dbConfig.clearTable.invalidTableName", {}, locale)));
    }

    // 验证表名存在（防止SQL注入）
    const tableExists: { name: string }[] = await db.raw(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      [tableName],
    );
    if (tableExists.length === 0) {
      return res.status(400).send(error(t("setting.dbConfig.clearTable.tableNotFound", {}, locale)));
    }

    await db.raw(`DELETE FROM "${tableName}"`);

    res.status(200).send(success(null, t("setting.dbConfig.clearTable.cleared", { tableName }, locale)));
  } catch (err: any) {
    res.status(500).send(error(err?.message || t("setting.dbConfig.clearTable.failed", {}, locale)));
  }
});
