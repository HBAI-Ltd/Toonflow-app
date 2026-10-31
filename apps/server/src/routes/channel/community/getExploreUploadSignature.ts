import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const fields = {
  kind: z.enum(["cover", "video", "download"]),
  fileName: z.string().trim().min(1).max(255),
};
const schema = z.strictObject(fields).refine(value => {
  const extensions = { cover: /\.(jpe?g|png|webp)$/i, video: /\.(mp4|webm)$/i, download: /\.zip$/i };
  return extensions[value.kind].test(value.fileName);
}, "封面仅支持 JPG、PNG、WebP，作品仅支持 MP4、WebM，项目仅支持 ZIP");

export default Router().post("/", validateFields(fields), (req, res) => channelRequest(req, res,
  (source, options) => source.getExploreUploadSignature(schema.parse(req.body), options), true));
