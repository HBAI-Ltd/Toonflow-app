import { z } from "zod";
import { tool, jsonSchema } from "ai";
import path from "path";
import isPathInside from "is-path-inside";
import getPath from "@/utils/getPath";
import * as fs from "fs";
import fg from "fast-glob";
import { t, getLocale, FALLBACK_LOCALE, type Locale } from "@/i18n";

type SkillAttribution =
  //剧本Agent
  | "script_agent_decision" //决策
  | "script_execution_skeleton" //故事骨架
  | "script_execution_adaptation" //改变策略
  | "script_execution_script" //剧本生成
  | "script_agent_supervision" //审核
  //生产Agent
  | "production_agent_decision"
  | "production_agent_execution"
  | "production_agent_supervision";

interface SkillInput {
  mainSkill: SkillAttribution[];
  workspace?: string[];
  attachedSkills?: string[];
}

interface SkillPaths {
  mainSkill: { path: string; name: string; description: string }[];
  secondarySkills: string[];
  tertiarySkills: string[];
}

function toUnixPath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function ensureNonEmptyBody(body: string, fallback: string): string {
  const trimmed = body.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

// ==================== 解析 SKILL.md ====================

export function parseFrontmatter(content: string, locale: Locale = FALLBACK_LOCALE): { name: string; description: string } {
  const match = content.match(/^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!match?.[1]) {
    throw new Error(t("utils.skillsTools.parseFrontmatter.missingFrontmatter", { content }, locale));
  }

  const result: Record<string, string> = {};
  const lines = match[1].split(/\r?\n/);

  for (let i = 0; i < lines.length; ) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      i++;
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!keyMatch) {
      i++;
      continue;
    }

    const key = keyMatch[1].trim();
    const rawValue = (keyMatch[2] ?? "").trim();
    i++;

    if (!key) continue;

    if (/^[>|][+-]?[0-9]*$/.test(rawValue)) {
      const isFolded = rawValue.startsWith(">");
      const blockLines: string[] = [];
      let blockIndent: number | null = null;

      while (i < lines.length) {
        const current = lines[i];
        const currentTrimmed = current.trim();

        if (currentTrimmed === "") {
          if (blockIndent !== null) blockLines.push("");
          i++;
          continue;
        }

        const currentIndent = current.match(/^\s*/)?.[0].length ?? 0;
        if (blockIndent === null) {
          blockIndent = currentIndent;
        }

        if (currentIndent < blockIndent) break;

        blockLines.push(current.slice(blockIndent));
        i++;
      }

      result[key] = isFolded
        ? blockLines
            .join("\n")
            .replace(/\n{2,}/g, "\n\n")
            .replace(/([^\n])\n([^\n])/g, "$1 $2")
            .trim()
        : blockLines.join("\n").trim();
      continue;
    }

    const unquoted = rawValue.replace(/^([\x27\x22])([\s\S]*)\1$/, "$2"); // \x27 = ', \x22 = " — escaped so the i18n scanner's naive quote tokenizer doesn't desync
    result[key] = unquoted;
  }

  if (!result.name || !result.description) {
    throw new Error(t("utils.skillsTools.parseFrontmatter.missingRequiredFields", { content }, locale));
  }

  return { name: result.name, description: result.description };
}

export async function useSkill(input: SkillInput) {
  const locale = await getLocale();
  const { mainSkill, workspace = [], attachedSkills = [] } = input;
  const rootDir = getPath("skills");
  const normalizedRootDir = path.resolve(rootDir);

  const mainSkills: { path: string; name: string; description: string }[] = [];
  for (const skill of mainSkill) {
    const skillPath = path.join(rootDir, skill + ".md");
    if (!fs.existsSync(skillPath)) throw new Error(t("utils.skillsTools.useSkill.mainSkillNotFound", { path: skillPath }, locale));
    if (!isPathInside(skillPath, normalizedRootDir)) throw new Error(t("utils.skillsTools.useSkill.invalidSkillName", { path: skillPath }, locale));
    const content = await fs.promises.readFile(skillPath, "utf-8");
    const parsed = parseFrontmatter(content, locale);
    mainSkills.push({ path: skillPath, ...parsed });
  }

  const resolveSafeSkillDir = (dir: string): string | null => {
    const resolvedDir = path.resolve(normalizedRootDir, dir);
    const isSafeDir = resolvedDir === normalizedRootDir || isPathInside(resolvedDir, normalizedRootDir);
    return isSafeDir ? resolvedDir : null;
  };

  const getMdFiles = (dir: string, recursive = false): string[] => {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile() && entry.name.endsWith(".md")) return [fullPath];
      return entry.isDirectory() && recursive ? getMdFiles(fullPath, true) : [];
    });
  };
  const collectMdFiles = (dirs: string[], recursive: boolean) =>
    dirs.flatMap((dir) => {
      const safeDir = resolveSafeSkillDir(dir);
      if (!safeDir) return [];
      return getMdFiles(safeDir, recursive).map((file) => toUnixPath(path.relative(normalizedRootDir, file)));
    });

  const skillPaths: SkillPaths = {
    mainSkill: mainSkills,
    secondarySkills: collectMdFiles(workspace, false),
    tertiarySkills: collectMdFiles(attachedSkills, true),
  };

  return { prompt: buildSkillPrompt(mainSkills, locale), tools: createSkillTools(mainSkills, skillPaths, undefined, locale), skillPaths };
}

export function buildSkillPrompt(skills: { name: string; description: string }[], locale: Locale = FALLBACK_LOCALE): string {
  const skillEntries = skills
    .map((s) => `  <skill>\n    <name>${s.name}</name>\n    <description>${s.description}</description>\n  </skill>`)
    .join("\n");
  return t("utils.skillsTools.skillsHeader", { skillEntries }, locale);
}

export function createSkillTools(
  skills: { name: string; description: string }[],
  skillPaths: SkillPaths,
  rootDir: string = getPath("skills"),
  locale: Locale = FALLBACK_LOCALE,
) {
  const activated = new Set<string>(); // 已激活技能集合，防止重复加载
  const skillsRootDir = path.resolve(rootDir);
  const skillNames = skills.map((s) => s.name);
  const skillMap = new Map(skillPaths.mainSkill.map((s) => [s.name, s]));
  return {
    activate_skill: tool({
      description: t("utils.skillsTools.tools.activateSkill.describe", { skillNames: skillNames.join(", ") }, locale),
      inputSchema: jsonSchema<{ name: string }>(
        z
          .object({
            name: z.enum(skillNames as [string, ...string[]]).describe(t("utils.skillsTools.tools.activateSkill.nameDescribe", {}, locale)),
          })
          .toJSONSchema(),
      ),
      execute: async ({ name }) => {
        if (activated.has(name)) {
          console.log(t("utils.skillsTools.tools.activateSkill.alreadyActiveLog", { name }, locale));
          return { alreadyActive: true, message: t("utils.skillsTools.tools.activateSkill.alreadyActiveMessage", { name }, locale) };
        }
        const matched = skillMap.get(name);
        if (!matched) return { error: t("utils.skillsTools.tools.activateSkill.notFound", { name }, locale) };
        let raw = "";
        try {
          raw = await fs.promises.readFile(matched.path, "utf-8");
          console.log(t("utils.skillsTools.tools.activateSkill.readLog", { path: matched.path, length: raw.length }, locale));
        } catch (error) {
          console.log(t("utils.skillsTools.tools.activateSkill.readFailedLog", { path: matched.path }, locale));
        }
        activated.add(name);
        console.log(t("utils.skillsTools.tools.activateSkill.activatedLog", { name }, locale));
        const body = ensureNonEmptyBody(
          raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, ""),
          t("utils.skillsTools.tools.activateSkill.emptyBodyFallback", {}, locale),
        );
        let content = "";
        content = `<skill_content name="${name}">\n`;
        content += body + "\n\n";
        content += t("utils.skillsTools.tools.activateSkill.useReadSkillFileHint", {}, locale);
        if (skillPaths.secondarySkills.length > 0) {
          content += "\n<skill_resources>\n";
          for (const path of skillPaths.secondarySkills) {
            content += `  <file>${path}</file>\n`;
          }
          content += "</skill_resources>\n";
        }
        content += "</skill_content>";
        return { content };
      },
    }),
    read_skill_file: tool({
      description: t("utils.skillsTools.tools.readSkillFile.describe", {}, locale),
      inputSchema: jsonSchema<{ filePath: string }>(
        z
          .object({
            filePath: z.string().describe(t("utils.skillsTools.tools.readSkillFile.filePathDescribe", {}, locale)),
          })
          .toJSONSchema(),
      ),
      execute: async ({ filePath }) => {
        const normalizedInputPath = toUnixPath(filePath).trim();
        if (!normalizedInputPath) {
          console.log(t("utils.skillsTools.tools.readSkillFile.emptyPathLog", {}, locale));
          return { error: t("utils.skillsTools.tools.readSkillFile.emptyPathError", {}, locale) };
        }

        const fullPath = path.resolve(path.join(skillsRootDir, normalizedInputPath));
        if (!(fullPath === skillsRootDir || isPathInside(fullPath, skillsRootDir))) {
          console.log(t("utils.skillsTools.tools.readSkillFile.pathOutOfBoundsLog", { filePath }, locale));
          return { error: "Access denied: path is outside skill directory" };
        }
        let body = "";
        try {
          body = await fs.promises.readFile(fullPath, "utf-8");
          console.log(t("utils.skillsTools.tools.readSkillFile.readLog", { filePath, length: body.length }, locale));
        } catch {
          console.log(t("utils.skillsTools.tools.readSkillFile.readFailedLog", { filePath }, locale));
          return { error: `File not found: ${filePath}` };
        }
        const safeBody = ensureNonEmptyBody(body, t("utils.skillsTools.tools.readSkillFile.emptyBodyFallback", {}, locale));
        let content = "";
        content = `<skill_content>\n`;
        content += safeBody + "\n\n";
        content += t("utils.skillsTools.tools.readSkillFile.useReadSkillFileHint", {}, locale);
        if (skillPaths.tertiarySkills.length > 0) {
          content += "\n<skill_resources>\n";
          for (const path of skillPaths.tertiarySkills) {
            content += `  <file>${path}</file>\n`;
          }
          content += "</skill_resources>\n";
        }
        content += "</skill_content>";
        return { content };
      },
    }),
  };
}

export async function scanSkills(folderPath: string) {
  const unixPath = toUnixPath(folderPath);
  const entries = await fg(unixPath, {
    onlyFiles: true,
    absolute: true,
  });
  return entries;
}
