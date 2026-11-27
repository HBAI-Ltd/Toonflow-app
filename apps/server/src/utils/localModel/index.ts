import { markMessages } from "@toonflow/i18n";
import { createHash, randomUUID } from "node:crypto";
import { dirname, extname, join } from "node:path";
import { createReadStream, lstat, mkdir, open, rename, unlink } from "@toonflow/file";
import { t, translateMessage } from "@/lib/i18n";
import { getRuntimePlatform } from "@/lib/platform";
import conf from "@/utils/conf";
import { modelAssets, type ModelAsset } from "@/utils/localModel/catalog";
import type { LocalModelItem, LocalModelsStatus } from "@/types/localModels";
import { localModelId, localModelOwnerSchema } from "@toonflow/plugin-server/localModels";
import { getPluginModelOwner, listPluginModelOwners } from "@/utils/localModel/pluginCatalog";
import { applyPluginModelChanges, readPluginModelChanges } from "@/utils/localModel/pluginChanges";
import { streamPublicFile } from "@/utils/workspace/download";
import { getDeploymentModelRunner } from "@/utils/localModel/runners";
import { notifyModelChange } from "@/utils/localModel/events";
export { modelChanges, notifyModelCatalogChange } from "@/utils/localModel/events";

const version = "1.22.0";
const directory = join(dirname(conf.path), "model");
const runtime = getRuntimePlatform();
const platform = runtime.mobile && runtime.os === "linux" ? "android" : runtime.os;
const target = `${platform}-${process.arch}`;
const macFile = `libonnxruntime.${version}.dylib`;
// SHA-256 和大小取自 Microsoft 发布的 onnxruntime-node npm 包内各平台原始动态库。
const builds: Record<string, { fileName: string; size: number; sha256: string }> = {
  "win32-x64": { fileName: "onnxruntime.dll", size: 21296680, sha256: "ba2a8a791133d97d6a80da393815565709dd6936f457bc00d8ce4c707873e3a6" },
  "win32-arm64": { fileName: "onnxruntime.dll", size: 22664744, sha256: "0d52f2c0c721ec6d1b3e394fa2d2a97f7175e91d69ceaa9ba214ff81e40f0071" },
  "linux-x64": { fileName: "libonnxruntime.so.1", size: 30948272, sha256: "08cf3bf4218f0e816c2a534e960d85221274cb319569bdf1136b29da7065b015" },
  "linux-arm64": { fileName: "libonnxruntime.so.1", size: 17643256, sha256: "0afd69a0ae38c5099fd0e8604dda398ac43dee67cd9c6394b5142b19e82528de" },
  "darwin-x64": { fileName: macFile, size: 37994448, sha256: "2e4bb2d31348265a9f416587972363a60851f577c3600f22cf92e00030c487fc" },
  "darwin-arm64": { fileName: macFile, size: 34066312, sha256: "10b8fdb6c3541cf2c2d170264e0501f284658719e1441e0922c34e6e9b45cf7c" },
};
const build = builds[target];
function runtimeSources(fileName: string) {
  const path = `bin/napi-v6/${platform}/${process.arch}/${fileName}`;
  return [
    { id: "npmmirror", label: "阿里镜像（推荐）", url: `https://registry.npmmirror.com/onnxruntime-node/${version}/files/${path}` },
    { id: "unpkg", label: "UNPKG", url: `https://unpkg.com/onnxruntime-node@${version}/${path}` },
  ];
}
const runtimeAsset: ModelAsset = { id: "onnxRuntime", name: "ONNX Runtime", displayName: markMessages("本地模型运行库"), version,
  fileName: build?.fileName ?? "", size: build?.size ?? 0, sha256: build?.sha256 ?? "", sources: build ? runtimeSources(build.fileName) : [] };
const directMlBuilds: Record<string, { size: number; sha256: string }> = {
  "win32-x64": { size: 18527776, sha256: "7777bea244d1ce356552604eec61668c3eddf5f345a60fa1a9a531c89dafbbd0" },
  "win32-arm64": { size: 18444840, sha256: "a82404215a52af1597e8740df04c2273107729a1f6e91f3236696432f82c3420" },
};
const directMl = directMlBuilds[target];
const builtinAssets: ModelAsset[] = [runtimeAsset, ...(directMl ? [{ id: "directMl", name: "DirectML", displayName: markMessages("Windows 显卡加速运行库"), version,
  fileName: "DirectML.dll", ...directMl, sources: runtimeSources("DirectML.dll") }] : []), ...modelAssets];
const installing = new Map<string, NonNullable<LocalModelItem["progress"]>>();
const verification = new Map<string, { fingerprint: string; matches: Promise<boolean> }>();

async function ensureDirectory(path = directory) {
  await mkdir(path, { recursive: true });
  if (!(await lstat(path)).isDirectory()) {
    throw Object.assign(new Error(t`安装目录必须是普通文件夹：${path}`), { status: 403 });
  }
}

function assetsForPlugin(manifest: Awaited<ReturnType<typeof getPluginModelOwner>>, changes: Awaited<ReturnType<typeof readPluginModelChanges>>): ModelAsset[] {
  const { owner, revision, declared } = manifest;
  return applyPluginModelChanges(owner, revision, declared, changes).map(model => ({ ...model, owner, id: localModelId(owner, model.id) }));
}

async function findAsset(id: string) {
  if (!id.includes(":")) return builtinAssets.find(asset => asset.id === id);
  const [kind, name, key, ...rest] = id.split(":");
  const owner = localModelOwnerSchema.safeParse({ kind, name });
  if (!owner.success || !key || rest.length) return;
  const manifest = await getPluginModelOwner(owner.data).catch((cause: NodeJS.ErrnoException) => {
    if (cause.code !== "ENOENT") throw cause;
  });
  if (manifest) return assetsForPlugin(manifest, await readPluginModelChanges()).find(asset => asset.id === id);
}

function assetPathFor(asset: ModelAsset) {
  if (!asset.owner) return join(directory, asset.fileName);
  // 插件不同版本、不同模型或同名文件均不覆盖彼此已安装的内容。
  const key = createHash("sha256").update(asset.id).update(":").update(asset.sha256).digest("hex");
  return join(directory, "plugins", key + extname(asset.fileName));
}

async function checkPluginAsset(asset: ModelAsset) {
  if (!asset.owner) return;
  const current = await findAsset(asset.id);
  if (!current || current.sha256 !== asset.sha256 || current.size !== asset.size || current.fileName !== asset.fileName) {
    throw Object.assign(new Error("插件模型已发生变化，请重新选择"), { status: 409 });
  }
}

async function matchesDigest(path: string, sha256: string) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex") === sha256;
}

async function isInstalled(asset: ModelAsset) {
  if (!asset.fileName) return false;
  const path = assetPathFor(asset);
  const info = await lstat(path, { bigint: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
    return null;
  });
  if (!info?.isFile() || info.size !== BigInt(asset.size)) {
    verification.delete(asset.id);
    return false;
  }
  const fingerprint = `${asset.sha256}/${info.ino}/${info.ctimeNs}/${info.mtimeNs}`;
  const cached = verification.get(asset.id);
  if (cached?.fingerprint === fingerprint) return cached.matches;
  const matches = matchesDigest(path, asset.sha256);
  verification.set(asset.id, { fingerprint, matches });
  try {
    return await matches;
  } catch (error) {
    if (verification.get(asset.id)?.matches === matches) verification.delete(asset.id);
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

export async function getStatus(): Promise<LocalModelsStatus> {
  await ensureDirectory();
  const [manifests, changes] = await Promise.all([listPluginModelOwners(), readPluginModelChanges()]);
  const assets = [...builtinAssets, ...manifests.flatMap(manifest => assetsForPlugin(manifest, changes))];
  if (assets.length > builtinAssets.length) await ensureDirectory(join(directory, "plugins"));
  const installedIds = new Set<string>();
  const remoteIds = new Set<string>();
  for (const asset of assets) {
    if (await isInstalled(asset)) installedIds.add(asset.id);
    if (getDeploymentModelRunner(asset)) remoteIds.add(asset.id);
  }
  const items: LocalModelItem[] = [];
  for (const asset of assets) {
    const { id, name, displayName, description, owner, version, fileName, size, sources } = asset;
    const installed = installedIds.has(id);
    const onnx = fileName.toLowerCase().endsWith(".onnx");
    const native = id === "deepFilterNet" || id === "whisper";
    const requiredAssetIds = onnx && !remoteIds.has(id) ? [runtimeAsset.id] : [];
    if (id === "whisper" && !remoteIds.has(id) && !Bun.which("whisper-cli")) requiredAssetIds.push("whisperRuntime");
    if (id === "handPose" && !remoteIds.has("palmDetection")) requiredAssetIds.push("palmDetection");
    if (id === "ppOcrV5Rec" && !remoteIds.has("ppOcrV5Det")) requiredAssetIds.push("ppOcrV5Det");
    if (requiredAssetIds.some(dep => dep === "palmDetection" || dep === "ppOcrV5Det") && !requiredAssetIds.includes(runtimeAsset.id)) requiredAssetIds.push(runtimeAsset.id);
    const canRun = (remoteIds.has(id) || ((onnx || native) && installed)) && requiredAssetIds.every(dep => installedIds.has(dep));
    const progress = installing.get(id);
    items.push({ id, name, displayName, description, owner, version, fileName, size, canRun, requiredAssetIds, remoteAvailable: remoteIds.has(id), installed, installing: !!progress,
      progress: progress && { ...progress },
      sources: owner ? sources : sources.map(source => ({ ...source, label: translateMessage(source.label) })) });
  }
  const first = items[0];
  return { directory, target, version, fileName: first.fileName, installed: first.installed,
    installing: first.installing, sources: first.sources, items };
}

export async function getRegisteredModel(id: string) {
  const asset = await findAsset(id);
  if (!asset) throw Object.assign(new Error("未知的本地模型"), { status: 404 });
  return asset;
}

export async function resolveInstalledModel(id: string) {
  const asset = await getRegisteredModel(id);
  await ensureDirectory();
  if (asset.owner) await ensureDirectory(join(directory, "plugins"));
  if (!await isInstalled(asset)) throw Object.assign(new Error("请先在本地模型列表中安装对应版本的文件"), { status: 409 });
  await checkPluginAsset(asset);
  return { ...asset, path: assetPathFor(asset) };
}

// 下载入口完全来自内置目录。保留系统代理，仅允许在当前发行商的 HTTPS 站点间跳转，不接受用户提供的 URL。
async function* streamAsset(source: ModelAsset["sources"][number], size: number, signal: AbortSignal) {
  const origin = new URL(source.url);
  const modelHub = ["hfMirror", "hfMirrorNet", "sufy", "huggingface"].includes(source.id);
  let url = source.url;
  for (let redirects = 0; redirects <= 5; redirects++) {
    const address = new URL(url);
    const hubRedirect = modelHub && (address.hostname === "huggingface.co" || address.hostname.endsWith(".hf.co") || address.hostname.endsWith(".huggingface.co"));
    const modelScopeCdn = source.id === "modelScope" && /^cdn-lfs-[a-z]+-\d+\.modelscope\.cn$/.test(address.hostname);
    const githubCdn = ["github", "ghfast", "ghproxy"].includes(source.id) && ["github.com", "release-assets.githubusercontent.com", "raw.githubusercontent.com", "media.githubusercontent.com"].includes(address.hostname);
    if (address.protocol !== "https:" || address.username || address.password || address.port || (address.origin !== origin.origin && !hubRedirect && !modelScopeCdn && !githubCdn)) break;
    const response = await fetch(address, { redirect: "manual", credentials: "omit", signal });
    const location = response.headers.get("location");
    if (location && [301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel();
      url = new URL(location, address).href;
      continue;
    }
    if (!response.ok || !response.body || Number(response.headers.get("content-length")) > size) {
      await response.body?.cancel();
      break;
    }
    // installModel 在写入每一块之前检查累计长度，结束后校验完整的 SHA-256。
    yield* response.body;
    return;
  }
  throw new Error("文件下载失败，请更换下载源后重试");
}

async function* downloadFile(asset: ModelAsset, sourceId: string) {
  const source = asset.sources.find(item => item.id === sourceId);
  if (!source) throw Object.assign(new Error("此下载源暂不可用，请选择其他下载源"), { status: 400 });
  try {
    const signal = AbortSignal.timeout(30 * 60_000);
    if (asset.owner) yield* streamPublicFile(source.url, { signal, maxBytes: asset.size, label: "本地模型", httpsOnly: true });
    else yield* streamAsset(source, asset.size, signal);
  } catch (cause) {
    if (cause instanceof Error && "status" in cause) throw cause;
    throw Object.assign(new Error("文件下载失败，请更换下载源后重试", { cause }), { status: 502 });
  }
}

export async function installModel(id: string | undefined, input: string | AsyncIterable<Uint8Array>, contentLength?: number) {
  const asset = await findAsset(id ?? runtimeAsset.id);
  if (!asset) throw Object.assign(new Error("未知的本地模型"), { status: 400 });
  if (!asset.fileName) throw Object.assign(new Error(t`暂不支持自动下载 ${target} 版本`), { status: 400 });
  if (installing.has(asset.id)) throw Object.assign(new Error("正在安装此文件，请稍后再试"), { status: 409 });
  const mismatch = () => Object.assign(new Error(asset === runtimeAsset ? "运行库校验失败，请使用当前平台和版本的文件" : "模型校验失败，请使用对应版本的文件"), { status: 422 });
  if (contentLength !== undefined && contentLength !== asset.size) throw mismatch();
  const tempPath = join(directory, `.model-${randomUUID()}.tmp`);
  const progress: NonNullable<LocalModelItem["progress"]> = { phase: typeof input === "string" ? "downloading" : "importing", received: 0, total: asset.size };
  installing.set(asset.id, progress);
  const notify = () => notifyModelChange(asset.id, progress);
  notify();
  let lastUpdate = Date.now();
  let temporary = false;
  try {
    await ensureDirectory();
    if (asset.owner) await ensureDirectory(join(directory, "plugins"));
    const handle = await open(tempPath, "wx", 0o600);
    temporary = true;
    try {
      const hash = createHash("sha256");
      for await (const chunk of typeof input === "string" ? downloadFile(asset, input) : input) {
        if (progress.received + chunk.byteLength > asset.size) throw mismatch();
        hash.update(chunk);
        await handle.writeFile(chunk);
        progress.received += chunk.byteLength;
        if (Date.now() - lastUpdate >= 500) {
          lastUpdate = Date.now();
          notify();
        }
      }
      progress.phase = "verifying";
      notify();
      if (progress.received !== asset.size || hash.digest("hex") !== asset.sha256) throw mismatch();
    } finally {
      await handle.close();
    }
    const installed = await isInstalled(asset);
    await checkPluginAsset(asset);
    if (!installed) {
      await rename(tempPath, assetPathFor(asset));
      temporary = false;
      verification.delete(asset.id);
    }
  } finally {
    installing.delete(asset.id);
    notifyModelChange(asset.id);
    if (temporary) await unlink(tempPath);
  }
}
