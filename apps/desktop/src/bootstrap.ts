import { writeFileSync } from "@toonflow/file";
import { resolve } from "node:path";
import { formatWithOptions } from "node:util";

if (process.platform === "win32") {
  const logPath = resolve("app.log");
  const printError = console.error.bind(console);
  for (const method of ["log", "info", "warn", "error", "debug"] as const) {
    const print = console[method].bind(console);
    console[method] = (...args: unknown[]) => {
      try {
        writeFileSync(logPath, `[${new Date().toISOString()}] [${method}] ${formatWithOptions({ colors: false }, ...args)}\n`, { flag: "a", mode: 0o600 });
      } catch (error) {
        printError("桌面日志写入失败：", error);
      }
      print(...args);
    };
  }
  console.info("桌面进程启动：", process.platform, process.arch, process.versions.bun);
}

// ACT: 日志先于桌面依赖初始化，依赖加载异常也能留下完整错误。
try { await import("./index"); }
catch (error) {
  console.error("桌面入口加载失败：", error);
  process.exit(1);
}
