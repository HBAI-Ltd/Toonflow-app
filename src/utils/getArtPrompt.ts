import fs from "fs";
import path from "path";
import getPath from "./getPath";
import { DEFAULT_LOCALE, localizedSkillPath, type Locale } from "@/i18n";

/**
 * `found` (a base .md file) resolved to the sidecar for `locale` when one exists on disk,
 * otherwise `found` itself unchanged. Mirrors src/i18n/skillPath.ts's resolveSkillReadPath, but
 * operates on a path already located by findFileRecursive rather than a known canonical path.
 */
function resolveLocaleVariant(found: string, locale: Locale): string {
  const candidate = localizedSkillPath(found, locale);
  return candidate !== found && fs.existsSync(candidate) ? candidate : found;
}

/**
 * 传入一个指定路径参数（风格名称），以及一个指定文件名，递归获取该文件并返回其内容
 *
 * Model-facing: this content is assembled into prompts sent to an AI model (visual manuals,
 * character/scene/prop derivative prompts), so `locale` here must be prompt_language
 * (getPromptLanguage()), never content_language — see callers for how it's threaded through.
 *
 * @param styleName - 风格目录名，例如 "chinese_sweet_romance"
 * @param fileName  - 目标文件名（不含 .md 后缀），例如 "art_character"、"prefix"
 * @param locale    - Prompt language to resolve a translated variant for, if one exists on disk.
 *                    Defaults to DEFAULT_LOCALE ("en") for backward compatibility.
 * @returns 文件内容字符串，未找到时返回空字符串
 */
export function getArtPrompt(styleName: string, source: string, fileName: string, locale: Locale = DEFAULT_LOCALE): string {
  const baseDir = getPath(["skills", source, styleName]);

  if (!fs.existsSync(baseDir)) {
    return "";
  }

  // 获取 prefix.md 内容
  const prefixFile = findFileRecursive(baseDir, "prefix.md");
  const prefixContent = prefixFile ? fs.readFileSync(resolveLocaleVariant(prefixFile, locale), "utf-8") : "";

  const target = fileName.endsWith(".md") ? fileName : `${fileName}.md`;
  const found = findFileRecursive(baseDir, target);

  if (!found) {
    return prefixContent;
  }

  const fileContent = fs.readFileSync(resolveLocaleVariant(found, locale), "utf-8");
  return prefixContent ? `${prefixContent}\n${fileContent}` : fileContent;
}
/**
 * 传入风格目录名，获取该风格下所有 .md 文件内容，按文件名映射返回
 * @param styleName - 风格目录名，例如 "chinese_sweet_romance"
 * @returns Record<文件名(不含后缀), 文件内容>
 */
export function getAllArtPrompts(styleName: string, source: string): Record<string, string> {
  const baseDir = getPath(["skills", source, styleName]);

  if (!fs.existsSync(baseDir)) {
    return {};
  }

  const result: Record<string, string> = {};
  collectMdFiles(baseDir, result);
  return result;
}

/**
 * 递归查找指定文件名的文件，返回第一个匹配的完整路径
 */
function findFileRecursive(dir: string, targetName: string): string | null {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isFile() && entry.name === targetName) {
      return fullPath;
    }

    if (entry.isDirectory()) {
      const found = findFileRecursive(fullPath, targetName);
      if (found) return found;
    }
  }

  return null;
}

/**
 * 递归收集目录下所有 .md 文件内容
 */
function collectMdFiles(dir: string, result: Record<string, string>): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isFile() && entry.name.endsWith(".md")) {
      const key = entry.name.replace(/\.md$/, "");
      result[key] = fs.readFileSync(fullPath, "utf-8");
    }

    if (entry.isDirectory()) {
      collectMdFiles(fullPath, result);
    }
  }
}
