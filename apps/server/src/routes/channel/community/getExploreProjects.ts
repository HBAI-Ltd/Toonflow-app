import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const fields = {
  cursor: z.string().max(4096).optional(),
  limit: z.number().int().min(1).max(50),
  categoryId: z.string().trim().max(200).optional(),
  searchKeyword: z.string().trim().max(1000).optional(),
};
const schema = z.strictObject(fields);

export default Router().post("/", validateFields(fields), (req, res) => channelRequest(req, res,
  (source, options) => source.getExploreProjects(schema.parse(req.body), options)));
