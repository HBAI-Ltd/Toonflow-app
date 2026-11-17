import { Router } from "express";
import { success } from "@/lib/responseFormat";
import { listUsers } from "@/utils/accounts/service";
import { getWallet } from "@/utils/hosting/billing";

export default Router().get("/", (_req, res) => res.json(success(listUsers().map(user => ({ ...user, wallet: getWallet(user.id) })))));
