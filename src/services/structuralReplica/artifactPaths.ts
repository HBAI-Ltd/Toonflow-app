import path from "node:path";
import u from "@/utils";

export function toOssRelPath(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  const ossRoot = u.getPath("oss");
  const absolute = path.resolve(filePath);
  const relative = path.relative(ossRoot, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return filePath.split(path.sep).join("/");
  return `/${relative.split(path.sep).join("/")}`;
}

export function fromOssRelPath(filePath: string): string {
  return u.getPath(path.join("oss", filePath.replace(/^[/\\]+/, "")));
}
