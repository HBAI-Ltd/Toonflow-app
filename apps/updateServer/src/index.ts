import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { createApp } from "@/app";

const publicDir = join(import.meta.dir, "..", "public");
mkdirSync(publicDir, { recursive: true });
const app = createApp(publicDir);
const host = "127.0.0.1";
const port = 8091;
app.listen(port, host, () => {
  console.log(`更新服务器：http://${host}:${port}/`);
  console.log(`静态更新目录：${publicDir}`);
});
