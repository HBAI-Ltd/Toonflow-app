import { lstat, mkdtemp, readFile, rm } from "@toonflow/file";
import { execFile } from "node:child_process";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function readMacPackageIdentity(path: string) {
  const directory = await mkdtemp(join(dirname(path), "packageIdentity"));
  try {
    // ACT: 部分 macOS 的 tar 会错误重复签名 XAR 的路径；xar 成员参数是正则，只提取这一份发行标识。
    await execFileAsync("/usr/bin/xar", ["-xf", path, "-C", directory, "^Resources/updateIdentity[.]json$"], {
      env: { ...process.env, LC_ALL: "C", LANG: "C" }, timeout: 120_000, maxBuffer: 64 * 1024,
    });
    const resources = join(directory, "Resources");
    if (!(await lstat(resources)).isDirectory()) throw new Error("macOS 安装包发行标识目录无效。");
    const identityPath = join(resources, "updateIdentity.json");
    const entry = await lstat(identityPath);
    if (!entry.isFile() || entry.size > 64 * 1024) throw new Error("macOS 安装包发行标识无效。");
    return await readFile(identityPath, "utf8");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
