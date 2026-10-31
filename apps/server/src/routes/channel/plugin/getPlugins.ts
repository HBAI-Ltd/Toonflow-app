import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const fields = {
  page: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  limit: z.number().int().min(1).max(50),
  type: z.enum(["node", "tool", "skill", "agent", "ext", "all", "my", "collection"]),
  searchKeyword: z.string().trim().max(1000).optional(),
};
const schema = z.strictObject(fields);

export default Router().post("/", validateFields(fields), (req, res) => channelRequest(req, res,
  (source, options) => source.getPlugins(schema.parse(req.body), options), true));
