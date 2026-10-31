import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

export default Router().post("/", validateFields({
  sources: z.object({
    language: z.string().min(1).max(2 * 1024 * 1024),
    media: z.string().min(1).max(2 * 1024 * 1024),
  }).strict(),
  token: z.string().trim().min(1).max(16384),
}), (req, res) => channelRequest(req, res,
  (channel, options) => u.mediaProvider.installAccountProvider(req.body.sources, req.body.token, options.signal), true));
