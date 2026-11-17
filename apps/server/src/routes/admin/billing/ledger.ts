import { Router } from "express";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { requireAdmin } from "@/utils/accounts/service";
import { walletLedger } from "@/utils/hosting/billing";

export default Router().get("/", (req, res) => {
  requireAdmin();
  const userId = z.string().uuid().parse(req.query.userId);
  res.json(success(walletLedger(userId)));
});
