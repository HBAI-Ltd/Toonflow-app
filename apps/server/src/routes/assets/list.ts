import { readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { Router } from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";

type AssetEntry = { name: string; path: string; type: "file" | "directory"; children?: AssetEntry[] };

const router = Router();

async function listEntries(root: string, directory: string): Promise<AssetEntry[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return Promise.all(entries.filter(entry => entry.isFile() || entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN", { numeric: true }))
    .map(async entry => {
      const path = join(directory, entry.name);
      return {
        name: entry.name,
        path: relative(root, path).split(sep).join("/"),
        type: entry.isDirectory() ? "directory" : "file",
        ...(entry.isDirectory() ? { children: await listEntries(root, path) } : {}),
      };
    }));
}

export default router.get("/", async (_req, res) => {
  const directory = await u.assets.getAssetsDirectory();
  res.set("Cache-Control", "no-store").json(success({ entries: await listEntries(directory, directory) }));
});
