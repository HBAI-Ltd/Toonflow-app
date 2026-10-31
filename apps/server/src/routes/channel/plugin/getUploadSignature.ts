import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const fields = {
  kind: z.enum(["video", "cover"]),
  fileName: z.string().trim().min(1).max(255),
};
const schema = z.strictObject(fields);

export default Router().post("/", validateFields(fields), (req, res) => channelRequest(req, res,
  (channel, options) => channel.getPluginUploadSignature(schema.parse(req.body), options), true));
