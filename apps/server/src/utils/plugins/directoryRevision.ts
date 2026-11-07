import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { readFile, readdir } from "@toonflow/file";

// 版本只用于判断内置插件是否需要重新同步，由文件名与内容的 SHA-256 组成。
// 正则模式取目录内匹配的文件并按文件名排序；清单模式按清单顺序计入，缺失文件按空内容计入。
export default async function directoryRevision(directory: string, matcher: RegExp | readonly string[]) {
  const hash = createHash("sha256");
  const update = (name: string, content: Buffer) => hash.update(name).update("\0").update(content).update("\0");
  if (matcher instanceof RegExp) {
    const entries = await readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    for (const name of entries.filter(entry => entry.isFile() && matcher.test(entry.name)).map(entry => entry.name).sort()) {
      update(name, await readFile(resolve(directory, name)));
    }
  } else {
    for (const name of matcher) {
      const content = await readFile(resolve(directory, name)).catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return Buffer.alloc(0);
        throw error;
      });
      update(name, content);
    }
  }
  return hash.digest("hex");
}
