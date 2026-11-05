import { Router } from "express";
import { success } from "@/lib/responseFormat";
import { clearSessionCookie, refresh, writeSession } from "@/utils/accounts/service";

export default Router().post("/", (req, res, next) => {
  try { res.json(success(writeSession(res, refresh(req)))); }
  catch (cause) { clearSessionCookie(res); next(cause); }
});
