import express from "express";
import initDB from "@/lib/initDB";
import { db } from "@/utils/db";
import { success } from "@/lib/responseFormat";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 清空数据表
export default router.post(
    "/",
    async (req, res) => {
        const locale = await getLocale(req as any);
        await initDB(db, true);
        res.status(200).send(success({ message: t("other.deleteAllData.cleared", {}, locale) }));
    },
);
