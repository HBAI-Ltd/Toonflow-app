import { access, constants, existsSync, stat } from "@toonflow/file";
import { delimiter, isAbsolute, join, resolve } from "node:path";
import { homedir } from "node:os";
import type { ChildProcess } from "node:child_process";
import puppeteer, { type Browser, type BrowserContext, type CDPSession, type ElementHandle, type KeyInput, type Page, type Protocol, type SerializedAXNode } from "puppeteer-core";
import type { ToolDefinition } from "@toonflow/tools-scaffold/runtime";
import { browserActionSchema, browserConfigSchema, browserInputSchema, type BrowserAction, type BrowserSessionState, type BrowserStreamEvent } from "./protocol";

type ToolResult = Awaited<ReturnType<ToolDefinition["execute"]>>;
type ToolUpdate = Parameters<ToolDefinition["execute"]>[3];
type FrameEvent = Extract<BrowserStreamEvent, { type: "frame" }>;
type Tab = { id: string; page: Page; navigationVersion: number; inputVersion: number; inputKeys: Set<KeyInput>; inputButtons: Set<"left" | "right" | "middle"> };
type Subscriber = { listener: (event: BrowserStreamEvent) => void; frame?: FrameEvent; scheduled: boolean };
type BrowserSession = {
  cwd: string;
  ownerKey: string;
  browser: Browser;
  context: BrowserContext;
  state: BrowserSessionState;
  tabs: Map<string, Tab>;
  pages: Map<Page, Promise<Tab>>;
  refs: Map<string, ElementHandle>;
  snapshot: { node: SerializedAXNode; depth: number }[];
  snapshotVersion: number;
  queue: Promise<void>;
  subscribers: Set<Subscriber>;
  frame?: FrameEvent;
  stream?: { tabId: string; client: CDPSession };
  streamQueue: Promise<void>;
  closed: boolean;
  closing?: Promise<void>;
};

function isWebUrl(value: string) {
  if (value === "about:blank") return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

function isBrowserPageUrl(value: string) {
  // Chromium 为失败的 HTTP 导航生成此错误页；输入地址与导航请求仍仅允许 isWebUrl。
  return isWebUrl(value) || value === "chrome-error://chromewebdata/";
}

async function findExecutable(configured: string) {
  if (configured && !isAbsolute(configured)) throw new Error("executablePath 必须是浏览器程序的绝对路径");
  // Electrobun 启动器修改环境变量后，Bun Worker 按原始大小写保存 Windows 环境变量。
  const env = process.platform === "win32"
    ? Object.fromEntries(Object.entries(process.env).map(([key, value]) => [key.toUpperCase(), value])) : process.env;
  const candidates = configured ? [configured] : process.platform === "win32"
    ? [env["PROGRAMFILES(X86)"], env.PROGRAMFILES, env.LOCALAPPDATA].filter(Boolean).flatMap(root => [
      join(root!, "Microsoft", "Edge", "Application", "msedge.exe"),
      join(root!, "Google", "Chrome", "Application", "chrome.exe"),
      join(root!, "Chromium", "Application", "chrome.exe"),
    ])
    : process.platform === "darwin"
      ? ["/Applications", join(homedir(), "Applications")].flatMap(root => [
        join(root, "Google Chrome.app", "Contents", "MacOS", "Google Chrome"),
        join(root, "Microsoft Edge.app", "Contents", "MacOS", "Microsoft Edge"),
        join(root, "Chromium.app", "Contents", "MacOS", "Chromium"),
      ])
      : (process.env.PATH ?? "").split(delimiter).filter(Boolean).flatMap(root => ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge", "microsoft-edge-stable"].map(name => join(root, name)));
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    if (!(await stat(path)).isFile()) continue;
    try { await access(path, process.platform === "win32" ? constants.F_OK : constants.X_OK); return path; }
    catch { /* 尝试下一个已安装浏览器。 */ }
  }
  throw new Error(configured ? "浏览器程序不存在或不可执行，请检查 executablePath" : "未找到 Chrome、Chromium 或 Edge，请先安装浏览器，或在工具配置中填写 executablePath");
}

async function pressKey(page: Page, key: string, signal: AbortSignal) {
  const aliases: Record<string, string> = { Ctrl: "Control", Cmd: "Meta", Command: "Meta" };
  const keys = (key === "+" ? [key] : key.split("+")).map(value => aliases[value] ?? value);
  const last = keys.pop();
  if (!last || keys.some(value => !["Control", "Alt", "Shift", "Meta"].includes(value))) throw Object.assign(new Error("按键格式无效，例如 Enter 或 Control+A"), { status: 400 });
  try {
    for (const value of keys) { signal.throwIfAborted(); await page.keyboard.down(value as KeyInput); }
    signal.throwIfAborted();
    await page.keyboard.press(last as KeyInput);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unknown key:")) throw Object.assign(new Error("不支持此按键，请使用 Enter、Backspace、方向键或 Control+A 等组合"), { status: 400 });
    throw error;
  } finally { for (const value of keys.reverse()) await page.keyboard.up(value as KeyInput).catch(() => {}); }
}

async function readUserAgent(browser: Browser) {
  const page = await browser.newPage();
  try {
    // ACT: 从浏览器自身的可信页面读取真实客户端提示，空白页拿不到这些信息；不访问外站或硬编码版本、平台。
    await page.goto("chrome://version/", { waitUntil: "domcontentloaded" });
    return await page.evaluate(async () => {
      const data = (navigator as Navigator & {
        userAgentData?: { getHighEntropyValues(hints: string[]): Promise<Protocol.Emulation.UserAgentMetadata & { uaFullVersion?: string }> };
      }).userAgentData;
      if (!data) throw new Error("无法读取浏览器客户端信息，请升级本机 Chrome 或 Edge");
      const { uaFullVersion, ...metadata } = await data.getHighEntropyValues([
        "architecture", "bitness", "formFactors", "fullVersionList", "model", "platformVersion", "uaFullVersion", "wow64",
      ]);
      return { userAgent: navigator.userAgent.replace("HeadlessChrome/", "Chrome/"), userAgentMetadata: { ...metadata, fullVersion: uaFullVersion } };
    });
  } finally { await page.close(); }
}

export function createBrowserRuntime() {
  const browsers = new Map<string, Promise<Browser>>();
  const userAgents = new WeakMap<Browser, Awaited<ReturnType<typeof readUserAgent>>>();
  const processes = new Set<ChildProcess>();
  const sessions = new Map<string, BrowserSession>();
  const owners = new Map<string, Promise<BrowserSession>>();
  let shuttingDown = false;

  process.once("exit", () => {
    for (const child of processes) if (child.exitCode === null && !child.killed) child.kill("SIGKILL");
  });

  function emit(session: BrowserSession, event: BrowserStreamEvent) {
    for (const subscriber of session.subscribers) {
      if (event.type !== "frame") {
        try { subscriber.listener(event); } catch { session.subscribers.delete(subscriber); }
        continue;
      }
      // ACT: 每个订阅者只保留最新一帧；HTTP 写入背压由宿主流接口继续合并。
      subscriber.frame = event;
      if (subscriber.scheduled) continue;
      subscriber.scheduled = true;
      queueMicrotask(() => {
        subscriber.scheduled = false;
        const frame = subscriber.frame;
        subscriber.frame = undefined;
        if (!frame || session.closed || !session.subscribers.has(subscriber) || frame.tabId !== session.state.tabId) return;
        try { subscriber.listener(frame); } catch { session.subscribers.delete(subscriber); }
      });
    }
  }

  function clearRefs(session: BrowserSession) {
    for (const handle of session.refs.values()) void handle.dispose().catch(() => {});
    session.refs.clear();
    session.snapshot = [];
    session.snapshotVersion++;
  }

  async function releaseInput(tab: Tab) {
    const keys = [...tab.inputKeys];
    const buttons = tab.inputButtons.size;
    tab.inputKeys.clear();
    tab.inputButtons.clear();
    await Promise.allSettled([
      ...keys.map(key => tab.page.keyboard.up(key)),
      ...(buttons ? [tab.page.mouse.reset()] : []),
    ]);
  }

  function queueInputRelease(session: BrowserSession, tab: Tab) {
    // 先作废尚未执行的手动事件，再排队释放已按下的输入，避免断流后迟到的 down 留在网页中。
    tab.inputVersion++;
    const release = session.queue.then(() => releaseInput(tab));
    session.queue = release.catch(() => {});
  }

  async function syncModifiers(tab: Tab, modifiers: string[] | undefined, except?: string) {
    if (!modifiers) return;
    for (const key of ["Alt", "Control", "Meta", "Shift"] as const) {
      if (key === except || modifiers.includes(key) === tab.inputKeys.has(key)) continue;
      if (modifiers.includes(key)) { tab.inputKeys.add(key); await tab.page.keyboard.down(key); }
      else { tab.inputKeys.delete(key); await tab.page.keyboard.up(key); }
    }
  }

  async function updateState(session: BrowserSession) {
    if (session.closed) return session.state;
    const tab = session.tabs.get(session.state.tabId);
    if (!tab || tab.page.isClosed()) return session.state;
    const navigationVersion = tab.navigationVersion;
    const client = await tab.page.createCDPSession();
    try {
      const [title, history] = await Promise.all([tab.page.title().catch(() => ""), client.send("Page.getNavigationHistory")]);
      if (session.closed || session.state.tabId !== tab.id || tab.navigationVersion !== navigationVersion) return session.state;
      const url = tab.page.url() === "chrome-error://chromewebdata/" ? history.entries[history.currentIndex]?.url : tab.page.url();
      if (!url || !isWebUrl(url)) throw new Error("浏览器仅允许 HTTP/HTTPS 网页和空白页");
      session.state = { ...session.state, url, title: title.slice(0, 1000), canGoBack: history.currentIndex > 0, canGoForward: history.currentIndex < history.entries.length - 1 };
      emit(session, { type: "state", session: session.state });
      return session.state;
    } finally { await client.detach().catch(() => {}); }
  }

  function toolResult(session: BrowserSession, data: Record<string, unknown> = {}, image?: string): ToolResult {
    const details = { ...session.state, ...data };
    return {
      content: [{ type: "text", text: JSON.stringify(details) }, ...(image ? [{ type: "image" as const, data: image, mimeType: "image/jpeg" }] : [])],
      details,
    };
  }

  async function stopStream(session: BrowserSession) {
    const stream = session.stream;
    session.stream = undefined;
    session.frame = undefined;
    if (!stream) return;
    await stream.client.send("Page.stopScreencast").catch(() => {});
    await stream.client.detach().catch(() => {});
  }

  function refreshStream(session: BrowserSession) {
    session.streamQueue = session.streamQueue.catch(() => {}).then(async () => {
      const tab = session.tabs.get(session.state.tabId);
      if (!session.closed && session.subscribers.size && tab && !tab.page.isClosed() && session.stream?.tabId === tab.id) return;
      await stopStream(session);
      if (session.closed || !session.subscribers.size || !tab || tab.page.isClosed()) return;
      const client = await tab.page.createCDPSession();
      if (session.closed || !session.subscribers.size || session.state.tabId !== tab.id) { await client.detach(); return; }
      const stream = { tabId: tab.id, client };
      session.stream = stream;
      client.on("Page.screencastFrame", event => {
        void client.send("Page.screencastFrameAck", { sessionId: event.sessionId }).catch(() => {});
        if (session.closed || session.stream !== stream || session.state.tabId !== tab.id || !isBrowserPageUrl(tab.page.url())) return;
        const frame: FrameEvent = {
          type: "frame", sessionId: session.state.browserSessionId, tabId: tab.id, data: event.data, mimeType: "image/jpeg",
          width: Math.round(event.metadata.deviceWidth), height: Math.round(event.metadata.deviceHeight),
        };
        session.frame = frame;
        emit(session, frame);
      });
      await client.send("Page.startScreencast", { format: "jpeg", quality: 65, maxWidth: 1280, maxHeight: 800, everyNthFrame: 1 });
    }).catch(async error => {
      await stopStream(session);
      if (!session.closed) emit(session, { type: "error", message: error instanceof Error ? error.message : "浏览器画面连接失败" });
    });
  }

  async function closeSession(session: BrowserSession) {
    if (session.closing) return session.closing;
    session.closed = true;
    session.state = { ...session.state, status: "closed" };
    sessions.delete(session.state.browserSessionId);
    void owners.get(session.ownerKey)?.then(current => { if (current === session) owners.delete(session.ownerKey); }).catch(() => {});
    clearRefs(session);
    emit(session, { type: "state", session: session.state });
    emit(session, { type: "closed", sessionId: session.state.browserSessionId });
    session.subscribers.clear();
    session.closing = (async () => {
      await session.context.close().catch(error => {
        if (session.browser.connected) throw error;
      });
      await session.streamQueue;
      await stopStream(session);
      session.tabs.clear();
      session.pages.clear();
    })();
    return session.closing;
  }

  async function activateTab(session: BrowserSession, tab: Tab) {
    if (session.closed || tab.page.isClosed()) throw new Error("浏览器标签页已关闭");
    if (session.state.tabId !== tab.id) {
      const previous = session.tabs.get(session.state.tabId);
      if (previous) { previous.inputVersion++; await releaseInput(previous); }
      clearRefs(session);
      session.frame = undefined;
      session.state = { ...session.state, tabId: tab.id };
    }
    await tab.page.bringToFront();
    await updateState(session);
    refreshStream(session);
  }

  function queueTabActivation(session: BrowserSession, tab: Tab, previousId: string) {
    const activation = session.queue.then(async () => {
      if (!session.closed && session.state.tabId === previousId) await activateTab(session, tab);
    });
    session.queue = activation.catch(() => {});
    return activation;
  }

  function watchPage(session: BrowserSession, page: Page): Promise<Tab> {
    const existing = session.pages.get(page);
    if (existing) return existing;
    const pending = (async () => {
      if (session.closed) throw new Error("浏览器会话已关闭");
      if (!isBrowserPageUrl(page.url())) { await page.close(); throw new Error("浏览器仅允许 HTTP/HTTPS 网页和空白页"); }
      const tab: Tab = { id: crypto.randomUUID(), page, navigationVersion: 0, inputVersion: 0, inputKeys: new Set(), inputButtons: new Set() };
      session.tabs.set(tab.id, tab);
      page.setDefaultTimeout(15000);
      page.setDefaultNavigationTimeout(20000);
      await page.setUserAgent(userAgents.get(session.browser)!);
      await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
      await page.setRequestInterception(true);
      page.on("request", request => {
        if (request.isInterceptResolutionHandled()) return;
        if (request.isNavigationRequest() && request.frame() === page.mainFrame() && !isWebUrl(request.url())) {
          void request.abort("blockedbyclient").catch(() => {});
          emit(session, { type: "error", message: "已阻止浏览器打开非 HTTP/HTTPS 地址" });
          void page.close().catch(() => {});
          return;
        }
        void request.continue().catch(() => {});
      });
      page.on("framenavigated", frame => {
        if (session.state.tabId === tab.id) clearRefs(session);
        if (frame !== page.mainFrame()) return;
        tab.navigationVersion++;
        queueInputRelease(session, tab);
        if (!isBrowserPageUrl(page.url())) {
          emit(session, { type: "error", message: "已关闭跳转到非 HTTP/HTTPS 地址的标签页" });
          void page.close().catch(() => {});
          return;
        }
        if (session.state.tabId === tab.id) void updateState(session).catch(() => {});
      });
      page.on("domcontentloaded", () => {
        if (session.state.tabId === tab.id) void updateState(session).catch(() => {});
      });
      page.on("popup", popup => {
        if (popup && session.state.tabId === tab.id) void watchPage(session, popup).then(next => queueTabActivation(session, next, tab.id)).catch(() => {});
      });
      page.once("close", () => {
        session.tabs.delete(tab.id);
        session.pages.delete(page);
        if (session.closed || session.state.tabId !== tab.id) return;
        const next = session.tabs.values().next().value;
        if (next) void queueTabActivation(session, next, tab.id).catch(() => {});
        else void closeSession(session).catch(() => {});
      });
      return tab;
    })();
    session.pages.set(page, pending);
    return pending;
  }

  async function getBrowser(executablePath: string) {
    if (shuttingDown) throw new Error("浏览器运行时正在关闭");
    let pending = browsers.get(executablePath);
    if (!pending) {
      pending = puppeteer.launch({
        executablePath, headless: true, defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
        timeout: 15000, protocolTimeout: 20000, handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false,
        ignoreDefaultArgs: ["--enable-automation"],
        args: ["--no-first-run", "--no-default-browser-check", "--disable-blink-features=AutomationControlled", "--window-size=1280,800", "--screen-info={1280x800}"],
      }).then(async browser => {
        const child = browser.process();
        if (child) {
          processes.add(child);
          child.once("exit", () => processes.delete(child));
        }
        browser.once("disconnected", () => {
          browsers.delete(executablePath);
          for (const session of sessions.values()) if (session.browser === browser) void closeSession(session).catch(() => {});
        });
        try { userAgents.set(browser, await readUserAgent(browser)); }
        catch (error) { await browser.close(); throw error; }
        return browser;
      });
      browsers.set(executablePath, pending);
      void pending.catch(() => { if (browsers.get(executablePath) === pending) browsers.delete(executablePath); });
    }
    return pending;
  }

  async function createSession(cwd: string, ownerKey: string, executablePath: string, signal: AbortSignal) {
    signal.throwIfAborted();
    const executable = await findExecutable(executablePath);
    signal.throwIfAborted();
    const browser = await getBrowser(executable);
    signal.throwIfAborted();
    if (shuttingDown) throw new Error("浏览器运行时正在关闭");
    const context = await browser.createBrowserContext();
    if (signal.aborted || shuttingDown) {
      await context.close().catch(() => {});
      signal.throwIfAborted();
      throw new Error("浏览器运行时正在关闭");
    }
    const session: BrowserSession = {
      cwd, ownerKey, browser, context,
      state: { browserSessionId: crypto.randomUUID(), tabId: "", url: "about:blank", title: "", canGoBack: false, canGoForward: false, status: "running" },
      tabs: new Map(), pages: new Map(), refs: new Map(), snapshot: [], snapshotVersion: 0,
      queue: Promise.resolve(), subscribers: new Set(), streamQueue: Promise.resolve(), closed: false,
    };
    sessions.set(session.state.browserSessionId, session);
    context.on("targetcreated", target => {
      if (target.type() === "page") void target.page().then(page => page ? watchPage(session, page) : undefined).catch(() => {});
    });
    try {
      signal.throwIfAborted();
      const tab = await watchPage(session, await context.newPage());
      signal.throwIfAborted();
      await activateTab(session, tab);
      return session;
    } catch (error) {
      await closeSession(session);
      throw error;
    }
  }

  async function snapshot(session: BrowserSession, page: Page, offset: number, signal: AbortSignal) {
    if (offset === 0) {
      clearRefs(session);
      const version = session.snapshotVersion;
      const tree = await page.accessibility.snapshot({ includeIframes: true });
      signal.throwIfAborted();
      if (session.snapshotVersion !== version) throw new Error("页面已变化，请重新读取快照");
      const visit = (node: SerializedAXNode, depth: number) => {
        session.snapshot.push({ node, depth });
        for (const child of node.children ?? []) visit(child, depth + 1);
      };
      if (tree) visit(tree, 0);
    } else if (!session.snapshot.length) throw new Error("页面已变化，请从 offset: 0 重新读取快照");
    if (offset > session.snapshot.length) throw new Error("快照 offset 超出内容范围");
    const version = session.snapshotVersion;
    const entries = session.snapshot.slice(offset, offset + 60);
    const lines: string[] = [];
    for (const [index, { node, depth }] of entries.entries()) {
      signal.throwIfAborted();
      const ref = `r${version}_${offset + index + 1}`;
      let handle = session.refs.get(ref);
      if (!handle && node.elementHandle) {
        const next = await node.elementHandle().catch(() => null);
        if (session.closed || session.snapshotVersion !== version) { await next?.dispose(); throw new Error("页面已变化，请重新读取快照"); }
        if (next) { handle = next; session.refs.set(ref, handle); }
      }
      const value = node.value === undefined ? "" : ` value=${JSON.stringify(String(node.value).slice(0, 500))}`;
      lines.push(`${"  ".repeat(Math.min(depth, 8))}${handle ? `[${ref}] ` : ""}${node.role} ${JSON.stringify(node.name?.slice(0, 500) ?? "")}${value}${node.disabled ? " disabled" : ""}${node.checked !== undefined ? ` checked=${node.checked}` : ""}`);
    }
    if (session.snapshotVersion !== version) throw new Error("页面已变化，请重新读取快照");
    const nextOffset = offset + entries.length < session.snapshot.length ? offset + entries.length : null;
    return { snapshot: lines.join("\n"), offset, nextOffset, total: session.snapshot.length, notice: `名称和数值超过 500 字符时已截断；完整正文使用 read。${nextOffset !== null ? "快照已分页，继续调用 snapshot 并使用 nextOffset。" : ""}` };
  }

  async function perform(session: BrowserSession, action: BrowserAction, signal: AbortSignal, onUpdate?: ToolUpdate): Promise<ToolResult> {
    signal.throwIfAborted();
    if (session.closed) throw new Error("浏览器会话已关闭，请重新 open");
    onUpdate?.(toolResult(session, { action: action.action, message: "浏览器正在执行操作" }));
    if (action.action === "close") { await closeSession(session); return toolResult(session); }
    let tab = session.tabs.get(session.state.tabId);
    if (!tab || tab.page.isClosed()) throw new Error("浏览器没有可用标签页，请重新 open");
    if (["navigate", "newTab", "click", "hover", "type", "pressKey", "scroll"].includes(action.action)) {
      tab.inputVersion++;
      await releaseInput(tab);
    }
    let data: Record<string, unknown> = {};
    let image: string | undefined;
    if (action.action === "newTab") {
      tab = await watchPage(session, await session.context.newPage());
      signal.throwIfAborted();
      await activateTab(session, tab);
    }
    signal.throwIfAborted();
    if (action.action === "navigate" || ((action.action === "open" || action.action === "newTab") && action.url)) {
      await tab.page.goto(action.url!, { waitUntil: "domcontentloaded" });
    } else if (action.action === "snapshot") {
      data = await snapshot(session, tab.page, action.offset, signal);
    } else if (action.action === "read") {
      data = await tab.page.$eval("body", (body, offset) => {
        const text = body.innerText;
        if (offset > text.length) throw new Error("正文 offset 超出内容范围");
        let end = Math.min(offset + 12000, text.length);
        const last = text.charCodeAt(end - 1);
        if (end < text.length && last >= 0xd800 && last <= 0xdbff) end--;
        return { text: text.slice(offset, end), offset, total: text.length, nextOffset: end < text.length ? end : null };
      }, action.offset);
    } else if (action.action === "click" || action.action === "hover" || action.action === "type") {
      const handle = session.refs.get(action.ref);
      if (!handle || !await handle.evaluate(element => element.isConnected)) throw new Error("元素引用已失效，请重新读取 snapshot 后操作");
      const href = await handle.evaluate(element => element.closest("a[href]")?.getAttribute("href"));
      if (href && !isWebUrl(new URL(href, tab.page.url()).href)) throw new Error("不能打开非 HTTP/HTTPS 链接");
      signal.throwIfAborted();
      if (action.action === "click") await handle.asLocator().click({ signal });
      else if (action.action === "hover") await handle.asLocator().hover({ signal });
      else await handle.asLocator().fill(action.text, { signal });
    } else if (action.action === "pressKey") {
      await pressKey(tab.page, action.key, signal);
    } else if (action.action === "scroll") {
      await tab.page.mouse.move(640, 400);
      signal.throwIfAborted();
      await tab.page.mouse.wheel({
        deltaX: action.direction === "left" ? -action.amount : action.direction === "right" ? action.amount : 0,
        deltaY: action.direction === "up" ? -action.amount : action.direction === "down" ? action.amount : 0,
      });
    } else if (action.action === "screenshot") {
      image = await tab.page.screenshot({ type: "jpeg", quality: 80, encoding: "base64" });
    } else if (action.action === "tabs") {
      const tabs = [...session.tabs.values()];
      if (action.offset > tabs.length) throw new Error("标签页 offset 超出内容范围");
      data = { tabs: await Promise.all(tabs.slice(action.offset, action.offset + 20).map(async item => ({
        tabId: item.id, url: isWebUrl(item.page.url()) ? item.page.url().slice(0, 2000) : "about:blank", title: (await item.page.title().catch(() => "")).slice(0, 300), active: item.id === session.state.tabId,
      }))), total: tabs.length, nextOffset: action.offset + 20 < tabs.length ? action.offset + 20 : null };
    } else if (action.action === "selectTab") {
      const next = session.tabs.get(action.tabId);
      if (!next) throw new Error("标签页不属于当前浏览器会话");
      await activateTab(session, next);
    } else if (action.action === "closeTab") {
      const target = action.tabId ? session.tabs.get(action.tabId) : tab;
      if (!target) throw new Error("标签页不属于当前浏览器会话");
      await target.page.close();
      if (!session.tabs.size) await closeSession(session);
      else if (!session.tabs.has(session.state.tabId)) await activateTab(session, session.tabs.values().next().value!);
    }
    signal.throwIfAborted();
    await updateState(session);
    return toolResult(session, data, image);
  }

  return {
    async execute(cwd: string, ownerSessionId: string, args: Record<string, unknown>, config: Record<string, unknown>, signal?: AbortSignal, onUpdate?: ToolUpdate): Promise<ToolResult> {
      const action = browserActionSchema.parse(args);
      const settings = browserConfigSchema.parse(config);
      if (shuttingDown) throw new Error("浏览器运行时正在关闭");
      if (!ownerSessionId) throw new Error("浏览器操作缺少 Agent 会话身份");
      const directory = resolve(cwd);
      const ownerKey = JSON.stringify([directory, ownerSessionId]);
      const timeout = AbortSignal.timeout(30000);
      const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
      requestSignal.throwIfAborted();
      let session: BrowserSession | undefined;
      let pendingSession: Promise<BrowserSession> | undefined;
      const cancelled = Promise.withResolvers<never>();
      const abort = () => {
        const reason = timeout.aborted ? new Error("浏览器操作超时，已关闭当前浏览器会话，避免操作继续执行") : requestSignal.reason;
        if (session) void closeSession(session).then(() => cancelled.reject(reason), cancelled.reject);
        else {
          if (pendingSession && owners.get(ownerKey) === pendingSession) owners.delete(ownerKey);
          void pendingSession?.then(current => closeSession(current)).catch(() => {});
          cancelled.reject(reason);
        }
      };
      requestSignal.addEventListener("abort", abort, { once: true });
      try {
        const operation = (async () => {
          if (action.browserSessionId) {
            const existing = sessions.get(action.browserSessionId);
            if (!existing || existing.ownerKey !== ownerKey) throw new Error("浏览器会话不存在，或不属于当前 Agent 对话");
            session = existing;
          } else {
            let pending = owners.get(ownerKey);
            if (!pending) {
              if (action.action !== "open") throw new Error("请先调用 open 打开浏览器");
              pending = createSession(directory, ownerKey, settings.executablePath, requestSignal);
              owners.set(ownerKey, pending);
              void pending.catch(() => { if (owners.get(ownerKey) === pending) owners.delete(ownerKey); });
            }
            pendingSession = pending;
            session = await pending;
          }
          if (requestSignal.aborted) { await closeSession(session); requestSignal.throwIfAborted(); }
          const current = session;
          const result = current.queue.then(() => perform(current, action, requestSignal, onUpdate));
          current.queue = result.then(() => {}, () => {});
          return result;
        })();
        return await Promise.race([operation, cancelled.promise]);
      } catch (error) {
        if (session && (requestSignal.aborted || error instanceof Error && error.name === "TimeoutError")) {
          await closeSession(session);
          if (timeout.aborted || error instanceof Error && error.name === "TimeoutError") throw new Error("浏览器操作超时，已关闭当前浏览器会话，避免操作继续执行", { cause: error });
        }
        throw error;
      } finally { requestSignal.removeEventListener("abort", abort); }
    },
    async input(cwd: string, browserSessionId: string, tabId: string, args: Record<string, unknown>, signal?: AbortSignal): Promise<BrowserSessionState> {
      const input = browserInputSchema.parse(args);
      const session = sessions.get(browserSessionId);
      if (!session || session.cwd !== resolve(cwd) || session.closed) throw Object.assign(new Error("浏览器会话不存在或已关闭"), { status: 404 });
      if (shuttingDown) throw new Error("浏览器运行时正在关闭");
      const originalTab = session.tabs.get(tabId);
      const navigationVersion = originalTab?.navigationVersion;
      const inputVersion = originalTab?.inputVersion;
      if (input.type === "release" && originalTab) originalTab.inputVersion++;
      const timeout = AbortSignal.timeout(30000);
      const requestSignal = signal && input.type !== "release" ? AbortSignal.any([signal, timeout]) : timeout;
      requestSignal.throwIfAborted();
      const cancelled = Promise.withResolvers<never>();
      let started = false;
      const abort = () => {
        if (timeout.aborted && started) void closeSession(session).then(() => cancelled.reject(timeout.reason), cancelled.reject);
        else if (input.type !== "release") {
          if (originalTab && originalTab.inputVersion === inputVersion && (input.type === "mouse" || input.type === "key" && input.event !== "press")) queueInputRelease(session, originalTab);
          if (!started) cancelled.reject(requestSignal.reason);
        }
      };
      signal?.addEventListener("abort", abort, { once: true });
      timeout.addEventListener("abort", abort, { once: true });
      try {
        const operation = session.queue.then(async () => {
          requestSignal.throwIfAborted();
          if (session.closed || sessions.get(browserSessionId) !== session) throw Object.assign(new Error("浏览器会话已关闭"), { status: 404 });
          const tab = session.tabs.get(tabId);
          if (input.type === "release") {
            if (tab) await releaseInput(tab);
            return { ...session.state };
          }
          const checkTab = () => {
            timeout.throwIfAborted();
            if (session.state.tabId !== tabId || !tab || tab.page.isClosed()) throw Object.assign(new Error("标签页已切换，请等待新画面后重试"), { status: 409 });
            if (tab !== originalTab || tab.navigationVersion !== navigationVersion || tab.inputVersion !== inputVersion) throw Object.assign(new Error("页面或输入状态已变化，请等待新画面后重试"), { status: 409 });
            return tab;
          };
          const current = checkTab();
          started = true;
          if (!(input.type === "mouse" && input.event !== "down") && !(input.type === "key" && input.event === "up")) clearRefs(session);
          try {
            if (input.type === "mouse" || input.type === "click" || input.type === "wheel") {
              const viewport = current.page.viewport()!;
              const frame = session.frame?.tabId === tabId ? session.frame : viewport;
              if ((input.type !== "mouse" || input.event === "down") && (input.x < 0 || input.y < 0 || input.x >= frame.width || input.y >= frame.height)) throw Object.assign(new Error("输入坐标超出浏览器画面"), { status: 400 });
              const client = await current.page.createCDPSession();
              try {
                const { cssVisualViewport } = await client.send("Page.getLayoutMetrics");
                checkTab();
                await syncModifiers(current, input.modifiers);
                checkTab();
                await current.page.mouse.move(input.x * cssVisualViewport.clientWidth / frame.width, input.y * cssVisualViewport.clientHeight / frame.height);
                checkTab();
                if (input.type === "wheel") await current.page.mouse.wheel({ deltaX: input.deltaX, deltaY: input.deltaY });
                else {
                  // 当前 Puppeteer 的 down/up 原生支持 clickCount，但公开类型省略了它；保持每次按下/抬起各一个事件。
                  const options = { button: input.button, clickCount: input.clickCount };
                  if (input.type === "click") {
                    try { await current.page.mouse.down(options); }
                    finally { await current.page.mouse.up(options); }
                  } else if (input.event === "down") {
                    current.inputButtons.add(input.button);
                    await current.page.mouse.down(options);
                  } else if (input.event === "up" && current.inputButtons.delete(input.button)) await current.page.mouse.up(options);
                }
              } finally { await client.detach().catch(() => {}); }
            } else if (input.type === "key") {
              await syncModifiers(current, input.modifiers, input.key);
              checkTab();
              if (input.event === "press") await pressKey(current.page, input.key, timeout);
              else if (input.event === "down") { current.inputKeys.add(input.key as KeyInput); await current.page.keyboard.down(input.key as KeyInput); }
              else { current.inputKeys.delete(input.key as KeyInput); await current.page.keyboard.up(input.key as KeyInput); }
            } else if (input.type === "text") await current.page.keyboard.sendCharacter(input.text);
            else {
              await releaseInput(current);
              checkTab();
              current.inputVersion++;
              if (input.type === "navigate") await current.page.goto(input.url, { waitUntil: "domcontentloaded" });
              else if (input.type === "back") await current.page.goBack({ waitUntil: "domcontentloaded" });
              else if (input.type === "forward") await current.page.goForward({ waitUntil: "domcontentloaded" });
              else await current.page.reload({ waitUntil: "domcontentloaded" });
              await updateState(session);
            }
            timeout.throwIfAborted();
            if (input.type === "click" || input.type === "wheel" || input.type === "key" || input.type === "text" || input.type === "mouse" && input.event !== "move") void updateState(session).catch(() => {});
            return { ...session.state };
          } catch (error) {
            current.inputVersion++;
            await releaseInput(current);
            if (error instanceof Error && error.message.startsWith("Unknown key:")) throw Object.assign(new Error("不支持此按键"), { status: 400 });
            throw error;
          }
        });
        session.queue = operation.then(() => {}, () => {});
        return await Promise.race([operation, cancelled.promise]);
      } catch (error) {
        if (started && (timeout.aborted || error instanceof Error && error.name === "TimeoutError")) {
          await closeSession(session);
          if (timeout.aborted || error instanceof Error && error.name === "TimeoutError") throw new Error("浏览器输入超时，已关闭当前浏览器会话，避免操作继续执行", { cause: error });
        }
        throw error;
      } finally {
        signal?.removeEventListener("abort", abort);
        timeout.removeEventListener("abort", abort);
      }
    },
    getSession(cwd: string, browserSessionId: string): BrowserSessionState | undefined {
      const session = sessions.get(browserSessionId);
      return session && session.cwd === resolve(cwd) && !session.closed ? { ...session.state } : undefined;
    },
    hasOwner(cwd: string, ownerSessionId: string, browserSessionId: string) {
      const session = sessions.get(browserSessionId);
      return !!session && !session.closed && session.ownerKey === JSON.stringify([resolve(cwd), ownerSessionId]);
    },
    subscribe(cwd: string, browserSessionId: string, listener: (event: BrowserStreamEvent) => void) {
      const session = sessions.get(browserSessionId);
      if (!session || session.cwd !== resolve(cwd) || session.closed) throw new Error("浏览器会话不存在或已关闭");
      const subscriber: Subscriber = { listener, scheduled: false };
      session.subscribers.add(subscriber);
      listener({ type: "state", session: { ...session.state } });
      if (session.frame) emit(session, session.frame);
      refreshStream(session);
      return () => {
        session.subscribers.delete(subscriber);
        subscriber.frame = undefined;
        if (!session.subscribers.size) for (const tab of session.tabs.values()) queueInputRelease(session, tab);
        refreshStream(session);
      };
    },
    async closeOwner(cwd: string, ownerSessionId: string) {
      const ownerKey = JSON.stringify([resolve(cwd), ownerSessionId]);
      const pending = owners.get(ownerKey);
      owners.delete(ownerKey);
      const closing = [...sessions.values()].filter(session => session.ownerKey === ownerKey).map(session => closeSession(session));
      if (pending) closing.push(pending.then(session => closeSession(session), () => {}));
      await Promise.all(closing);
    },
    async closeAll() {
      shuttingDown = true;
      const closingSessions = Promise.allSettled([...sessions.values()].map(session => closeSession(session)));
      const opened = await Promise.allSettled(browsers.values());
      await Promise.allSettled(opened.map(async result => {
        if (result.status !== "fulfilled") return;
        const browser = result.value;
        const closing = browser.close();
        const timer = setTimeout(() => { browser.process()?.kill("SIGKILL"); }, 3000);
        try { await closing; } finally { clearTimeout(timer); }
      }));
      await closingSessions;
      browsers.clear();
      owners.clear();
    },
  };
}

export default createBrowserRuntime;
