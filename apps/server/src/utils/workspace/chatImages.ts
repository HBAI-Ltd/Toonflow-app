import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { request, type ClientRequest, type IncomingMessage } from "node:http";
import { request as requestSecure } from "node:https";
import { BlockList, isIP } from "node:net";
import { mkdir, realpath, stat } from "@toonflow/file";
import { lockWorkspaceFiles, resolveWorkspacePath, writeWorkspaceFile } from "@/utils/workspace/files";

const maxImageSize = 20 * 1024 * 1024;
const imageFormats = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif", "image/bmp": "bmp" };
const inflight = new Map<string, Promise<{ path: string; mimeType: string }>>();
const privateAddresses = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
  ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) privateAddresses.addSubnet(address, prefix, "ipv4");
for (const [address, prefix] of [["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20]] as const) privateAddresses.addSubnet(address, prefix, "ipv6");
const publicIpv6 = new BlockList();
publicIpv6.addSubnet("2000::", 3, "ipv6");

function invalid(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}

function isPublicAddress(address: string) {
  const family = isIP(address);
  return family === 4 ? !privateAddresses.check(address, "ipv4")
    : family === 6 && publicIpv6.check(address, "ipv6") && !privateAddresses.check(address, "ipv6");
}

function remoteAddress(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { return invalid("图片地址无效，请使用完整的 HTTP/HTTPS 地址"); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) invalid("图片仅支持不含账号密码的 HTTP/HTTPS 地址");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && !isPublicAddress(host)) invalid("不能下载本机、内网或特殊网络地址的图片", 403);
  url.hash = "";
  return url;
}

function requestImage(url: URL, signal: AbortSignal) {
  return new Promise<IncomingMessage>((resolve, reject) => {
    let outgoing: ClientRequest | undefined;
    let incoming: IncomingMessage | undefined;
    const abort = () => { outgoing?.destroy(); incoming?.destroy(); reject(signal.reason); };
    const cleanup = () => signal.removeEventListener("abort", abort);
    signal.addEventListener("abort", abort, { once: true });
    void (async () => {
      signal.throwIfAborted();
      const hostname = url.hostname.replace(/^\[|\]$/g, "");
      let addresses = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }] : await lookup(hostname, { all: true, verbatim: true });
      signal.throwIfAborted();
      if (addresses.length && addresses.every(item => /^198\.(18|19)\./.test(item.address))) {
        // ACT: 仅兼容 TUN 的 fake-IP 答案；固定 DoH 查回真实公网地址，不允许将特殊网段直接作为下载目标。
        const dnsUrl = new URL("https://dns.alidns.com/resolve");
        dnsUrl.searchParams.set("name", hostname);
        dnsUrl.searchParams.set("type", "A");
        const response = await fetch(dnsUrl, { signal, redirect: "error" });
        if (!response.ok) invalid("无法解析图片的真实公网地址，请稍后重试", 502);
        const answer = await response.json() as { Status?: number; Answer?: { type?: number; data?: unknown }[] };
        addresses = answer.Status === 0 && Array.isArray(answer.Answer) ? answer.Answer.filter(item => item.type === 1 && typeof item.data === "string").map(item => ({ address: item.data as string, family: 4 })) : [];
        signal.throwIfAborted();
      }
      if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) invalid("不能下载解析到本机、内网或特殊网络地址的图片", 403);
      const address = addresses[0];
      const connection = new URL(url);
      connection.hostname = address.family === 6 ? `[${address.address}]` : address.address;
      // ACT: 固定已校验 IP，保留原 Host 和 TLS 证书域名；Bun 的 request signal 不保证及时结束，改为显式销毁并 reject。
      outgoing = (url.protocol === "https:" ? requestSecure : request)(connection, {
        method: "GET", agent: false, servername: hostname,
        headers: { Host: url.host, Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,image/bmp" },
      }, response => {
        incoming = response;
        response.once("close", cleanup);
        if (signal.aborted) { abort(); return; }
        resolve(response);
      });
      outgoing.once("error", error => { cleanup(); reject(error); });
      if (signal.aborted) abort();
      else outgoing.end();
    })().catch(error => { cleanup(); reject(error); });
  });
}

function imageMimeType(bytes: Buffer): keyof typeof imageFormats {
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.toString("ascii", 12, 16) === "IHDR") return "image/png";
  if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (bytes.length >= 13 && /^GIF8[79]a/.test(bytes.toString("ascii", 0, 6))) return "image/gif";
  if (bytes.length >= 16 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" && /^VP8[ LX]$/.test(bytes.toString("ascii", 12, 16))) return "image/webp";
  if (bytes.length >= 26 && bytes.toString("ascii", 0, 2) === "BM") return "image/bmp";
  if (bytes.length >= 16 && bytes.toString("ascii", 4, 8) === "ftyp") {
    const end = bytes.readUInt32BE(0);
    if (end >= 16 && end <= bytes.length) {
      for (let offset = 8; offset + 4 <= end; offset += 4) if (["avif", "avis"].includes(bytes.toString("ascii", offset, offset + 4))) return "image/avif";
    }
  }
  if (/<svg(?:\s|>)/i.test(bytes.toString("utf8", 0, 512))) invalid("暂不支持网络 SVG 图片，请使用 PNG、JPEG、WebP、GIF、AVIF 或 BMP");
  return invalid("下载内容不是支持的图片，可能返回了网页或登录页面");
}

async function downloadImage(url: URL, signal: AbortSignal) {
  for (let redirects = 0; redirects <= 5; redirects++) {
    signal.throwIfAborted();
    const response = await requestImage(url, signal);
    if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0)) {
      const location = response.headers.location;
      response.destroy();
      if (!location || redirects === 5) invalid("图片重定向无效或超过 5 次，请使用图片直接地址", 502);
      url = remoteAddress(new URL(location, url).href);
      continue;
    }
    if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
      response.destroy();
      invalid(`下载图片失败（HTTP ${response.statusCode ?? 0}），链接可能失效或需要登录`, 502);
    }
    if (Number(response.headers["content-length"]) > maxImageSize) { response.destroy(); invalid("聊天图片不能超过 20 MB", 413); }
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of response) {
      signal.throwIfAborted();
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += bytes.length;
      if (size > maxImageSize) { response.destroy(); invalid("聊天图片不能超过 20 MB", 413); }
      chunks.push(bytes);
    }
    signal.throwIfAborted();
    const bytes = Buffer.concat(chunks, size);
    return { bytes, mimeType: imageMimeType(bytes) };
  }
  return invalid("图片重定向无效", 502);
}

export async function importImage(cwd: string, value: string) {
  const directory = await realpath(cwd);
  const url = remoteAddress(value);
  const key = JSON.stringify([directory, url.href]);
  const existing = inflight.get(key);
  if (existing) return existing;
  const pending = (async () => {
    const hash = createHash("sha256").update(url.href).digest("hex");
    const outputDirectory = "assets/chatImages";
    for (const [mimeType, extension] of Object.entries(imageFormats)) {
      const path = `${outputDirectory}/${hash}.${extension}`;
      const cached = await resolveWorkspacePath(directory, path, true);
      const info = await stat(cached.path).catch((error: NodeJS.ErrnoException) => { if (error.code === "ENOENT") return null; throw error; });
      if (info?.isFile() && info.size > 0 && info.size <= maxImageSize) return { path, mimeType };
    }
    const signal = AbortSignal.timeout(30000);
    const { bytes, mimeType } = await downloadImage(url, signal).catch(error => {
      if (signal.aborted) invalid("图片下载超时（30 秒），请检查网络后重试", 504);
      if (error instanceof Error && "status" in error) throw error;
      throw Object.assign(new Error("图片下载连接失败，请检查图片地址、网络或 HTTPS 证书", { cause: error }), { status: 502 });
    });
    const path = `${outputDirectory}/${hash}.${imageFormats[mimeType]}`;
    const output = await resolveWorkspacePath(directory, outputDirectory, true);
    const candidate = await resolveWorkspacePath(directory, path, true);
    const release = lockWorkspaceFiles([candidate.path]);
    try {
      await mkdir(output.path, { recursive: true });
      const target = await resolveWorkspacePath(directory, path);
      await writeWorkspaceFile(target.path, bytes, true);
    } finally { release(); }
    return { path, mimeType };
  })();
  inflight.set(key, pending);
  try { return await pending; }
  finally { if (inflight.get(key) === pending) inflight.delete(key); }
}
