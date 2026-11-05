import { Router } from "express";
import { success } from "@/lib/responseFormat";
import { isMultiUser } from "@/utils/accounts/context";
import { isInitialized } from "@/utils/accounts/service";

export default Router().get("/", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(success({ enabled: isMultiUser(), initialized: isMultiUser() && isInitialized() }));
});
