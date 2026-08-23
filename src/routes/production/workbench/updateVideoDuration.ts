import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();
export default router.post(
    "/",
    validateFields({
        id: z.number(),
        duration: z.number().optional(),
    }),
    async (req, res) => {
        const { id, duration } = req.body;
        const locale = await getLocale(req as any);
        await u.db("o_videoTrack").where("id", id).update({
            duration,
        });
        res.status(200).send(success(t("production.workbench.updateVideoDuration.updated", {}, locale)));
    },
);
