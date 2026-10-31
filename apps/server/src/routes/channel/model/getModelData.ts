import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const fields = { type: z.enum(["all", "text", "image", "video", "audio"]) };
const schema = z.strictObject(fields);

export default Router().get("/", validateFields(fields, "query"), (req, res) => channelRequest(req, res,
  (channel, options) => channel.getModelData(schema.parse(req.query), options), true));
