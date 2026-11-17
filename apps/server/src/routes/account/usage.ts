import { Router } from "express";
import { success } from "@/lib/responseFormat";
import { storageUsage } from "@/utils/hosting/storage";
import { listTasks } from "@/utils/hosting/tasks";
import { requireUser } from "@/utils/accounts/context";
import { getWallet } from "@/utils/hosting/billing";

export default Router().get("/", async (_req, res) => {
  const user = requireUser();
  res.json(success({ storage: await storageUsage(user), tasks: listTasks(user.id), wallet: getWallet(user.id) }));
});
