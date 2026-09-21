import fg from "fast-glob";
import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";

function fileNameToRoutePath(fileName: string): string {
  let routePath = fileName.replace(/\.(ts)$/, "");
  routePath = routePath.split(path.sep).join("/");
  routePath = routePath.replace(/\[([^\]]+)\]/g, (_, p1: string) => (p1.startsWith("...") ? "*" : `:${p1}`));
  if (routePath === "index") return "/";
  routePath = routePath.replace(/\/index$/, "");
  routePath = "/" + routePath.replace(/\/+/g, "/").replace(/\/$/, "");
  return routePath;
}

export default async function generateRouter(): Promise<void> {
  const sourceRoot = import.meta.dirname;
  const routerPath = path.join(sourceRoot, "router.ts");
  const entries = (await fg(["routes/**/*.ts"], { cwd: sourceRoot })).sort((a, b) => a.localeCompare(b));

  const importLines: string[] = [];
  const routeLines: string[] = [];

  entries.forEach((entry: string, i: number) => {
    const varName = `route${i + 1}`;
    let importPath = entry.replace(/\\/g, "/");
    if (!importPath.startsWith(".")) importPath = "./" + importPath;
    importPath = importPath.replace(/\.ts$/, "");
    importLines.push(`import ${varName} from "${importPath}";`);
    const routeKey = path.relative("routes", entry).replace(/\\/g, "/");
    const routePath = fileNameToRoutePath(routeKey);
    routeLines.push(`  app.use("/api${routePath}", ${varName});`);
  });

  let content = `import type { Express } from "express";\n\n`;
  content += `${importLines.join("\n")}\n\n`;
  content += `export default (app: Express) => {\n${routeLines.join("\n")}\n`;
  content += `}\n`;

  const current = await readFile(routerPath, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
  // ACT: 比较完整产物，路由模板变化时也重新生成。
  if (current !== content) await writeFile(routerPath, content, "utf8");
}

if (import.meta.main) await generateRouter();
