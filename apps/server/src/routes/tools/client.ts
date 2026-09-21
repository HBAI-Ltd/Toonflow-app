import { lstat } from "node:fs/promises";
import { resolve } from "node:path";
import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error } from "@/lib/responseFormat";

export default Router().get("/", validateFields({
  name: u.plugins.toolNameSchema,
  version: z.string().regex(/^[a-f0-9]{64}$/),
}, "query"), async (req, res) => {
  const { name, version } = req.query as { name: string; version: string };
  const disabled = await lstat(resolve(u.plugins.toolsDirectory, `${name}.disabled`)).catch((err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT") return null;
    throw err;
  });
  if (disabled) return res.status(404).json(error("工具已禁用", null, 404));
  const tool = await u.plugins.readTool(name).catch((err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT") return null;
    throw err;
  });
  if (!tool) return res.status(404).json(error("工具不存在", null, 404));
  const { revision, metadata, client } = tool;
  if (!metadata.components?.length || !client || revision !== version) {
    return res.status(404).json(error("工具界面不存在或版本已更新", null, 404));
  }
  const styleId = JSON.stringify(`toonflowToolStyle:${name}`);
  const style = `\n;(() => { const id = ${styleId}; let style = document.getElementById(id); if (!style) { style = document.createElement("style"); style.id = id; document.head.append(style); } style.textContent = ${JSON.stringify(client.css)}; })();\n`;
  res.set("Cache-Control", "no-cache").type("application/javascript").send(client.code + style);
});
