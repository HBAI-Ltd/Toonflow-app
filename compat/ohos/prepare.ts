import { existsSync, mkdir, writeAtomic } from "@toonflow/file";
import { file } from "@toonflow/file/bun";
import { resolve } from "node:path";

const runtimeRoot = resolve(import.meta.dir, "../../build/ohos/runtime");
const runtimePath = resolve(runtimeRoot, "bun");
const runtimeHash = "f1382157493f24e7876171a8dc5a7453564d8bf379adcd67c646988ff9105cf7";
await mkdir(runtimeRoot, { recursive: true });
if (!existsSync(runtimePath)) {
  const url = "https://github.com/springmin/bun/releases/download/v1.4.0/bun";
  console.log("下载 springmin/bun 1.4.0 OHOS ARM64 运行时");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`下载 OHOS Bun 失败：HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (new Bun.CryptoHasher("sha256").update(bytes).digest("hex") !== runtimeHash) throw new Error("OHOS Bun 下载校验失败");
  await writeAtomic(runtimePath, bytes);
}
if (new Bun.CryptoHasher("sha256").update(await file(runtimePath).arrayBuffer()).digest("hex") !== runtimeHash) {
  throw new Error(`OHOS Bun 缓存校验失败，请移除后重新执行 setup：${runtimePath}`);
}
console.log(`已准备 OHOS ARM64 Bun：${runtimePath}`);
