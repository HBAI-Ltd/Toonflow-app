import { mkdir, mkdtemp, lstat, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { crc32, inflateRawSync } from "node:zlib";
import { parseFrontmatter } from "@earendil-works/pi-coding-agent";
import type { PluginInstallType } from "@/types/desktop";
import conf from "@/utils/conf";
import { parseTool, toolsDirectory } from "@/utils/plugins/tools";
import { addMediaProvider } from "@/utils/media/provider";
import { isSafeSegment } from "@/utils/skills/files";
import { isWithin, lockWorkspaceFiles, writeWorkspaceFile } from "@/utils/workspace/files";

const maxBytes = 20 * 1024 * 1024;
const require = createRequire(import.meta.url);

function invalid(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}

export function requireNewerVersion(current: unknown, incoming: unknown, label: string) {
  // ACT: Bun 的比较器接受宽松版本；先限定完整 SemVer，缺失版本不猜测更新顺序。
  const versions = [current, incoming].map(value => {
    if (typeof value !== "string" || value.length > 256) return;
    const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.exec(value.trim());
    if (!match || !match.slice(1, 4).every(part => Number.isSafeInteger(Number(part)))
      || match[4]?.split(".").some(part => /^\d+$/.test(part) && (!/^(0|[1-9]\d*)$/.test(part) || !Number.isSafeInteger(Number(part))))) return;
    return match[0];
  });
  const [installed, next] = versions;
  if (!installed || !next) invalid(`${label}已安装，但现有或待安装版本缺失或无效，无法判断更新顺序；请在开发者设置中使用强制安装`, 409);
  if (Bun.semver.order(next, installed) <= 0) invalid(`${label}已安装版本 ${installed}，待安装版本 ${next} 不高于现有版本；如需覆盖或降级，请在开发者设置中使用强制安装`, 409);
}

function nodeVersion(source: string) {
  try { return JSON.parse(source.match(/^\/\*! toonflowNode:([^\r\n]*) \*\/(?:\r?\n|$)/)?.[1] ?? "").version; }
  catch { return undefined; }
}

function remoteAddress(value: string) {
  let address: URL;
  try { address = new URL(value); }
  catch { return invalid("下载地址格式无效，请提供完整的 HTTP / HTTPS 文件地址"); }
  if (!["http:", "https:"].includes(address.protocol) || address.username || address.password) {
    invalid("仅支持不含账号密码的 HTTP / HTTPS 地址");
  }
  return address;
}

async function readBounded(stream: ReadableStream<Uint8Array>, limit: number, message: string) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) invalid(message, 413);
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally { await reader.cancel().catch(() => {}); }
}

async function download(url: string, limit: number, label: string) {
  let address = remoteAddress(url);
  const signal = AbortSignal.timeout(30_000);
  try {
    for (let redirects = 0; redirects <= 5; redirects++) {
      const response = await fetch(address, { signal, redirect: "manual" });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location) invalid(`${label}下载失败：服务器重定向响应缺少 Location 地址`, 502);
        if (redirects === 5) invalid(`${label}下载失败：重定向超过 5 次，请使用文件的直接下载地址`, 502);
        try { address = remoteAddress(new URL(location, address).href); }
        catch { invalid(`${label}下载失败：重定向目标不是有效的 HTTP / HTTPS 地址`, 502); }
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        const hint = response.status === 401 || response.status === 403
          ? "下载被拒绝，链接可能已过期、签名无效或没有访问权限，请重新生成下载链接"
          : response.status === 404 ? "文件不存在，请确认上传路径和文件名；改名后需要重新生成下载链接"
          : response.status === 410 ? "文件已失效，请获取新的下载链接"
          : response.status === 429 ? "下载请求过于频繁，请稍后重试"
          : response.status >= 500 ? "下载服务器暂时异常，请稍后重试"
          : "服务器未返回文件，请检查下载地址";
        invalid(`${label}下载失败（HTTP ${response.status}）：${hint}`, 502);
      }
      if (!response.body) invalid(`${label}下载失败：服务器没有返回文件内容`, 502);
      const bytes = await readBounded(response.body, limit, `${label}文件不能超过 ${limit / 1024 / 1024} MB`);
      if (!bytes.byteLength) invalid(`${label}下载失败：文件内容为空，请重新上传文件`, 502);
      return bytes;
    }
  } catch (error) {
    if (error instanceof Error && "status" in error) throw error;
    if (signal.aborted) invalid(`${label}下载超时（30 秒），请检查网络或重新获取下载链接`, 504);
    invalid(`${label}下载连接失败，请检查网络、下载域名和 HTTPS 证书后重试`, 502);
  }
  return invalid("下载地址无效");
}

export function decodeText(bytes: Uint8Array) {
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { return invalid("插件文本内容不是有效的 UTF-8 编码，请检查文件编码后重新上传"); }
}

export async function installNode(fileName: string, source: string, force = false) {
  if (!/^[a-z][a-zA-Z0-9]*\.umd\.js$/.test(fileName)) invalid("文件名需为小驼峰格式，例如 imageNode.umd.js");
  if (!source.trim()) invalid("节点文件内容为空，请重新上传节点脚本");
  if (Buffer.byteLength(source, "utf8") > maxBytes) invalid("节点文件不能超过 20 MB", 413);
  const name = fileName.slice(0, -7);
  if (/^\s*(?:<!doctype\s+html\b|<html\b)/i.test(source)) {
    invalid("节点文件实际是 HTML 网页，不是节点脚本，请重新上传构建生成的 .umd.js 文件");
  }
  // ACT: 仅静态检查脚手架约定和语法，确认安装后由画布加载执行。
  if (!source.includes("toonflowNodeHost")) invalid("文件不是兼容的 Toonflow 节点，请使用节点脚手架构建生成的 .umd.js 文件");
  if (!source.includes(`toonflowNodes.${name}`)) invalid(`文件名与节点导出名不一致：${fileName} 需要导出 toonflowNodes.${name}，请按实际节点名修改文件名`);
  try { new Bun.Transpiler({ loader: "js" }).scan(source); }
  catch { invalid("节点脚本语法无效，请重新构建并上传完整的 .umd.js 文件"); }
  const directory = resolve(dirname(conf.path), "nodes");
  await mkdir(directory, { recursive: true });
  if ((await lstat(directory)).isSymbolicLink()) invalid("节点目录不能是符号链接", 403);
  const path = resolve(directory, fileName);
  const release = lockWorkspaceFiles([path]);
  try {
    const current = await lstat(path).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    if (current && !current.isFile()) invalid("现有节点必须是普通文件", 403);
    if (current && !force) requireNewerVersion(current.size <= maxBytes ? nodeVersion(await readFile(path, "utf8")) : undefined, nodeVersion(source), `节点“${name}”`);
    await writeWorkspaceFile(path, source, !current);
  } finally { release(); }
  return { name };
}

export async function installTool(fileName: string, source: string, force = false) {
  if (!/^[a-z][a-zA-Z0-9]*\.tool\.js$/.test(fileName)) invalid("工具文件名无效，请选择小驼峰命名的 .tool.js 文件");
  if (!source.trim()) invalid("工具文件内容为空，请重新上传工具脚本");
  if (Buffer.byteLength(source, "utf8") > maxBytes) invalid("工具文件不能超过 20 MB", 413);
  const name = fileName.slice(0, -8);
  const { metadata } = parseTool(source, name);
  try {
    if (!new Bun.Transpiler({ loader: "js" }).scan(source).exports.includes("default")) throw new Error("default");
  } catch { invalid("工具脚本语法无效或缺少默认导出"); }
  await mkdir(toolsDirectory, { recursive: true });
  if ((await lstat(toolsDirectory)).isSymbolicLink()) invalid("工具目录不能是符号链接", 403);
  const path = resolve(toolsDirectory, fileName);
  const release = lockWorkspaceFiles([path]);
  try {
    const current = await lstat(path).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    if (current && !current.isFile()) invalid("现有工具必须是普通文件", 403);
    if (current && !force) {
      let version: unknown;
      if (current.size <= maxBytes) {
        const previous = await readFile(path, "utf8");
        try { version = parseTool(previous, name).metadata.version; } catch { /* 损坏元数据没有可比较的版本。 */ }
      }
      requireNewerVersion(version, metadata.version, `工具“${name}”`);
    }
    await writeWorkspaceFile(path, source, !current);
    // ACT: Bun 按文件路径缓存模块，URL query 不会使已加载的工具失效。
    delete require.cache[path];
  } finally { release(); }
  return { name };
}

export function skillPath(value: string, directory = false) {
  let path = value.replace(/^(\.\/)+/, "");
  if (directory) path = path.replace(/\/$/, "");
  if (!path && directory) return "";
  if (!path || path.length > 1024 || path.split("/").some(part => !isSafeSegment(part))) invalid("技能包包含不安全的文件路径");
  return path;
}

function skillEntryPaths() {
  const entries = new Set<string>();
  const paths = new Map<string, { path: string; directory: boolean }>();
  return (original: string, directory: boolean) => {
    const path = skillPath(original, directory);
    if (entries.has(path.toLowerCase())) invalid("技能包包含重名文件或目录");
    entries.add(path.toLowerCase());
    if (entries.size > 2000) invalid("技能包最多包含 2000 个文件和目录");
    const parts = path ? path.split("/") : [];
    for (let index = 1; index <= parts.length; index++) {
      const nested = parts.slice(0, index).join("/");
      const isDirectory = index < parts.length || directory;
      const existing = paths.get(nested.toLowerCase());
      if (existing && (existing.path !== nested || existing.directory !== isDirectory)) invalid("技能包包含冲突的文件或目录路径");
      paths.set(nested.toLowerCase(), { path: nested, directory: isDirectory });
    }
    return path;
  };
}

export function skillZip(bytes: Uint8Array) {
  const data = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = data.length - 22;
  for (; end >= Math.max(0, data.length - 65557); end--) {
    if (data.readUInt32LE(end) === 0x06054b50 && end + 22 + data.readUInt16LE(end + 20) === data.length) break;
  }
  if (end < Math.max(0, data.length - 65557)) invalid("ZIP 技能包结尾无效");
  const count = data.readUInt16LE(end + 10);
  const start = data.readUInt32LE(end + 16);
  if (data.readUInt16LE(end + 4) || data.readUInt16LE(end + 6) || data.readUInt16LE(end + 8) !== count
    || count === 0xffff || start + data.readUInt32LE(end + 12) !== end) invalid("请使用未分卷的普通 ZIP 技能包，不支持 ZIP64");
  if (count > 2000) invalid("技能包最多包含 2000 个文件和目录");
  const entryPath = skillEntryPaths();
  const entries: { path: string; directory: boolean; size: number; checksum: number; method: number; start: number; end: number; header: number }[] = [];
  let total = 0;
  let offset = start;
  // ACT: 仅支持普通存储/Deflate ZIP；先验证目录和声明大小，再限量解压，不将压缩包直接释放到磁盘。
  for (let index = 0; index < count; index++) {
    if (offset + 46 > end || data.readUInt32LE(offset) !== 0x02014b50) invalid("ZIP 技能包目录无效");
    const flags = data.readUInt16LE(offset + 8);
    const method = data.readUInt16LE(offset + 10);
    const checksum = data.readUInt32LE(offset + 16);
    const compressed = data.readUInt32LE(offset + 20);
    const size = data.readUInt32LE(offset + 24);
    const nameLength = data.readUInt16LE(offset + 28);
    const extraLength = data.readUInt16LE(offset + 30);
    const next = offset + 46 + nameLength + extraLength + data.readUInt16LE(offset + 32);
    const header = data.readUInt32LE(offset + 42);
    if (next > end || header + 30 > start || data.readUInt16LE(offset + 34)) invalid("ZIP 技能包文件头无效");
    if (flags & ~0x080e || ![0, 8].includes(method)) invalid("ZIP 技能包不能加密，仅支持存储或 Deflate 压缩");
    const original = decodeText(data.subarray(offset + 46, offset + 46 + nameLength));
    const attributes = data.readUInt32LE(offset + 38);
    const kind = (attributes >>> 16) & 0xf000;
    const directory = original.endsWith("/") || Boolean(attributes & 0x10) || kind === 0x4000;
    if (![0, 0x4000, 0x8000].includes(kind)) invalid("ZIP 技能包不能包含链接、设备或其他特殊文件");
    const path = entryPath(original, directory);
    total += size;
    if (size === 0xffffffff || compressed === 0xffffffff || total > maxBytes) invalid("技能包解压后不能超过 20 MB", 413);
    if (directory && size !== 0 || method === 0 && compressed !== size) invalid("ZIP 技能包文件大小无效");
    if (data.readUInt32LE(header) !== 0x04034b50 || data.readUInt16LE(header + 6) !== flags
      || data.readUInt16LE(header + 8) !== method || data.readUInt16LE(header + 26) !== nameLength) invalid("ZIP 技能包条目不一致");
    const content = header + 30 + nameLength + data.readUInt16LE(header + 28);
    if (content + compressed > start || !data.subarray(header + 30, header + 30 + nameLength).equals(data.subarray(offset + 46, offset + 46 + nameLength))) invalid("ZIP 技能包条目不一致");
    if (!(flags & 8) && (data.readUInt32LE(header + 14) !== checksum || data.readUInt32LE(header + 18) !== compressed
      || data.readUInt32LE(header + 22) !== size)) invalid("ZIP 技能包条目大小或校验值不一致");
    entries.push({ path, directory, size, checksum, method, start: content, end: content + compressed, header });
    offset = next;
  }
  if (offset !== end) invalid("ZIP 技能包目录长度不一致");
  entries.sort((first, second) => first.header - second.header);
  const result = new Map<string, Uint8Array>();
  let previousEnd = 0;
  for (const entry of entries) {
    if (entry.header < previousEnd) invalid("ZIP 技能包包含重叠条目");
    previousEnd = entry.end;
    let content: Uint8Array;
    try {
      const compressed = data.subarray(entry.start, entry.end);
      content = entry.method === 0 ? compressed : inflateRawSync(compressed, { maxOutputLength: Math.max(1, entry.size) });
    } catch { return invalid("ZIP 技能包损坏或实际解压大小超过声明值"); }
    if (content.byteLength !== entry.size || crc32(content) !== entry.checksum) invalid("ZIP 技能包文件大小或校验值错误");
    if (!entry.directory && !entry.path.startsWith("__MACOSX/") && entry.path.split("/").at(-1) !== ".DS_Store") result.set(entry.path, content);
  }
  return result;
}

async function skillArchive(bytes: Uint8Array) {
  let tar = bytes;
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    try {
      tar = await readBounded(new Blob([bytes.slice()]).stream().pipeThrough(new DecompressionStream("gzip")), maxBytes, "技能包解压后不能超过 20 MB");
    } catch (error) {
      if (error instanceof Error && "status" in error) throw error;
      invalid("技能压缩包损坏");
    }
  }
  if (tar.length > maxBytes || tar.length % 512 !== 0) invalid("技能压缩包无效或解压后超过 20 MB");
  const entries = new Map<string, { size: number; directory: boolean }>();
  const entryPath = skillEntryPaths();
  function field(header: Uint8Array, start: number, length: number) {
    const data = header.subarray(start, start + length);
    return decodeText(data.subarray(0, data.indexOf(0) < 0 ? data.length : data.indexOf(0)));
  }
  // ACT: Bun.Archive.files() 会略过链接并合并重名；先检查普通 USTAR 头，复杂 PAX/GNU 扩展拒绝安装。
  for (let offset = 0; offset < tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) {
      if (tar.subarray(offset).some(byte => byte !== 0)) invalid("技能包结尾包含额外数据");
      break;
    }
    const checksum = field(header, 148, 8).trim();
    const sum = header.reduce((total, byte, index) => total + (index >= 148 && index < 156 ? 32 : byte), 0);
    const sizeField = field(header, 124, 12).trim();
    if (!/^[0-7]+$/.test(checksum) || Number.parseInt(checksum, 8) !== sum || !/^[0-7]+$/.test(sizeField)) invalid("技能包文件头无效");
    const size = Number.parseInt(sizeField, 8);
    const directory = header[156] === 53;
    if (![0, 48, 53].includes(header[156]!)) invalid("技能包不能包含链接、设备或 PAX/GNU 扩展条目，请使用普通 tar 格式");
    if (directory && size !== 0 || offset + 512 + Math.ceil(size / 512) * 512 > tar.length) invalid("技能包文件大小无效");
    const prefix = field(header, 257, 6) === "ustar" ? field(header, 345, 155) : "";
    const original = [prefix, field(header, 0, 100)].filter(Boolean).join("/");
    const path = entryPath(original, directory);
    entries.set(path.toLowerCase(), { size, directory });
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  let files: Map<string, File>;
  try { files = await new Bun.Archive(tar).files(); }
  catch { return invalid("技能压缩包无法读取"); }
  const result = new Map<string, Uint8Array>();
  for (const [original, file] of files) {
    const path = skillPath(original);
    const entry = entries.get(path.toLowerCase());
    if (!entry || entry.directory || entry.size !== file.size || result.has(path)) invalid("技能包条目不一致");
    result.set(path, new Uint8Array(await file.arrayBuffer()));
  }
  if (result.size !== [...entries.values()].filter(entry => !entry.directory).length) invalid("技能包条目不完整");
  return result;
}

export async function installSkill(fileName: string, bytes: Uint8Array, force = false) {
  if (!fileName || fileName.length > 128 || /[\\/]/.test(fileName) || !/\.(md|zip|tar|tar\.gz|tgz)$/i.test(fileName)) invalid("请选择 .zip、.md、.tar、.tar.gz 或 .tgz 技能文件");
  skillPath(fileName);
  if (!bytes.byteLength) invalid("技能文件不能为空");
  if (bytes.byteLength > maxBytes) invalid("技能文件不能超过 20 MB", 413);
  const files = /\.md$/i.test(fileName) ? new Map([["SKILL.md", bytes]]) : /\.zip$/i.test(fileName) ? skillZip(bytes) : await skillArchive(bytes);
  const manifests = [...files.keys()].filter(path => path === "SKILL.md" || path.endsWith("/SKILL.md"));
  if (manifests.length !== 1) invalid("技能包必须包含且仅包含一个 SKILL.md");
  const manifest = manifests[0]!;
  const prefix = manifest.slice(0, -8);
  if ([...files.keys()].some(path => !path.startsWith(prefix))) invalid("技能资源必须位于 SKILL.md 所在目录内");
  let frontmatter: Record<string, unknown>;
  try { ({ frontmatter } = parseFrontmatter(decodeText(files.get(manifest)!))); }
  catch { return invalid("SKILL.md 前言格式无效"); }
  const name = frontmatter?.name;
  const description = frontmatter?.description;
  // ACT: 兼容本地创建的小驼峰名称与既有短横线名称，不修改包内标识。
  if (typeof name !== "string" || name.length > 64 || !/^[a-z0-9][a-zA-Z0-9]*(?:-[a-zA-Z0-9]+)*$/.test(name)) invalid("技能 name 必须为不超过 64 字符的小驼峰或短横线名称");
  skillPath(name);
  if (typeof description !== "string" || !description.trim() || description.length > 1024) invalid("技能 description 必须为 1 至 1024 字符");
  const root = dirname(conf.path);
  const directory = join(root, "skills");
  await mkdir(directory, { recursive: true });
  if ((await lstat(directory)).isSymbolicLink()) invalid("技能目录不能是符号链接", 403);
  const target = join(directory, name);
  const release = lockWorkspaceFiles([directory]);
  let temporary: string | undefined;
  let preserveBackup = false;
  try {
    const existing = (await readdir(directory)).find(item => item.toLowerCase() === name.toLowerCase());
    if (existing && existing !== name) invalid(`技能目录“${existing}”与“${name}”大小写冲突，请先统一名称`, 409);
    if (existing) {
      if (!(await lstat(target)).isDirectory()) invalid("现有技能必须是独立的普通目录", 403);
      const current = await lstat(join(target, "SKILL.md"));
      if (!current.isFile()) invalid("现有技能主文件必须是普通文件", 403);
      const entries = await readdir(target, { recursive: true, withFileTypes: true });
      if (entries.some(entry => entry.name.toLowerCase() === "skill.md" && join(entry.parentPath, entry.name) !== join(target, "SKILL.md"))) invalid("目录中包含其他技能，不能整体替换", 409);
      if (!force) {
        let version: unknown;
        if (current.size <= maxBytes) {
          const previous = await readFile(join(target, "SKILL.md"), "utf8");
          try { version = (parseFrontmatter(previous).frontmatter.metadata as Record<string, unknown> | undefined)?.version; } catch { /* 损坏元数据没有可比较的版本。 */ }
        }
        requireNewerVersion(version, (frontmatter.metadata as Record<string, unknown> | undefined)?.version, `技能“${name}”`);
      }
    }
    temporary = await mkdtemp(join(root, ".skillInstall"));
    if (!isWithin(root, temporary)) invalid("技能暂存目录无效");
    const staged = join(temporary, "new");
    for (const [path, content] of files) {
      const destination = resolve(staged, path.slice(prefix.length));
      if (!isWithin(staged, destination)) invalid("技能资源路径无效");
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, content, { flag: "wx", mode: 0o600 });
    }
    // ACT: 单进程锁内切换完整目录；旧版留到新版就位，失败时原路恢复。
    const backup = join(temporary, "previous");
    if (existing) await rename(target, backup);
    try { await rename(staged, target); }
    catch (error) {
      if (existing) {
        try { await rename(backup, target); }
        catch (restoreError) {
          preserveBackup = true;
          throw new AggregateError([error, restoreError], `技能更新失败，旧版保留在 ${backup}，请恢复后重试`);
        }
      }
      throw error;
    }
    return { name };
  } finally {
    try {
      if (temporary && !preserveBackup && temporary !== root && isWithin(root, temporary)) {
        await rm(temporary, { recursive: true, force: true }).catch(error => console.warn(`技能安装暂存目录清理失败：${temporary}`, error));
      }
    } finally { release(); }
  }
}

export async function installRemotePlugin(type: PluginInstallType, url: string, fileName?: string, force = false) {
  const address = remoteAddress(url);
  if (fileName === undefined) {
    try { fileName = decodeURIComponent(address.pathname.split("/").at(-1) ?? ""); }
    catch { return invalid("下载地址中的文件名编码无效，请重新生成下载链接"); }
  }
  const patterns = { node: /^[a-z][a-zA-Z0-9]*\.umd\.js$/, tool: /^[a-z][a-zA-Z0-9]*\.tool\.js$/, skill: /\.(md|zip|tar|tar\.gz|tgz)$/i, provider: /^[a-z][a-zA-Z0-9]*\.ts$/, agent: /^[a-z][a-zA-Z0-9]*\.agent\.zip$/ };
  const examples = { node: "audioNode.umd.js", tool: "exampleTool.tool.js", skill: "example.zip、SKILL.md、example.tar、example.tar.gz 或 example.tgz", provider: "exampleProvider.ts", agent: "exampleTeam.agent.zip" };
  if (!Object.hasOwn(patterns, type)) invalid("不支持此插件类型，可选值为 node、tool、skill、provider、agent");
  if (!fileName) invalid(`下载地址缺少文件名，请使用指向文件的地址，例如 ${examples[type]}`);
  if (fileName.length > 128 || /[\\/]/.test(fileName)) invalid("插件文件名无效，不能包含目录路径或超过 128 字符");
  if (!patterns[type].test(fileName)) invalid(`下载文件名“${fileName.slice(0, 128)}”不符合 ${type} 类型规范，文件名示例：${examples[type]}；改名后请重新生成下载链接`);
  const bytes = await download(url, type === "provider" ? 2 * 1024 * 1024 : maxBytes, { node: "节点", tool: "工具", skill: "技能", provider: "供应商", agent: "团队" }[type]);
  if (type === "agent") return (await import("@/utils/teams/install")).installTeam(fileName, bytes, force);
  if (type === "skill") return installSkill(fileName, bytes, force);
  const source = decodeText(bytes);
  if (type === "node") return installNode(fileName, source, force);
  if (type === "tool") return installTool(fileName, source, force);
  return { name: (await addMediaProvider(source)).id };
}
