import { loadSkillsFromDir } from "@earendil-works/pi-coding-agent";
import type { McpOptions } from "@toonflow/mcp";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import * as skillFile from "@/utils/skills/files";

export const skillResources: NonNullable<McpOptions["resources"]> = {
  async list(signal) {
    const { skills } = loadSkillsFromDir({ dir: skillFile.directory(), source: "user" });
    const resources = [];
    for (const skill of skills) {
      signal.throwIfAborted();
      const { mainPath, files } = await skillFile.list(skill.name);
      for (const path of files) {
        const main = path === mainPath;
        resources.push({
          uri: `toonflow://skills/${encodeURIComponent(skill.name)}/${path.split("/").map(encodeURIComponent).join("/")}`,
          name: `${skill.name}/${path}`,
          description: main ? skill.description : `${skill.name} 的附属资料：${path}`,
          mimeType: Bun.file(main ? skill.filePath : resolve(skill.baseDir, path)).type || "application/octet-stream",
        });
      }
    }
    return resources;
  },
  async read(uri, signal) {
    signal.throwIfAborted();
    const match = /^toonflow:\/\/skills\/([^/]+)\/(.+)$/.exec(uri);
    if (!match) throw Object.assign(new Error("技能资源地址无效"), { status: 400 });
    const name = decodeURIComponent(match[1]!);
    const path = match[2]!.split("/").map(decodeURIComponent).join("/");
    const { mainPath, files } = await skillFile.list(name);
    if (!files.includes(path)) throw Object.assign(new Error("技能资源不存在"), { status: 404 });
    const { target } = await skillFile.locate(name, path === mainPath ? undefined : path);
    const bytes = await readFile(target, { signal });
    if (bytes.byteLength > skillFile.maxBytes) throw Object.assign(new Error("技能文件不能超过 20 MB"), { status: 413 });
    const mimeType = Bun.file(target).type || "application/octet-stream";
    let text: string | undefined;
    if (!bytes.includes(0)) {
      try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
      catch { /* 二进制附属资料使用 MCP 的 blob 内容返回。 */ }
    }
    return { contents: [text === undefined ? { uri, mimeType, blob: bytes.toString("base64") } : { uri, mimeType, text }] };
  },
};
