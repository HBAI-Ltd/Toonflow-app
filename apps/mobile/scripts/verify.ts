import assert from "node:assert/strict";
import { resolve, relative, isAbsolute } from "node:path";
import { mkdir, mkdtemp, readFile, realpath, rm } from "@toonflow/file";
import { runInNewContext } from "node:vm";
import { createServer } from "node:http";
import { once } from "node:events";
import config from "../../../electrobun.config";

if (Bun.semver.order(Bun.version, "1.4.2") < 0) throw new Error("移动端验证需使用 Bun 1.4.2 或更新版本，与 APK 运行时保持一致；旧版本有请求体读完后丢失断连通知的问题。");

// ACT: 显式检查真实构建产物，不连接模型供应商，不读取已有用户数据。
const buildRoot = resolve(import.meta.dirname, "../../../build/mobile");
await mkdir(buildRoot, { recursive: true });
const directory = await mkdtemp(resolve(buildRoot, "verification"));
const child = Bun.spawn([process.execPath, resolve(buildRoot, "staging/assets/payload/server.js")], {
  env: { ...process.env, appVersion: undefined, TOONFLOW_MOBILE_DATA_DIR: directory, TMPDIR: directory },
  stdout: "pipe", stderr: "pipe",
});
const errors = new Response(child.stderr).text();
let passed = false;
const timeout = setTimeout(() => child.kill(), 60000);
let remoteChild: ReturnType<typeof Bun.spawn> | undefined;
const deviceToken = "verificationDeviceToken".repeat(3);
let paired = false;
let heartbeatAccepted = true;
let remoteAppVersion: unknown = "0.0.0";
let upstreamClosed: (() => void) | undefined;
const upstream = createServer(async (request, response) => {
  const origin = `http://${request.headers.host}`;
  const url = new URL(request.url!, origin);
  if (url.pathname === "/api/mobileLink/pair") {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const body = JSON.parse(Buffer.concat(chunks).toString());
    assert.ok(body.code === "verificationPairCode".repeat(3) || body.code === "000012345678");
    response.writeHead(paired ? 403 : 200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(paired ? { code: 403, message: "二维码已使用" } : { code: 200, data: { deviceToken, name: "Verification computer", appVersion: remoteAppVersion } }));
    paired = true;
    return;
  }
  assert.equal(request.headers["x-toonflow-device-token"], deviceToken);
  assert.equal(request.headers.cookie, undefined, "本机会话不得泄露给对端");
  if (url.pathname === "/api/mobileLink/heartbeat") {
    assert.equal(request.headers["x-toonflow-app-version"], config.app.version, "心跳必须携带本机版本");
    response.writeHead(heartbeatAccepted ? 200 : 401, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ code: heartbeatAccepted ? 200 : 401, data: { online: heartbeatAccepted, appVersion: remoteAppVersion } }));
    return;
  }
  assert.equal(request.headers.origin, origin);
  assert.equal(request.headers.referer, `${origin}/`);
  assert.equal(request.headers["x-toonflow-desktop"], undefined);
  if (url.pathname === "/stream") {
    response.writeHead(200, { "Content-Type": "application/x-ndjson" });
    response.write('{"chunk":"first"}\n');
    response.on("close", () => upstreamClosed?.());
    request.socket.on("close", () => upstreamClosed?.());
    return;
  }
  if (url.pathname === "/redirect") { response.writeHead(302, { Location: "https://example.invalid/" }); response.end(); return; }
  if (url.pathname === "/invalidRedirect") { response.writeHead(302, { Location: "http://[" }); response.end(); return; }
  if (url.pathname === "/bytes") {
    assert.equal(request.headers.range, "bytes=2-4");
    response.writeHead(206, { "Content-Range": "bytes 2-4/6", "Content-Type": "application/octet-stream" }); response.end("cde"); return;
  }
  if (url.pathname === "/upload") {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    response.end(Buffer.concat(chunks)); return;
  }
  if (url.pathname === "/") { response.end(`<div id="app">remote ${url.searchParams.get("remote")}</div>`); return; }
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify({ code: 200, data: { source: "remote", authorization: request.headers.authorization } }));
});
upstream.listen(0, "127.0.0.1");
await once(upstream, "listening");
const upstreamAddress = upstream.address();
assert.ok(upstreamAddress && typeof upstreamAddress !== "string");
const remoteUrl = `http://127.0.0.1:${upstreamAddress.port}`;

try {
  let output = "";
  let startupUrl = "";
  for await (const chunk of child.stdout) {
    output += new TextDecoder().decode(chunk);
    const match = output.match(/TOONFLOW_MOBILE_URL=(http:\/\/127\.0\.0\.1:\d+\/\?token=[\w-]+)\r?\n/);
    if (match) { startupUrl = match[1]!; break; }
  }
  assert.ok(startupUrl, "移动服务未启动");
  const origin = new URL(startupUrl).origin;
  assert.equal((await fetch(`${origin}/api/settings/get`)).status, 401, "未授权请求必须拒绝");
  assert.equal((await fetch(`${origin}/?mobile=1&probe=1`)).status, 401, "预检页面也必须鉴权");
  const session = await fetch(startupUrl, { redirect: "manual" });
  assert.equal(session.status, 302);
  assert.equal(session.headers.get("location"), "/?mobile=1");
  const cookie = session.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  assert.match(session.headers.get("set-cookie")!, /HttpOnly/i);
  const headers = { Cookie: cookie, Origin: origin, Referer: `${origin}/`, "x-toonflow-workspace": "1" };
  const request = (path: string, init: RequestInit = {}) => fetch(`${origin}${path}`, { ...init, headers: { ...headers, ...init.headers } });
  const probeSession = await fetch(`${startupUrl}&probe=1`, { redirect: "manual" });
  assert.equal(probeSession.headers.get("location"), "/?mobile=1&probe=1");
  const x5Session = await fetch(`${startupUrl}&engine=x5`, { redirect: "manual" });
  assert.equal(x5Session.headers.get("location"), "/?mobile=1&engine=x5");
  assert.equal(x5Session.headers.get("set-cookie")?.split(";")[0], cookie, "X5 必须能够独立换取会话 Cookie");
  const probeHtml = await (await request("/?mobile=1&probe=1")).text();
  assert.doesNotMatch(probeHtml, /id="app"|src=/, "预检不能加载业务页面");
  const probeScripts = [...probeHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]!);
  assert.equal(probeScripts.length, 2, "缺少旧内核基线或能力预检脚本");
  const probeWindow = { toonflowBrowserProbe: undefined as { missing: string[]; userAgent: string } | undefined };
  const probeContext = { window: probeWindow, navigator: { userAgent: "verification" }, Map: {}, crypto: {}, CSS: { supports: () => false } };
  runInNewContext(probeScripts[0]!, probeContext);
  assert.equal(probeWindow.toonflowBrowserProbe?.missing[0], "Browser capability probe", "现代检测脚本无法解析时必须仍报告能力缺失");
  runInNewContext(probeScripts[1]!, probeContext);
  assert.equal(probeWindow.toonflowBrowserProbe?.userAgent, "verification");
  for (const feature of ["Map.groupBy", "crypto.randomUUID", "CSS color-mix"]) {
    assert.ok(probeWindow.toonflowBrowserProbe?.missing.includes(feature), `预检未报告 ${feature}`);
  }
  const json = async (path: string, init?: RequestInit) => {
    const response = await request(path, init);
    assert.equal(response.status, 200, `${path} 响应失败`);
    return response.json();
  };
  assert.equal((await request("/api/settings/get", { headers: { Origin: "https://example.invalid" } })).status, 403);
  assert.match(await (await request("/?mobile=1")).text(), /id="app"/, "必须加载正式 Vue 页面");
  assert.equal((await json("/api/settings/get")).code, 200);
  for (const [path, key] of [["/api/nodes/get", "nodes"], ["/api/tools/get", "tools"], ["/api/providers/media/list", "providers"]]) {
    const result = await json(path!);
    const list = Array.isArray(result.data) ? result.data : result.data?.[key!];
    assert.ok(Array.isArray(list) && list.length > 0, `${path} 缺少内置资源`);
    assert.ok(list.every(item => !item.error), `${path} 含加载失败的插件`);
  }
  const root = (await json("/api/workspaces/list")).data.absolutePath;
  const query = new URLSearchParams({ directory: root, path: "mobileVerification.txt", exclusive: "true" });
  const text = "Toonflow Android 文件读写验证";
  await json(`/api/workspaces/files/write?${query}`, { method: "PUT", headers: { "Content-Type": "application/octet-stream" }, body: text });
  assert.equal(await (await request(`/api/workspaces/files/read?${query}`)).text(), text);
  assert.equal((await request(`/api/workspaces/files/write?${query}`, { method: "PUT", headers: { "Content-Type": "application/octet-stream" }, body: "不可覆盖" })).status, 409);
  assert.equal((await request(`/api/workspaces/files/read?${new URLSearchParams({ directory: root, path: "../settings.json" })}`)).status, 400);
  const exported = await json("/api/mobile/exports", { method: "POST", headers: { "Content-Type": "application/octet-stream" }, body: text });
  assert.equal(await (await request(exported.url)).text(), text);
  assert.equal((await request(exported.url, { method: "DELETE" })).status, 204);
  assert.equal((await request(exported.url)).status, 404);
  assert.deepEqual(await json("/api/connection/connection"), { mode: "local", appVersion: config.app.version }, "实际构建产物必须保留本机版本，不能依赖运行时环境变量");
  const qrCode = JSON.stringify({ type: "toonflowMobile", version: 1, name: "Verification computer", url: remoteUrl, code: "verificationPairCode".repeat(3) });
  assert.equal((await request("/api/connection/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qrCode: "invalid" }) })).status, 400);
  assert.equal((await request("/api/connection/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qrCode: qrCode.replace(remoteUrl, "http://10.example.com") }) })).status, 400);
  for (const body of [{ url: remoteUrl, code: "123" }, { url: "http://10.example.com", code: "000012345678" }, { url: `${remoteUrl}/path`, code: "000012345678" }]) {
    assert.equal((await request("/api/connection/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).status, 400);
  }
  const connected = await json("/api/connection/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qrCode }) });
  assert.equal(connected.mode, "remote");
  assert.equal(connected.restart, "mobile");
  assert.equal(connected.deviceToken, undefined, "设备密钥不能交给网页");
  assert.equal(JSON.parse(await readFile(resolve(directory, "mobileConnection.json"), "utf8")).appVersion, remoteAppVersion, "配对必须保存远端版本");
  assert.equal((await json("/api/connection/connection")).mode, "local", "切换不能让旧页面请求落到新后端");
  assert.equal((await request("/api/connection/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qrCode }) })).status, 403);
  paired = false;
  const manual = await json("/api/connection/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: remoteUrl.replace("http://", ""), code: "000012345678" }) });
  assert.equal(manual.url, remoteUrl, "裸局域网地址须保留端口并使用 HTTP");
  assert.equal(manual.mode, "remote");
  child.kill();
  await child.exited;
  remoteChild = Bun.spawn([process.execPath, resolve(buildRoot, "staging/assets/payload/server.js")], {
    env: { ...process.env, appVersion: undefined, TOONFLOW_MOBILE_DATA_DIR: directory, TMPDIR: directory }, stdout: "pipe", stderr: "inherit",
  });
  let remoteStartup = "";
  let remoteOutput = "";
  for await (const chunk of remoteChild.stdout as ReadableStream<Uint8Array>) {
    remoteOutput += new TextDecoder().decode(chunk);
    const match = remoteOutput.match(/TOONFLOW_MOBILE_URL=(http:\/\/127\.0\.0\.1:\d+\/\?token=[\w-]+)\r?\n/);
    if (match) { remoteStartup = match[1]!; break; }
  }
  assert.ok(remoteStartup);
  const remoteOrigin = new URL(remoteStartup).origin;
  const remoteSession = await fetch(remoteStartup, { redirect: "manual" });
  assert.equal(remoteSession.headers.get("location"), "/?mobile=1&remote=1");
  const remoteHeaders = { ...headers, Cookie: remoteSession.headers.get("set-cookie")!.split(";")[0]!, Origin: remoteOrigin, Referer: `${remoteOrigin}/` };
  const remoteRequest = (path: string, init: RequestInit = {}) => fetch(`${remoteOrigin}${path}`, { ...init, headers: { ...remoteHeaders, ...init.headers } });
  assert.equal((await (await remoteRequest("/api/connection/connection")).json()).mode, "remote");
  async function waitForConnection(online: boolean, expectedVersion: string | undefined) {
    for (let attempt = 0; attempt < 40; attempt++) {
      const current = await (await remoteRequest("/api/connection/connection")).json();
      assert.equal(current.deviceToken, undefined, "连接状态不能泄露凭据");
      assert.equal(current.appVersion, config.app.version, "远程模式必须保留本机版本");
      if (current.online === online && current.remoteAppVersion === expectedVersion) return;
      await Bun.sleep(200);
    }
    assert.fail(`手机实际连接状态未更新为 online=${online}, remoteAppVersion=${expectedVersion}`);
  }
  await waitForConnection(true, "0.0.0");
  remoteAppVersion = config.app.version;
  await waitForConnection(true, config.app.version);
  remoteAppVersion = undefined;
  await waitForConnection(true, undefined);
  remoteAppVersion = config.app.version;
  await waitForConnection(true, config.app.version);
  remoteAppVersion = "invalid version\n";
  await waitForConnection(true, undefined);
  remoteAppVersion = "0.0.0";
  await waitForConnection(true, "0.0.0");
  heartbeatAccepted = false;
  await waitForConnection(false, "0.0.0");
  heartbeatAccepted = true;
  await waitForConnection(true, "0.0.0");
  const systemEntry = await remoteRequest("/?mobile=1", { redirect: "manual" });
  assert.equal(systemEntry.headers.get("location"), "/?mobile=1&remote=1", "系统预检通过后的直接入口也必须标记远程模式");
  assert.match(await (await remoteRequest("/?mobile=1&remote=1")).text(), /remote 1/);
  assert.equal((await (await remoteRequest("/api/settings/get", { headers: { Authorization: "Bearer mcpVerification", "x-toonflow-desktop": "1" } })).json()).data.authorization, "Bearer mcpVerification");
  const ranged = await remoteRequest("/bytes", { headers: { Range: "bytes=2-4" } });
  assert.equal(ranged.status, 206); assert.equal(ranged.headers.get("content-range"), "bytes 2-4/6"); assert.equal(await ranged.text(), "cde");
  assert.equal(await (await remoteRequest("/upload", { method: "PUT", headers: { "Content-Type": "application/octet-stream" }, body: text })).text(), text);
  const stopped = new Promise<void>(resolve => { upstreamClosed = resolve; });
  const streamController = new AbortController();
  const streamed = await remoteRequest("/stream", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", signal: streamController.signal });
  const reader = streamed.body!.getReader();
  const first = await Promise.race([reader.read(), new Promise<never>((_, reject) => setTimeout(() => reject(Error("流式响应被缓冲")), 2000).unref())]);
  assert.match(new TextDecoder().decode(first.value), /first/);
  streamController.abort();
  await reader.cancel().catch(() => {});
  await Promise.race([stopped, new Promise<never>((_, reject) => setTimeout(() => reject(Error("取消未传递给对端")), 2000).unref())]);
  assert.equal((await remoteRequest("/redirect")).status, 502, "不得带凭据跟随外部跳转");
  assert.equal((await remoteRequest("/invalidRedirect")).status, 502, "非法跳转不能让网关退出");
  const remoteExport = await (await remoteRequest("/api/mobile/exports", { method: "POST", headers: { "Content-Type": "application/octet-stream" }, body: text })).json();
  assert.equal(await (await remoteRequest(remoteExport.url)).text(), text, "远程模式仍须保留手机导出");
  upstream.closeAllConnections();
  await new Promise<void>(resolve => upstream.close(() => resolve()));
  await waitForConnection(false, "0.0.0");
  assert.match(await (await remoteRequest("/?mobile=1&remote=1")).text(), /断开并独立运行/, "离线页必须保留恢复入口");
  assert.equal((await (await remoteRequest("/api/connection/disconnect", { method: "POST" })).json()).mode, "local");
  assert.equal((await (await remoteRequest("/api/connection/connection")).json()).mode, "remote", "切回本机也必须等待原生重启隔离旧请求");
  passed = true;
  console.log("通过：能力预检、真实页面、会话鉴权、内置资源、工作区边界、无时间限制扫码配对/重启隔离、本机版本固化/远端版本更新与缺失校验、在线/拒绝授权/断线状态、远程上传/Range/流与取消、离线恢复、本地导出。Android 原生交互仍需设备验证。");
} finally {
  clearTimeout(timeout);
  child.kill();
  await child.exited;
  remoteChild?.kill();
  if (remoteChild) await remoteChild.exited;
  upstream.closeAllConnections();
  upstream.close();
  if (!passed) console.error((await errors).slice(-2000));
  const offset = relative(await realpath(buildRoot), await realpath(directory));
  assert.ok(offset.startsWith("verification") && !offset.includes("..") && !isAbsolute(offset));
  await rm(directory, { recursive: true });
}
