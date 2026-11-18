import { readdir } from "@toonflow/file";
import { Router } from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { translateMessage } from "@/lib/i18n";

export default Router().get("/", async (req, res) => {
  const canManage = u.workspace.isLocalWorkspaceRequest(req) === true;
  const files = await readdir(u.extPlugins.extDirectory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const names = [...new Set(files.filter(file => file.isFile()).map(file => u.extPlugins.extNameFromFile(file.name)).filter((name): name is string => !!name))];
  const extensions = await Promise.all(names.sort((left, right) => left.localeCompare(right)).map(async name => {
      const metadata = await u.extPlugins.readExt(name).catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return null;
        return { name, id: name, displayName: name, extensions: [], resourceKind: "file", version: "", readme: "", author: "", github: "", configRules: [], installedAt: u.conf.get("pluginInstalledAt", {})[`ext:${name}`] ?? 0,
          loadError: translateMessage(error instanceof Error ? error.message : "文件扩展无法读取") };
      });
      return metadata && { loadError: "", ...metadata, canManage, canConfigure: canManage, config: canManage ? u.extPlugins.getExtConfig(metadata) : {},
        marketIdentifiers: u.pluginInstall.getMarketIdentifiers("ext", name),
        builtin: req.app.locals.builtinPlugins.ext.has(name),
        enabled: !files.some(entry => entry.name === `${name}.disabled`), url: `/api/ext/read?name=${name}` };
    }));
  res.set("Cache-Control", "no-store").json(success(extensions.filter(Boolean)));
});
