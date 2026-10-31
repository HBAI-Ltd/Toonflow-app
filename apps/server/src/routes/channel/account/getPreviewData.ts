import { Router } from "express";
import channelRequest from "@/lib/channelRequest";

export default Router().get("/", (req, res) => channelRequest(req, res,
  (source, options) => source.getPreviewData(options), true));
