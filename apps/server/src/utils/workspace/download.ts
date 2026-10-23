import { lookup } from "node:dns/promises";
import { request, type ClientRequest, type IncomingMessage } from "node:http";
import { request as requestSecure } from "node:https";
import { BlockList, isIP } from "node:net";
import { t } from "@/lib/i18n";

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

export function remoteAddress(value: string, httpsOnly = false) {
  let url: URL;
  try { url = new URL(value); } catch { return invalid("下载地址无效，请使用完整的 HTTP/HTTPS 地址"); }
  if (!(httpsOnly ? ["https:"] : ["http:", "https:"]).includes(url.protocol) || url.username || url.password) {
    invalid(httpsOnly ? "项目下载仅支持不含账号密码的 HTTPS 地址" : "仅支持不含账号密码的 HTTP/HTTPS 地址");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && !isPublicAddress(host)) invalid("不能下载本机、内网或特殊网络地址的文件", 403);
  url.hash = "";
  return url;
}

function requestFile(url: URL, signal: AbortSignal, accept: string) {
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
        if (!response.ok) invalid("无法解析下载文件的真实公网地址，请稍后重试", 502);
        const answer = await response.json() as { Status?: number; Answer?: { type?: number; data?: unknown }[] };
        addresses = answer.Status === 0 && Array.isArray(answer.Answer) ? answer.Answer.filter(item => item.type === 1 && typeof item.data === "string").map(item => ({ address: item.data as string, family: 4 })) : [];
        signal.throwIfAborted();
      }
      if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) invalid("不能下载解析到本机、内网或特殊网络地址的文件", 403);
      const address = addresses[0];
      const connection = new URL(url);
      connection.hostname = address.family === 6 ? `[${address.address}]` : address.address;
      // ACT: 固定已校验 IP，保留原 Host 和 TLS 证书域名；Bun 的 request signal 不保证及时结束，改为显式销毁并 reject。
      outgoing = (url.protocol === "https:" ? requestSecure : request)(connection, {
        method: "GET", agent: false, servername: hostname, headers: { Host: url.host, Accept: accept },
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

export async function downloadPublicFile(value: string, options: { signal: AbortSignal; maxBytes: number; label: string; httpsOnly?: boolean; accept?: string; onContentType?: (value: string | undefined) => void }) {
  const { signal, maxBytes, label, httpsOnly = false, accept = "*/*", onContentType } = options;
  let url = remoteAddress(value, httpsOnly);
  for (let redirects = 0; redirects <= 5; redirects++) {
    signal.throwIfAborted();
    const response = await requestFile(url, signal, accept);
    if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0)) {
      const location = response.headers.location;
      response.destroy();
      if (!location || redirects === 5) invalid("下载重定向无效或超过 5 次，请使用文件直接地址", 502);
      url = remoteAddress(new URL(location, url).href, httpsOnly);
      continue;
    }
    if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
      response.destroy();
      invalid(t`下载${label}失败（HTTP ${response.statusCode ?? 0}），链接可能失效或需要登录`, 502);
    }
    const contentType = response.headers["content-type"];
    onContentType?.(typeof contentType === "string" ? contentType : contentType?.[0]);
    const tooLarge = () => invalid(t`${label}不能超过 ${maxBytes / 1024 / 1024} MB`, 413);
    if (Number(response.headers["content-length"]) > maxBytes) { response.destroy(); tooLarge(); }
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of response) {
      signal.throwIfAborted();
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += bytes.length;
      if (size > maxBytes) { response.destroy(); tooLarge(); }
      chunks.push(bytes);
    }
    signal.throwIfAborted();
    return Buffer.concat(chunks, size);
  }
  return invalid("下载重定向无效", 502);
}
