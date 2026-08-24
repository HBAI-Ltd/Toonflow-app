import fg from "fast-glob";
import path from "path";
import { readFile, writeFile } from "fs/promises";
import fsSync from "fs";
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

/**
 * Chỉ file có `export default` mới là route. `src/routes/**` đôi khi chứa module tiện ích
 * dùng chung giữa vài route (ví dụ src/lib/shippedPrompts.ts từng nằm ở đó) — nếu để lọt,
 * bộ sinh router tạo ra `app.use(path, undefined)` và app chết lúc khởi động với
 * "argument handler must be a function".
 *
 * Không có test nào bắt được lỗi ấy: `yarn test` và `yarn lint` đều không khởi động server.
 * Nên bộ lọc này là chỗ duy nhất chặn nó.
 *
 * Nhận diện tĩnh, sau khi xoá bình luận và chuỗi để `export default` nằm trong chúng không
 * bị tính nhầm.
 */
export function isRouteModule(entry: string): boolean {
  const src = fsSync.readFileSync(entry, "utf-8");
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ")
    .replace(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g, '""');
  if (/\bexport\s+default\b/.test(stripped)) return true;
  // `export { x as default }` — dạng ít gặp nhưng hợp lệ.
  return /\bexport\s*\{[^}]*\bas\s+default\b[^}]*\}/.test(stripped);
}

export default async function generateRouter(): Promise<void> {
  // glob 得到 entries
  let entries: string[] = await fg(["src/routes/**/*.ts"], { ignore: ["**/*.test.ts", "**/*.spec.ts", "**/__tests__/**"] });
  const skipped = entries.filter((entry) => !isRouteModule(entry));
  if (skipped.length) {
    console.warn(`[router] bỏ qua ${skipped.length} file dưới src/routes không có export default:\n  ${skipped.join("\n  ")}`);
  }
  entries = entries.filter((entry) => isRouteModule(entry));
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
  const routerData = JSON.stringify(routeModulePairs.map(({ routePath, varName }) => ({ routePath, varName })));
  const hash = crypto.createHash("md5").update(routerData).digest("hex");

  let content = `// @routes-hash ${hash}\nimport { Express } from "express";\n\n`;
  content += `${importLines.join("\n")}\n\n`;
  content += `export default async (app: Express) => {\n`;
  for (const { routePath, varName } of routeModulePairs) {
    content += `  app.use("/api${routePath}", ${varName});\n`;
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
