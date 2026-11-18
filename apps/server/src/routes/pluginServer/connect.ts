import { Router } from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";

export default Router().post("/", (req, res) => {
  res.set("Cache-Control", "no-store").json(success(u.pluginServer.createConnection(req)));
});
