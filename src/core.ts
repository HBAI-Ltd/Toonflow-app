import fg from "fast-glob";
import path from "path";
import { readFile, writeFile } from "fs/promises";
import crypto from "crypto";

function fileNameToRoutePath(fileName: string): string {
  let routePath = fileName.replace(/\.(ts)$/, "");
  routePath = routePath.split(path.sep).join("/");
  routePath = routePath.replace(/\[([^\]]+)\]/g, (_, p1: string) => (p1.startsWith("...") ? "*" : `:${p1}`));
  if (routePath === "index") return "/";
  routePath = routePath.replace(/\/index$/, "");
  routePath = "/" + routePath.replace(/\/+/g, "/").replace(/\/$/, "");
  return routePath;
}

type RouteModulePair = { routePath: string; varName: string; entry: string };

export default async function generateRouter(): Promise<void> {
  // glob 得到 entries
  let entries: string[] = await fg(["src/routes/**/*.ts"]);
  // 排序
  entries = entries.sort((a, b) => a.localeCompare(b));

  const importLines: string[] = [];
  const routeModulePairs: RouteModulePair[] = [];

  entries.forEach((entry: string, i: number) => {
    const varName = `route${i + 1}`;
    let importPath = path.relative("src", entry).replace(/\\/g, "/");
    if (!importPath.startsWith(".")) importPath = "./" + importPath;
    importPath = importPath.replace(/\.ts$/, "");
    importLines.push(`import ${varName} from "${importPath}";`);
    const routeKey = path.relative("src/routes", entry).replace(/\\/g, "/");
    const routePath = fileNameToRoutePath(routeKey);
    routeModulePairs.push({ routePath, varName, entry });
  });
  const routeRootSegments = Array.from(
    new Set(
      routeModulePairs
        .map(({ routePath }) => routePath.split("/").filter(Boolean)[0])
        .filter((segment): segment is string => Boolean(segment)),
    ),
  ).sort((a, b) => a.localeCompare(b));
  // formatVersion 用于在生成模板结构变化时强制刷新 router.ts
  const formatVersion = 2;
  const routerData = JSON.stringify({
    formatVersion,
    routeModules: routeModulePairs.map(({ routePath, varName }) => ({ routePath, varName })),
    routeRootSegments,
  });
  const hash = crypto.createHash("md5").update(routerData).digest("hex");

  let content = `// @routes-hash ${hash}\nimport { Express } from "express";\n\n`;
  content += `${importLines.join("\n")}\n\n`;
  content += `export const routeRootSegments = ${JSON.stringify(routeRootSegments)} as const;\n\n`;
  content += `export default async (app: Express) => {\n`;
  for (const { routePath, varName } of routeModulePairs) {
    content += `  app.use("${routePath}", ${varName});\n`;
  }
  content += `}\n`;

  let needWrite = true;
  try {
    const current = await readFile("src/router.ts", "utf8");
    const match = current.match(/^\/\/\s*@routes-hash\s*([a-z0-9]+)\n/);
    const currentHash = match ? match[1] : null;
    if (currentHash === hash) {
      needWrite = false;
    }
  } catch {
    needWrite = true;
  }
  if (needWrite) await writeFile("src/router.ts", content, "utf8");
}
