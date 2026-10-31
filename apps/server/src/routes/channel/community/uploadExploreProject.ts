import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const fields = {
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
  coverKey: z.string().min(1).max(512),
  videoKey: z.string().min(1).max(512),
  downloadKey: z.string().min(1).max(512).optional(),
};
const schema = z.strictObject(fields);

export default Router().post("/", validateFields(fields), (req, res) => channelRequest(req, res,
  (source, options) => source.uploadExploreProject(schema.parse(req.body), options), true));
