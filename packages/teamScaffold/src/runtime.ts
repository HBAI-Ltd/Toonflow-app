import { z } from "zod";

export const teamLimits = { maxFileBytes: 20 * 1024 * 1024, maxTotalBytes: 20 * 1024 * 1024, maxEntries: 2000 };

const reservedName = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
export const teamNameSchema = z.string().min(1).max(96).regex(/^[a-z][a-zA-Z0-9]*$/)
  .refine(name => !reservedName.test(name) && !["constructor", "prototype", "__proto__"].includes(name), "名称不能使用保留字");

export const teamResourcePathSchema = z.string().min(1).max(512).refine(path => {
  return !/[\\:<>"|?*\u0000-\u001f\u007f]/.test(path) && path.split("/").every(part =>
    !!part && part !== "." && part !== ".." && !/[. ]$/.test(part) && !reservedName.test(part));
}, "资源必须使用安全的相对路径，以 / 分隔，不能包含父目录、盘符或保留文件名");

const namesSchema = z.array(teamNameSchema).max(64).refine(names => new Set(names).size === names.length, "名称不能重复");
const memberSchema = z.strictObject({
  description: z.string().trim().min(1).max(2000),
  instructions: teamResourcePathSchema.refine(path => path.startsWith("members/") && path.endsWith(".md"), "成员提示词必须位于 members/ 中，且为 Markdown 文件"),
  delegates: namesSchema.optional(),
  tools: z.array(z.string().min(1).max(128)).max(128).refine(names => new Set(names).size === names.length, "工具名称不能重复").optional(),
  skills: namesSchema.optional(),
  knowledge: z.array(teamResourcePathSchema).max(128).optional(),
});

export const teamSchema = z.strictObject({
  name: teamNameSchema,
  displayName: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(4000),
  version: z.string().trim().min(1).max(100),
  author: z.string().trim().max(100),
  github: z.string().max(2048).refine(value => !value || (URL.canParse(value) && new URL(value).origin === "https://github.com" && !new URL(value).username && !new URL(value).password), "GitHub 地址无效"),
  entry: teamNameSchema,
  members: z.record(teamNameSchema, memberSchema).refine(members => Object.keys(members).length > 0 && Object.keys(members).length <= 64, "团队需要 1 至 64 位成员"),
  tools: z.record(teamNameSchema, z.record(z.string(), z.json())).optional(),
}).superRefine((team, context) => {
  if (!Object.hasOwn(team.members, team.entry)) context.addIssue({ code: "custom", path: ["entry"], message: "入口成员不存在" });
  const memberNames = Object.keys(team.members);
  if (new Set(memberNames.map(name => name.toLowerCase())).size !== memberNames.length) {
    context.addIssue({ code: "custom", path: ["members"], message: "成员名称不能仅大小写不同" });
  }
  const visited = new Set<string>();
  const visiting = new Set<string>();
  function visit(name: string) {
    if (visited.has(name)) return;
    if (visiting.has(name)) {
      context.addIssue({ code: "custom", path: ["members", name, "delegates"], message: "成员委派关系不能成环" });
      return;
    }
    visiting.add(name);
    for (const target of team.members[name]?.delegates ?? []) {
      if (!Object.hasOwn(team.members, target)) context.addIssue({ code: "custom", path: ["members", name, "delegates"], message: `成员 ${target} 不存在` });
      else visit(target);
    }
    visiting.delete(name);
    visited.add(name);
  }
  memberNames.forEach(visit);
});

export type TeamManifest = z.infer<typeof teamSchema>;

export function validateTeamResources(team: TeamManifest, entries: Iterable<string>) {
  const paths = new Set(entries);
  const requirePath = (path: string, allowDirectory = false) => {
    if (paths.has(path) || (allowDirectory && [...paths].some(entry => entry.startsWith(`${path}/`)))) return;
    throw new Error(`团队引用的资源不存在：${path}`);
  };
  for (const member of Object.values(team.members)) {
    requirePath(member.instructions);
    for (const skill of member.skills ?? []) requirePath(`skills/${skill}/SKILL.md`);
    for (const knowledge of member.knowledge ?? []) requirePath(`knowledge/${knowledge}`, true);
  }
  for (const plugin of Object.keys(team.tools ?? {})) requirePath(`tools/${plugin}.tool.js`);
}
