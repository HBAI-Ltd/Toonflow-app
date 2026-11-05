import { Router } from "express";
import { success } from "@/lib/responseFormat";
import { requireUser } from "@/utils/accounts/context";

export default Router().get("/", (_req, res) => res.json(success(requireUser())));
