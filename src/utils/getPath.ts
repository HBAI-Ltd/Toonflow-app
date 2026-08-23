import path from "path";
import isPathInside from "is-path-inside";

export default (fileName?: string[] | string) => {
  let basePath: string;
  if (typeof process.versions?.electron !== "undefined") {
    const { app } = require("electron");
    const userDataDir: string = app.getPath("userData");
    basePath = path.join(userDataDir, "data");
  } else {
    basePath = path.join(process.cwd(), "data");
  }
  if (fileName) {
    let dbPath: string;
    if (Array.isArray(fileName)) {
      dbPath = path.resolve(basePath, ...fileName);
    } else {
      dbPath = path.resolve(basePath, fileName);
    }
    if (!isPathInside(dbPath, basePath) && dbPath !== basePath) {
      // i18n-ignore — TODO(i18n): getPath is sync and called at 69+ call sites across the codebase, including at module top-level (e.g. src/utils/db.ts) before any async context exists; needs a wide refactor to reach a locale
      throw new Error("路径逃逸错误，路径必须在数据目录内");
    }
    return dbPath;
  }
  return basePath;
};

export function isEletron() {
  if (typeof process.versions?.electron !== "undefined") {
    const { app } = require("electron");
    return true;
  } else {
    return false;
  }
}
