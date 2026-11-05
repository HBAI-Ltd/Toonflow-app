import { Router } from "express";
import { success } from "@/lib/responseFormat";
import { storageUsage } from "@/utils/hosting/storage";
import { listTasks } from "@/utils/hosting/tasks";
import { requireUser } from "@/utils/accounts/context";
import { listUsers } from "@/utils/accounts/service";

export default Router().get("/", async (_req, res) => {
  if (requireUser().role !== "admin") throw Object.assign(new Error("需要管理员权限"), { status: 403 });
  res.json(success(await Promise.all(listUsers().map(async user => ({
    userId: user.id, username: user.username, storage: await storageUsage(user), tasks: listTasks(user.id),
  })))));
});
