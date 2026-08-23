import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
    "/",
    validateFields({
        items: z.array(z.object({
            id: z.number(),
            sources: z.string()
        }))
    }),
    async (req, res) => {
        const { items } = req.body;
        const result: Record<string, string> = {};
        const storyboardIds = items.filter((item: any) => item.sources == "storyboard").map((item: any) => item.id)
        const totalFilePaths = []
        if (storyboardIds.length) {
            const storyBoardPaths = await u.db("o_storyboard").whereIn("id", storyboardIds).select("id", "filePath");
            totalFilePaths.push(...storyBoardPaths.map(i => ({ id: i.id, filePath: i.filePath, sources: "storyboard" })))
        }
        const assetsIds = items.filter((item: any) => item.sources == "assets").map((item: any) => item.id)
        if (assetsIds.length) {
            const assetsPaths = await u.db("o_assets").leftJoin("o_image", "o_image.id", "o_assets.imageId").whereIn("o_assets.id", assetsIds).select("o_assets.id", "o_image.filePath");
            totalFilePaths.push(...assetsPaths.map(i => ({ id: i.id, filePath: i.filePath, sources: "assets" })))
        }

        await Promise.all(
            totalFilePaths.map(async (item: { id: string, filePath: string, sources: string }) => {
                result[`${item.id}:${item.sources}`] = item.filePath ? await u.oss.getSmallImageUrl(item.filePath) : "";
            }))

        res.status(200).send(success({ data: result }));
    },
);
