import { cp, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const packageRoot = resolve(import.meta.dir, "..");
const output = resolve(packageRoot, "../../build/mcp");
const result = await Bun.build({
  entrypoints: [resolve(packageRoot, "src/index.ts"), resolve(packageRoot, "src/stdio.ts")],
  outdir: output,
  target: "node",
  format: "esm",
  external: ["express"],
  minify: true,
});
if (!result.success) throw new AggregateError(result.logs, "MCP 构建失败");
await mkdir(output, { recursive: true });
await cp(resolve(packageRoot, "skills"), resolve(output, "skills"), { recursive: true });
await cp(resolve(packageRoot, "README.md"), resolve(output, "README.md"));
await cp(resolve(packageRoot, "src/skill.d.ts"), resolve(output, "skill.d.ts"));
await writeFile(resolve(output, "package.json"), JSON.stringify({
  name: "@toonflow/mcp",
  version: "0.0.0",
  type: "module",
  exports: { ".": "./index.js", "./skill": { types: "./skill.d.ts", default: "./skills/toonflow/SKILL.md" } },
  bin: { "toonflow-mcp": "./stdio.js" },
  peerDependencies: { express: "^5.2.1" },
}, null, 2));
console.log(`MCP 已构建到 ${output}`);
