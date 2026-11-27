import { createWriteStream, lstatSync, readFileSync } from "@toonflow/file";
import { file } from "@toonflow/file/bun";
import type { updateSnapshot } from "@toonflow/server/desktop";
import { t } from "@toonflow/server/i18n";
import { createHash, randomUUID } from "node:crypto";
import { join } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const maxSize = 512 * 1024 * 1024;
export const shaPattern = /^[a-f0-9]{64}$/;
const buildPattern = /^[a-zA-Z0-9]{1,64}$/;
const versionPattern = /^\d+\.\d+\.\d+$/;
export type packageAsset = { file: string; size: number; sha256: string };
export type versionInfo = { identifier: string; version: string; channel: string; hash: string; baseUrl: string };
type downloadProgress = NonNullable<updateSnapshot["updateProgress"]>;

export function validAsset(value: packageAsset | undefined, name: string): value is packageAsset {
  return value?.file === name && typeof value.sha256 === "string" && shaPattern.test(value.sha256)
    && Number.isSafeInteger(value.size) && value.size > 0 && value.size <= maxSize;
}

export async function matches(path: string, sha256: string, size?: number) {
  const stat = lstatSync(path, { throwIfNoEntry: false });
  if (!stat?.isFile() || stat.size > maxSize || (size !== undefined && size !== stat.size)) return false;
  const digest = createHash("sha256");
  for await (const chunk of file(path).stream()) digest.update(chunk);
  return digest.digest("hex") === sha256;
}

// 系统即将以管理员身份安装此包；包括重定向在内只接受 HTTPS，本机自定义更新源可用 HTTP。
async function fetchAsset(baseUrl: string, name: string, signal: AbortSignal) {
  let url = new URL(name, baseUrl.replace(/\/?$/, "/"));
  let requiresHttps = false;
  url.searchParams.set("transaction", randomUUID());
  for (let redirect = 0; redirect <= 5; redirect++) {
    requiresHttps ||= url.protocol === "https:";
    if (url.username || url.password || (url.protocol !== "https:" &&
      (requiresHttps || url.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) {
      throw new Error(t`更新地址无效`);
    }
    const response = await fetch(url, { signal, redirect: "manual" });
    if (response.ok && response.body) return response.body;
    await response.body?.cancel();
    const location = response.headers.get("location");
    if (![301, 302, 303, 307, 308].includes(response.status) || !location) throw new Error(t`下载更新失败：HTTP ${response.status}`);
    url = new URL(location, url);
  }
  throw new Error(t`更新地址无效`);
}

export function readInstalledVersion(resourcesDirectory: string, channels: string[]): versionInfo {
  const info = JSON.parse(readFileSync(join(resourcesDirectory, "version.json"), "utf8"));
  if (info?.identifier !== "local.toonflow.desktop" || !channels.includes(info.channel) || typeof info.version !== "string"
    || !versionPattern.test(info.version) || typeof info.hash !== "string" || !buildPattern.test(info.hash)
    || typeof info.baseUrl !== "string") throw new Error(t`桌面安装标识无效，请重新安装`);
  return info;
}

export async function readPackageManifest(info: versionInfo, platform: "linux" | "macos") {
  const prefix = `${info.channel}-${platform}-${process.arch}`;
  const body = await fetchAsset(info.baseUrl, `${prefix}-update.json`, AbortSignal.timeout(30000));
  const chunks: Uint8Array[] = [];
  let length = 0;
  for await (const chunk of body) {
    length += chunk.length;
    if (length > 65536) throw new Error(t`更新清单过大`);
    chunks.push(chunk);
  }
  const next = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (next?.schemaVersion !== 1 || next.identifier !== info.identifier || next.channel !== info.channel
    || next.platform !== platform || next.arch !== process.arch || typeof next.version !== "string" || !versionPattern.test(next.version)
    || typeof next.hash !== "string" || !buildPattern.test(next.hash)) throw new Error(t`更新清单不匹配当前应用`);
  if (Bun.semver.order(next.version, info.version) < 0) throw new Error(t`更新源版本 ${next.version} 早于当前版本 ${info.version}，已阻止降级`);
  return next;
}

export function packageAssetName(baseUrl: string, alias: string, file: string) {
  return baseUrl.replace(/\/$/, "") === "https://api.toonflow.net/web/version/desktopUpdates" ? alias : file;
}

export async function downloadPackage(baseUrl: string, asset: packageAsset, name: string, path: string, setProgress: (progress: downloadProgress) => void) {
  const signal = AbortSignal.timeout(15 * 60_000);
  const body = await fetchAsset(baseUrl, name, signal);
  const digest = createHash("sha256");
  const progress: downloadProgress = { phase: "downloading", received: 0, total: asset.size };
  setProgress(progress);
  await pipeline(Readable.from(body), new Transform({ transform(chunk: Buffer, encoding, callback) {
    progress.received += chunk.length;
    if (progress.received > asset.size) return callback(new Error(t`更新包大小与清单不一致`));
    digest.update(chunk);
    callback(null, chunk);
  } }), createWriteStream(path, { flags: "wx", mode: 0o600 }), { signal });
  if (progress.received !== asset.size || digest.digest("hex") !== asset.sha256) throw new Error(t`更新包校验失败`);
  progress.phase = "preparing";
}
