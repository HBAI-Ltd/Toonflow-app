import express from "express";
import { success, error } from "@/lib/responseFormat";
import { db } from "@/utils/db";
import { t, getLocale } from "@/i18n";

const router = express.Router();

export default router.get("/", async (req, res) => {
  const locale = await getLocale(req as any);
  try {
    const tables: { name: string }[] = await db.raw(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'knex_%'`,
    );

    const tableInfo = [];
    for (const table of tables) {
      const countResult = await db.raw(`SELECT COUNT(*) as count FROM "${table.name}"`);
      tableInfo.push({
        name: table.name,
        rowCount: countResult[0]?.count ?? 0,
      });
    }

    res.status(200).send(success(tableInfo));
  } catch (err: any) {
    res.status(500).send(error(err?.message || t("setting.dbConfig.dbInfo.failed", {}, locale)));
  }
});
