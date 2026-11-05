import { Router } from "express";
import { success } from "@/lib/responseFormat";
import { clearSessionCookie, logout } from "@/utils/accounts/service";

export default Router().post("/", (req, res) => {
  logout(req);
  clearSessionCookie(res);
  res.json(success());
});
