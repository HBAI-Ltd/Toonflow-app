import assert from "node:assert/strict";
import { createBrowserRuntime } from "./src/host";
import type { BrowserAction, BrowserStreamEvent } from "./src/protocol";

// ACT: 用内存网页演示真实浏览器调用，不依赖搜索网站、模型服务或已有登录状态。
const runtime = createBrowserRuntime();
const cwd = process.cwd();
const detect = process.argv.includes("--detect");
const executablePath = process.argv.find(argument => argument.startsWith("--executable="))?.slice(13);
type DetectionProfile = {
  kind: string; userAgent: string; webdriver: boolean | null;
  lowEntropy: { brands: { brand: string; version: string }[]; platform: string };
  highEntropy: { architecture: string; bitness: string; platformVersion: string; fullVersionList: { brand: string; version: string }[] };
  geometry?: { inner: number[]; outer: number[]; screen: number[] };
  descriptor?: { own: boolean; getter: string; enumerable: boolean; configurable: boolean };
};
const profiles: DetectionProfile[] = [];
const requests: { path: string; headers: Record<string, string> }[] = [];
let navigationLoads = 0;
const profileScript = `async function report(kind) {
  const data=navigator.userAgentData;
  const highEntropy=data?await data.getHighEntropyValues(['architecture','bitness','formFactors','fullVersionList','model','platformVersion','uaFullVersion','wow64']):null;
  const profile={kind,userAgent:navigator.userAgent,webdriver:navigator.webdriver??null,lowEntropy:data?.toJSON(),highEntropy};
  if(typeof window!=='undefined'){
    profile.geometry={inner:[innerWidth,innerHeight],outer:[outerWidth,outerHeight],screen:[screen.width,screen.height]};
    const descriptor=Object.getOwnPropertyDescriptor(Navigator.prototype,'webdriver');
    profile.descriptor={own:Object.hasOwn(navigator,'webdriver'),getter:descriptor?.get?.toString(),enumerable:descriptor?.enumerable,configurable:descriptor?.configurable};
  }
  await fetch('/detectReport?kind='+encodeURIComponent(kind),{method:'POST',body:JSON.stringify(profile)});
}`;
const pendingNavigation = Promise.withResolvers<void>();
const server = Bun.serve({
  hostname: "127.0.0.1", port: 0,
  async fetch(request): Promise<Response> {
    const address = new URL(request.url);
    const path = address.pathname;
    if (detect && path.startsWith("/detect")) {
      requests.push({ path: path + address.search, headers: Object.fromEntries([...request.headers].filter(([name]) => name === "user-agent" || name.startsWith("sec-ch-"))) });
      const headers = {
        "Content-Type": "text/html; charset=utf-8",
        "Accept-CH": "Sec-CH-UA-Full-Version-List, Sec-CH-UA-Arch, Sec-CH-UA-Bitness, Sec-CH-UA-Platform-Version",
      };
      if (path === "/detectReport") {
        profiles.push(await request.json() as DetectionProfile);
        return new Response("ok");
      }
      if (path === "/detectDedicated.js") return new Response(`${profileScript};report('dedicated');`, { headers: { "Content-Type": "text/javascript" } });
      if (path === "/detectShared.js") return new Response(`${profileScript};onconnect=()=>report('shared');`, { headers: { "Content-Type": "text/javascript" } });
      if (path === "/detectService.js") return new Response(`${profileScript};oninstall=()=>skipWaiting();onactivate=event=>event.waitUntil(clients.claim());onmessage=event=>event.waitUntil(report('service'));`, { headers: { "Content-Type": "text/javascript" } });
      if (path === "/detectIframe" || path === "/detectPopup") return new Response(`<script>${profileScript};report('${path === "/detectIframe" ? "iframe" : "popup"}');</script>`, { headers });
      const kind = address.searchParams.has("newTab") ? "newTab" : "main";
      return new Response(`<button onclick="window.open('/detectPopup','_blank')">Popup</button><script>${profileScript};
        report('${kind}');
        ${kind === "main" ? `new Worker('/detectDedicated.js');new SharedWorker('/detectShared.js');
        navigator.serviceWorker.register('/detectService.js').then(()=>navigator.serviceWorker.ready).then(registration=>registration.active.postMessage('report'));
        const frame=document.createElement('iframe');frame.src='http://localhost:${address.port}/detectIframe';document.body.append(frame);` : ""}
      </script>`, { headers });
    }
    if (path === "/pending") {
      pendingNavigation.resolve();
      return new Promise<Response>(() => {});
    }
    if (path === "/navigation") {
      navigationLoads++;
      return new Response(`<html><head><title>导航 ${address.searchParams.get("step")}</title></head><body>加载次数：${navigationLoads}<a href="#section">页内链接</a><p id="section">目标位置</p></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
    }
    if (path === "/controls") return new Response(`<html><head><title>人工操作示例</title></head><body>
      <button style="position:absolute;left:20px;top:20px;width:120px;height:40px" onpointerenter="record('hover',event)">悬停菜单</button>
      <input type="range" min="0" max="100" value="0" style="position:absolute;left:20px;top:100px;width:240px" oninput="state.range=this.value;render()">
      <input aria-label="人工输入" style="position:absolute;left:20px;top:170px" oninput="state.text=this.value;render()">
      <pre style="position:absolute;top:280px" id="events"></pre>
      <script>
        const state={events:[],range:'0',text:''};
        function render(){document.getElementById('events').textContent='事件：'+JSON.stringify(state)}
        function record(type,event){state.events.push({type,buttons:event.buttons,detail:event.detail,key:event.key,shift:event.shiftKey,ctrl:event.ctrlKey});render()}
        for(const type of ['pointermove','pointerdown','pointerup','click','dblclick','contextmenu','keydown','keyup'])document.addEventListener(type,event=>{if(type==='contextmenu')event.preventDefault();record(type,event)});
        render();
      </script></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    const content = path === "/long" ? `<p>${"正文😀".repeat(5000)}</p>` : `
      <label>搜索<input aria-label="搜索" /></label>
      <button onclick="document.querySelector('output').textContent='结果：'+document.querySelector('input').value; localStorage.setItem('query',document.querySelector('input').value)">搜索</button>
      <output></output><p id="stored"></p>
      <script>document.getElementById('stored').textContent='上次搜索：'+(localStorage.getItem('query')||'无')</script>
      <iframe src="data:text/html,embedded" title="内嵌页面"></iframe>`;
    return new Response(`<html><head><title>浏览器示例</title></head><body>${content}</body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  },
});
const url = `http://127.0.0.1:${server.port}`;
async function execute(action: BrowserAction, owner = "demo", signal?: AbortSignal) {
  const result = await runtime.execute(cwd, owner, action, executablePath ? { executablePath } : {}, signal);
  const text = result.content.find(item => item.type === "text");
  assert(text?.type === "text");
  return JSON.parse(text.text);
}
function findRef(snapshot: string, role: string, name: string) {
  const line = snapshot.split("\n").find(line => line.includes(`${role} ${JSON.stringify(name)}`));
  const ref = line?.match(/\[([^\]]+)\]/)?.[1];
  assert(ref, `快照缺少 ${role} ${name}`);
  return ref;
}
let unsubscribe: (() => void) | undefined;
async function runDetection() {
  await execute({ action: "open", url: `${url}/detect` });
  const waitFor = async (kinds: string[]) => {
    const deadline = Date.now() + 10000;
    while (kinds.some(kind => !profiles.some(profile => profile.kind === kind))) {
      assert(Date.now() < deadline, `未收到检测结果：${kinds.filter(kind => !profiles.some(profile => profile.kind === kind)).join(", ")}`);
      await Bun.sleep(25);
    }
  };
  await waitFor(["main", "iframe", "dedicated", "shared", "service"]);
  const snapshot = await execute({ action: "snapshot", offset: 0 });
  await execute({ action: "click", ref: findRef(snapshot.snapshot, "button", "Popup") });
  await waitFor(["popup"]);
  await execute({ action: "newTab", url: `${url}/detect?newTab=1` });
  await waitFor(["newTab"]);
  // ACT: 独立 Worker、popup 首请求和首脚本几何瞬态仍有边界；逐项报告，不能把风险计为通过。
  const knownLeaks = [
    ...profiles.filter(profile => profile.userAgent.includes("Headless")).map(profile => `${profile.kind}: navigator.userAgent`),
    ...requests.filter(request => request.headers["user-agent"]?.includes("Headless")).map(request => `${request.path}: HTTP User-Agent`),
  ];
  const geometryWarnings = profiles.filter(profile => profile.geometry?.outer.some(value => value === 0)).map(profile => `${profile.kind}: 首脚本 outerWidth/outerHeight 为 0`);
  console.log(JSON.stringify({ profiles, requests, knownLeaks, geometryWarnings }, null, 2));
  const main = profiles.find(profile => profile.kind === "main")!;
  for (const kind of ["main", "iframe", "dedicated", "newTab"]) {
    const profile = profiles.find(profile => profile.kind === kind)!;
    assert(!profile.userAgent.includes("Headless"), `${kind} 泄漏 Headless UA`);
    assert(profile.highEntropy.architecture && profile.highEntropy.bitness && profile.highEntropy.platformVersion);
    assert(profile.highEntropy.fullVersionList.length > 0, `${kind} 缺少完整 Client Hints`);
    assert.deepEqual(profile.lowEntropy, main.lowEntropy, `${kind} 低熵 Client Hints 与主页面不一致`);
    assert.deepEqual(profile.highEntropy, main.highEntropy, `${kind} 高熵 Client Hints 与主页面不一致`);
    if (kind === "dedicated") continue;
    assert.equal(profile.webdriver, false);
    assert.equal(profile.descriptor?.own, false);
    assert.match(profile.descriptor!.getter, /\[native code\]/);
    assert.deepEqual(profile.geometry?.inner, kind === "iframe" ? [300, 150] : [1280, 800]);
    assert.deepEqual(profile.geometry?.screen, [1280, 800]);
  }
  for (const path of ["/detect", "/detect?newTab=1", "/detectIframe", "/detectDedicated.js"]) {
    const request = requests.find(request => request.path === path)!;
    assert(request, `缺少首请求：${path}`);
    assert(!request.headers["user-agent"].includes("Headless"), `${path} 首请求泄漏 Headless UA`);
    if (!path.endsWith(".js")) assert(request.headers["sec-ch-ua"], `${path} 缺少 Client Hints`);
  }
  console.log(`受保障上下文的 UA、Client Hints、webdriver、原生描述符检查通过；检测发现 ${knownLeaks.length} 项 UA 泄漏、${geometryWarnings.length} 项几何风险，不代表完全不可检测。`);
}
async function runDemo() {
  const opened = await execute({ action: "open", url });
  const sessionId = opened.browserSessionId;
  const frame = Promise.withResolvers<BrowserStreamEvent>();
  unsubscribe = runtime.subscribe(cwd, sessionId, event => {
    if (event.type === "frame") frame.resolve(event);
    if (event.type === "error") frame.reject(new Error(event.message));
  });
  const snapshot = await execute({ action: "snapshot", offset: 0 });
  const inputRef = findRef(snapshot.snapshot, "textbox", "搜索");
  await execute({ action: "type", ref: inputRef, text: "Toonflow" });
  await execute({ action: "click", ref: findRef(snapshot.snapshot, "button", "搜索") });
  assert.match((await execute({ action: "read", offset: 0 })).text, /结果：Toonflow/);
  const received = await Promise.race([frame.promise, Bun.sleep(10000).then(() => { throw new Error("没有收到实时画面"); })]);
  assert(received.type === "frame" && received.data.length > 100 && received.width > 0);
  await execute({ action: "navigate", url });
  await assert.rejects(execute({ action: "type", ref: inputRef, text: "旧引用" }), /引用已失效/);
  assert.match((await execute({ action: "read", offset: 0 })).text, /上次搜索：Toonflow/);
  await execute({ action: "open", url }, "anotherAgent");
  assert.match((await execute({ action: "read", offset: 0 }, "anotherAgent")).text, /上次搜索：无/);
  await assert.rejects(execute({ action: "read", offset: 0, browserSessionId: sessionId }, "anotherAgent"), /不属于/);
  const unauthorizedController = new AbortController();
  const unauthorized = execute({ action: "read", offset: 0, browserSessionId: sessionId }, "anotherAgent", unauthorizedController.signal);
  const unauthorizedRejected = assert.rejects(unauthorized);
  unauthorizedController.abort();
  await unauthorizedRejected;
  assert(runtime.getSession(cwd, sessionId), "取消未授权操作不能关闭其他对话的会话");
  assert.equal(runtime.getSession(`${cwd}/anotherWorkspace`, sessionId), undefined);
  const nextTab = await execute({ action: "newTab", url: `${url}/long` });
  const first = await execute({ action: "read", offset: 0 });
  const second = await execute({ action: "read", offset: first.nextOffset });
  assert.equal(first.text.length + second.text.length, first.total);
  assert.equal(second.nextOffset, null);
  const screenshot = await runtime.execute(cwd, "demo", { action: "screenshot" }, {});
  assert(screenshot.content.some(item => item.type === "image" && item.data.length > 100));
  assert.equal((await execute({ action: "tabs", offset: 0 })).tabs.length, 2);
  await execute({ action: "selectTab", tabId: opened.tabId });
  assert.equal((await execute({ action: "closeTab", tabId: nextTab.tabId })).tabId, opened.tabId);
  await execute({ action: "navigate", url: `${url}/controls` });
  const manualInput = (input: Record<string, unknown>, tabId = opened.tabId) => runtime.input(cwd, sessionId, tabId, input);
  const controls = async () => JSON.parse((await execute({ action: "read", offset: 0 })).text.split("事件：")[1]);
  const menu = await execute({ action: "snapshot", offset: 0 });
  await execute({ action: "hover", ref: findRef(menu.snapshot, "button", "悬停菜单") });
  assert((await controls()).events.some((event: { type: string }) => event.type === "hover"), "Agent hover 必须触发真实悬停");
  await manualInput({ type: "mouse", event: "move", x: 400, y: 50 });
  await manualInput({ type: "mouse", event: "move", x: 50, y: 40 });
  assert.equal((await controls()).events.filter((event: { type: string }) => event.type === "hover").length, 2);
  await manualInput({ type: "mouse", event: "down", x: 30, y: 110, button: "left", clickCount: 1 });
  await manualInput({ type: "mouse", event: "move", x: 230, y: 110 });
  await manualInput({ type: "mouse", event: "up", x: 230, y: 110, button: "left", clickCount: 1 });
  assert(Number((await controls()).range) > 75, "按下、移动、抬起必须能够拖动原生滑块");
  for (const clickCount of [1, 2]) {
    await manualInput({ type: "mouse", event: "down", x: 50, y: 40, button: "left", clickCount });
    await manualInput({ type: "mouse", event: "up", x: 50, y: 40, button: "left", clickCount });
  }
  assert.equal((await controls()).events.filter((event: { type: string }) => event.type === "dblclick").length, 1);
  await manualInput({ type: "click", x: 50, y: 40, button: "right", modifiers: ["Control"] });
  assert((await controls()).events.some((event: { type: string; ctrl: boolean }) => event.type === "contextmenu" && event.ctrl));
  await manualInput({ type: "key", event: "down", key: "Shift" });
  await manualInput({ type: "mouse", event: "down", x: 450, y: 50, button: "left" });
  await manualInput({ type: "release" });
  await manualInput({ type: "mouse", event: "move", x: 460, y: 50 });
  const released = (await controls()).events.at(-1);
  assert.equal(released.buttons, 0);
  assert.equal(released.shift, false);
  await manualInput({ type: "click", x: 50, y: 180 });
  await manualInput({ type: "text", text: "中文输入" });
  assert.equal((await controls()).text, "中文输入");
  const switched = await execute({ action: "newTab", url: `${url}/controls` });
  await assert.rejects(manualInput({ type: "mouse", event: "move", x: 50, y: 40 }), /标签页已切换/);
  await manualInput({ type: "release" });
  await execute({ action: "closeTab", tabId: switched.tabId });
  await manualInput({ type: "key", event: "down", key: "Shift" });
  unsubscribe();
  unsubscribe = undefined;
  await manualInput({ type: "mouse", event: "move", x: 470, y: 50 });
  assert.equal((await controls()).events.at(-1).shift, false, "停止观看必须释放人工按键");
  const firstAddress = `${url}/navigation?step=1`;
  const secondAddress = `${url}/navigation?step=2`;
  assert.equal((await manualInput({ type: "navigate", url: firstAddress })).url, firstAddress);
  const secondPage = await manualInput({ type: "navigate", url: secondAddress });
  assert.equal(secondPage.url, secondAddress);
  assert.equal(secondPage.canGoBack, true);
  assert.equal(secondPage.canGoForward, false);
  const back = await manualInput({ type: "back" });
  assert.equal(back.url, firstAddress);
  assert.equal(back.canGoForward, true);
  assert.equal((await manualInput({ type: "forward" })).url, secondAddress);
  const loadsBeforeReload = navigationLoads;
  assert.equal((await manualInput({ type: "reload" })).url, secondAddress);
  assert.equal(navigationLoads, loadsBeforeReload + 1, "刷新必须重新请求当前网页");
  await manualInput({ type: "navigate", url: `${secondAddress}#section` });
  assert.equal((await manualInput({ type: "back" })).url, secondAddress, "返回应覆盖同文档历史");
  assert.equal((await manualInput({ type: "forward" })).url, `${secondAddress}#section`);
  for (const address of ["javascript:alert(1)", "chrome-error://chromewebdata/", "chrome://version", "file:///C:/Windows/win.ini", "data:text/html,test"]) {
    await assert.rejects(manualInput({ type: "navigate", url: address }));
  }
  assert.equal(runtime.getSession(cwd, sessionId)?.url, `${secondAddress}#section`, "非法地址不能改变页面");
  const failedServer = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response("unused") });
  const failedAddress = `http://127.0.0.1:${failedServer.port}/connectionFailure`;
  await failedServer.stop(true);
  await assert.rejects(manualInput({ type: "navigate", url: failedAddress }), /ERR_CONNECTION_REFUSED/);
  const errorPageDeadline = Date.now() + 5000;
  while (runtime.getSession(cwd, sessionId)?.url !== failedAddress && Date.now() < errorPageDeadline) await Bun.sleep(25);
  assert.equal(runtime.getSession(cwd, sessionId)?.status, "running", "访问失败不能关闭浏览器会话");
  assert.equal(runtime.getSession(cwd, sessionId)?.url, failedAddress, "错误页应保留访问地址");
  assert.equal((await manualInput({ type: "navigate", url: secondAddress })).url, secondAddress, "访问失败后应能修改地址重试");
  const controller = new AbortController();
  const navigating = execute({ action: "navigate", url: `${url}/pending` }, "demo", controller.signal);
  const cancelled = assert.rejects(navigating);
  await pendingNavigation.promise;
  controller.abort();
  await cancelled;
  assert.equal(runtime.getSession(cwd, sessionId), undefined);
  const reopened = await execute({ action: "open", url });
  assert.notEqual(reopened.browserSessionId, sessionId);
  assert.equal((await execute({ action: "close" })).status, "closed");
  console.log("浏览器示例通过：输入、点击、正文、分页、截图、画面、标签页、对话隔离、旧引用、取消清理，以及悬停、拖拽、双击、右键、修饰键、失焦释放、地址导航、返回、前进、刷新和访问失败后恢复。");
}
try {
  if (detect) await runDetection();
  else await runDemo();
} finally {
  unsubscribe?.();
  await runtime.closeAll();
  await server.stop(true);
}
