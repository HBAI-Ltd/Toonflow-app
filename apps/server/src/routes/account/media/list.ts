import { Router } from "express";
import { success } from "@/lib/responseFormat";
import { listMediaPreviews } from "@/utils/hosting/mediaPreview";

export default Router().get("/", (_req, res) => res.json(success(listMediaPreviews())));
