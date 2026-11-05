import { Router } from "express";
import { success } from "@/lib/responseFormat";
import { listUsers } from "@/utils/accounts/service";

export default Router().get("/", (_req, res) => res.json(success(listUsers())));
