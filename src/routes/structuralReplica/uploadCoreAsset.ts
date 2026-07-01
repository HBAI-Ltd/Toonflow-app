import express from "express";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import u from "@/utils";

const router = express.Router();

function extFromDataUrl(base64: string, fallback: string): string {
  const mime = base64.match(/^data:([^;]+);base64,/)?.[1] || "";
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "audio/flac": "flac",
  };
  return map[mime] || fallback;
}

function stripBase64Header(base64: string): Buffer {
  return Buffer.from(base64.replace(/^data:[^;]+;base64,/, ""), "base64");
}

export default router.post(
  "/",
  validateFields({
    projectId: z.number().int().positive(),
    name: z.string().min(1),
    slotName: z.string().min(1).optional(),
    type: z.enum(["role", "scene", "audio"]),
    base64: z.string().min(1),
  }),
  async (req, res) => {
    const { projectId, name, slotName, type, base64 } = req.body;
    const ext = extFromDataUrl(base64, type === "audio" ? "mp3" : "png");
    const savePath = `/${projectId}/structuralReplica/coreAssets/${uuid()}.${ext}`;
    const assetType = type === "audio" ? "audio" : type;

    await u.oss.writeFile(savePath, stripBase64Header(base64));
    const [assetId] = await u.db("o_assets").insert({
      name,
      describe: type === "scene" ? "结构复刻主场景全景图" : type === "role" ? "结构复刻角色卡" : "结构复刻角色音频",
      type: assetType,
      projectId,
      prompt: slotName ? `structural replica core asset: ${slotName}` : "structural replica core asset",
      startTime: Date.now(),
    });
    const [imageId] = await u.db("o_image").insert({
      filePath: savePath,
      type: assetType,
      assetsId: assetId,
      state: "已完成",
    });
    await u.db("o_assets").where("id", assetId).update({ imageId });

    res.status(200).send(success({ assetId, imageId, filePath: savePath, type: assetType, name }));
  },
);
