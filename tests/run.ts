import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function exists(target: string): Promise<boolean> {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

async function collectTests(target: string): Promise<string[]> {
  const absolute = path.resolve(target);
  const stat = await fs.stat(absolute);
  if (stat.isFile()) return absolute.endsWith(".test.ts") ? [absolute] : [];

  const entries = await fs.readdir(absolute, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(absolute, entry.name);
      return entry.isDirectory() ? collectTests(fullPath) : fullPath.endsWith(".test.ts") ? [fullPath] : [];
    }),
  );
  return files.flat();
}

async function main() {
  const targets = process.argv.slice(2);
  const roots = targets.length ? targets : ["tests"];
  const files = (
    await Promise.all(
      roots.map(async (target) => {
        if (!(await exists(target))) throw new Error(`Test target not found: ${target}`);
        return collectTests(target);
      }),
    )
  )
    .flat()
    .sort();

  if (!files.length) throw new Error(`No *.test.ts files found in ${roots.join(", ")}`);

  for (const file of files) {
    const loaded = await import(pathToFileURL(file).href);
    const runner = (loaded.default ?? loaded.run) as unknown;
    if (typeof runner === "function") {
      await (runner as () => void | Promise<void>)();
    } else if (runner && typeof (runner as Promise<void>).then === "function") {
      await runner;
    }
    console.log(`ok ${path.relative(process.cwd(), file)}`);
  }
  console.log(`Executed ${files.length} test file(s).`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
