import u from "@/utils";
import { readdir } from "node:fs/promises";
import { Router } from "express";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.get("/", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const canConfigure = u.workspace.isLocalWorkspaceRequest(req);
  const files = await readdir(u.nodePlugins.nodesDirectory, { withFileTypes: true }).catch((err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT") return [];
    throw err;
  });
  const nodes = await Promise.all(files
    .filter((file) => file.isFile() && /^[a-z][a-zA-Z0-9]*\.umd\.js$/.test(file.name))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(async (file) => {
      const name = file.name.slice(0, -7);
      const metadata = await u.nodePlugins.readNode(name).catch((err: NodeJS.ErrnoException) => {
        if (err.code === "ENOENT") return null;
        return { name, displayName: name, version: "", author: "", readme: "", github: "", configRules: [], loadError: err instanceof Error ? err.message : "节点文件无法读取" };
      });
      if (metadata === null) return null;
      return {
        loadError: "",
        ...metadata,
        url: `/api/nodes/files?name=${name}`,
        enabled: !files.some((entry) => entry.name === `${name}.disabled`),
        config: canConfigure ? u.nodePlugins.getNodeConfig(metadata) : {},
        canConfigure,
      };
    }));
  res.json(success(nodes.filter((node) => node !== null)));
});
