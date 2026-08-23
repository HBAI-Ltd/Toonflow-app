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

    const data: Record<string, any[]> = {};
    for (const table of tables) {
      data[table.name] = await db.raw(`SELECT * FROM "${table.name}"`);
    }

    const exportData = {
      exportTime: Date.now(),
      tables: data,
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=toonflow-backup-${Date.now()}.json`);
    res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (err: any) {
    res.status(500).send(error(err?.message || t("setting.dbConfig.exportData.failed", {}, locale)));
  }
});
