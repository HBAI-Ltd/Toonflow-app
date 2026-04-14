import path from "path";
import isPathInside from "is-path-inside";

export default (fileName?: string[] | string) => {
  let basePath: string;
  if (typeof process.versions?.electron !== "undefined") {
    const { app } = require("electron");
    if (app.isPackaged) {
      const userDataDir: string = app.getPath("userData");
      basePath = path.join(userDataDir, "data");
    } else {
      basePath = path.join(process.cwd(), "data");
    }
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
      throw new Error("路径逃逸错误，路径必须在数据目录内");
    }
    return dbPath;
  }
  return basePath;
};

export function isEletron() {
  if (process.env.TOONFLOW_FORCE_ELECTRON === "1") {
    return true;
  }

  return typeof process.versions?.electron !== "undefined";
}
