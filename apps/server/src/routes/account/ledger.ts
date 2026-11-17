import { Router } from "express";
import { success } from "@/lib/responseFormat";
import { walletLedger } from "@/utils/hosting/billing";

export default Router().get("/", (_req, res) => res.json(success(walletLedger())));
