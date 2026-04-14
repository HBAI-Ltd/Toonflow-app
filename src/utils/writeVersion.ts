import path from "path";
import fs from "fs";
import getPath from "@/utils/getPath";

declare const __APP_VERSION__: string | undefined;

const APP_VERSION: string = (() => {
  if (typeof __APP_VERSION__ !== "undefined") {
    return __APP_VERSION__;
  }
  // 开发环境回退：从 package.json 读取
  const cwdPkgPath = path.resolve(process.cwd(), "package.json");
  const repoPkgPath = path.resolve(__dirname, "..", "..", "package.json");
  const pkgPath = fs.existsSync(cwdPkgPath) ? cwdPkgPath : repoPkgPath;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  return pkg.version;
})();

export default async (version?: string) => {
  const versionFile = path.join(getPath(), "version.txt");
  if (!fs.existsSync(versionFile)) {
    fs.mkdirSync(path.dirname(versionFile), { recursive: true });
  }
  await fs.promises.writeFile(versionFile, version ?? APP_VERSION, "utf8");
};

export const getVersion = async () => {
  const versionFile = path.join(getPath(), "version.txt");
  if (fs.existsSync(versionFile)) {
    return fs.readFileSync(versionFile, "utf8");
  }
  if (!fs.existsSync(versionFile)) {
    fs.mkdirSync(path.dirname(versionFile), { recursive: true });
  }
  await fs.promises.writeFile(versionFile, APP_VERSION, "utf8");
  return APP_VERSION;
};
