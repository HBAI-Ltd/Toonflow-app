import common from "@ohos.app.ability.common";
import fs from "@ohos.file.fs";
import picker from "@ohos.file.picker";
import http from "@ohos.net.http";
import url from "@ohos.url";
import util from "@ohos.util";
import webview from "@ohos.web.webview";
import zlib from "@ohos.zlib";
import runtime from "libtoonflowRuntime.so";

interface BrowserProbe {
  missing: string[];
  userAgent: string;
}

interface SaveResult {
  requestId: string;
  saved: boolean;
  error?: string;
}

// ACT: 多次窗口创建共用程序目录，串行完成资源替换；用户数据不在此队列内。
let payloadPreparation: Promise<void> = Promise.resolve();

@Entry
@Component
struct mobilePage {
  @State private message: string = "正在准备 Toonflow…";
  @State private failed: boolean = false;
  @State private ready: boolean = false;
  private controller: webview.WebviewController = new webview.WebviewController();
  private context: common.UIAbilityContext = this.getUIContext().getHostContext() as common.UIAbilityContext;
  private origin: string = "";
  private token: string = "";
  private browserUrl: string = "";
  private stage: string = "starting";
  private attached: boolean = false;
  private disposed: boolean = false;
  private starting: boolean = false;
  private saving: boolean = false;
  private startupId: number = 0;
  private timeoutId: number = -1;
  private runtimeTimer: number = -1;
  private uuidPattern: RegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  aboutToAppear(): void {
    this.disposed = false;
    this.start();
  }

  aboutToDisappear(): void {
    this.disposed = true;
    this.startupId++;
    clearTimeout(this.timeoutId);
    clearInterval(this.runtimeTimer);
    runtime.stop();
  }

  onBackPress(): boolean {
    try {
      if (this.attached && this.controller.accessBackward()) {
        this.controller.backward();
        return true;
      }
    } catch (error) {
      console.warn(`无法返回上一页：${(error as Error).message}`);
    }
    return false;
  }

  private showError(message: string): void {
    if (this.disposed) return;
    clearTimeout(this.timeoutId);
    clearInterval(this.runtimeTimer);
    this.stage = "error";
    this.failed = true;
    this.ready = false;
    this.message = message;
    console.error(message);
    runtime.stop();
  }

  private setTimeout(message: string, duration: number): void {
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => this.showError(message), duration);
  }

  private async writeFile(path: string, bytes: ArrayBuffer): Promise<void> {
    const file = await fs.open(path, fs.OpenMode.CREATE | fs.OpenMode.WRITE_ONLY | fs.OpenMode.TRUNC);
    try {
      let offset = 0;
      while (offset < bytes.byteLength) {
        const written = await fs.write(file.fd, offset === 0 ? bytes : bytes.slice(offset));
        if (written < 1) throw new Error("文件写入未完成");
        offset += written;
      }
    } finally {
      await fs.close(file);
    }
  }

  private async copyResource(name: string, path: string): Promise<void> {
    const resources = this.context.resourceManager;
    const source = await resources.getRawFd(name);
    let destination: fs.File | undefined;
    try {
      destination = await fs.open(path, fs.OpenMode.CREATE | fs.OpenMode.WRITE_ONLY | fs.OpenMode.TRUNC);
      // ACT: rawfile 在 HAP 中保持未压缩，以 1 MiB 分块提取，避免一次分配整个 Bun 二进制。
      const buffer = new ArrayBuffer(1024 * 1024);
      let offset = 0;
      while (offset < source.length) {
        // 绝对定位后顺序读取，不把 rawfile 起点重复加到 read 的相对偏移上。
        fs.lseek(source.fd, source.offset + offset, fs.WhenceType.SEEK_SET);
        const read = await fs.read(source.fd, buffer, { length: Math.min(buffer.byteLength, source.length - offset) });
        if (read < 1) throw new Error(`安装包资源读取未完成：${name}`);
        let written = 0;
        while (written < read) {
          const count = await fs.write(destination.fd, written === 0 ? buffer : buffer.slice(written, read),
            { length: read - written });
          if (count < 1) throw new Error(`安装包资源写入未完成：${name}`);
          written += count;
        }
        offset += read;
      }
    } finally {
      try {
        if (destination) await fs.close(destination);
      } finally {
        await resources.closeRawFd(name);
      }
    }
  }

  private async preparePayload(): Promise<void> {
    const files = this.context.filesDir;
    const app = `${files}/app`;
    const next = `${files}/appNext`;
    const previous = `${files}/appPrevious`;
    const revisionBytes = await this.context.resourceManager.getRawFileContent("revision.txt");
    const revision = util.TextDecoder.create("utf-8").decodeToString(revisionBytes).trim();
    if (!/^[0-9a-f]{64}$/.test(revision)) throw new Error("安装包中的程序版本标识无效");
    if (!fs.accessSync(app) && fs.accessSync(previous)) await fs.rename(previous, app);
    const installed = fs.accessSync(`${app}/revision.txt`) ? await fs.readText(`${app}/revision.txt`) : "";
    if (installed.trim() !== revision || !fs.accessSync(`${app}/server.js`)) {
      if (fs.accessSync(next)) await fs.rmdir(next);
      await fs.mkdir(next);
      const archive = `${this.context.cacheDir}/payload.zip`;
      try {
        await this.copyResource("payload.zip", archive);
        await zlib.decompressFile(archive, next);
        if (!fs.accessSync(`${next}/server.js`) || !fs.accessSync(`${next}/web/index.html`)) {
          throw new Error("安装包缺少服务端或网页资源");
        }
        await this.writeFile(`${next}/revision.txt`, revisionBytes.buffer.slice(revisionBytes.byteOffset,
          revisionBytes.byteOffset + revisionBytes.byteLength));
        if (fs.accessSync(previous)) await fs.rmdir(previous);
        if (fs.accessSync(app)) await fs.rename(app, previous);
        try {
          await fs.rename(next, app);
        } catch (error) {
          if (fs.accessSync(previous)) await fs.rename(previous, app);
          throw error as Error;
        }
      } finally {
        if (fs.accessSync(archive)) await fs.unlink(archive);
      }
    }
    // ACT: 可替换程序和 data 分目录；资源更新及失败恢复都不删除用户数据。
    if (fs.accessSync(next)) await fs.rmdir(next);
    if (fs.accessSync(previous)) await fs.rmdir(previous);
    const runtimeDirectory = `${files}/runtime`;
    if (!fs.accessSync(runtimeDirectory)) await fs.mkdir(runtimeDirectory);
    const runtimeRevision = fs.accessSync(`${runtimeDirectory}/revision.txt`)
      ? await fs.readText(`${runtimeDirectory}/revision.txt`) : "";
    if (runtimeRevision.trim() !== revision || !fs.accessSync(`${runtimeDirectory}/bun`)) {
      await this.copyResource("bun", `${runtimeDirectory}/bunNext`);
      await fs.rename(`${runtimeDirectory}/bunNext`, `${runtimeDirectory}/bun`);
      await this.writeFile(`${runtimeDirectory}/revision.txt`, revisionBytes.buffer.slice(revisionBytes.byteOffset,
        revisionBytes.byteOffset + revisionBytes.byteLength));
    }
    if (!fs.accessSync(`${files}/data`)) await fs.mkdir(`${files}/data`);
  }

  private async start(): Promise<void> {
    if (this.starting || this.disposed) return;
    clearInterval(this.runtimeTimer);
    this.starting = true;
    const startupId = ++this.startupId;
    this.ready = false;
    this.failed = false;
    this.stage = "starting";
    this.origin = "";
    this.token = "";
    this.message = "正在准备 Toonflow…";
    runtime.stop();
    try {
      const preparation = payloadPreparation.then(() => this.preparePayload());
      payloadPreparation = preparation.catch(() => {});
      await preparation;
      if (this.disposed || this.startupId !== startupId) return;
      this.message = "正在启动本地 Bun 服务…";
      this.setTimeout("本地 Bun 服务启动超时，请退出后重新打开 Toonflow。", 60000);
      const files = this.context.filesDir;
      const address: string = await runtime.start(`${files}/runtime/bun`, `${files}/app`, `${files}/data`, this.context.cacheDir);
      if (this.disposed || this.startupId !== startupId || this.failed) return;
      const parsed = new url.URL(address);
      const token = parsed.params.get("token");
      if (parsed.protocol !== "http:" || parsed.hostname !== "127.0.0.1" || parsed.username || parsed.password
        || parsed.pathname !== "/" || !parsed.port || Number(parsed.port) < 1 || Number(parsed.port) > 65535
        || parsed.hash || !token || !this.uuidPattern.test(token)) throw new Error("Bun 返回了无效的本地服务地址");
      this.origin = parsed.origin;
      this.token = token;
      this.runtimeTimer = setInterval(() => {
        const error: string = runtime.getError();
        if (error) this.showError(error);
      }, 1000);
      this.stage = "probe";
      this.message = "正在检查鸿蒙浏览器能力…";
      this.browserUrl = `${address}&probe=1`;
      this.setTimeout("鸿蒙浏览器启动超时，请退出后重新打开 Toonflow。", 30000);
      if (this.attached) this.controller.loadUrl(this.browserUrl);
    } catch (error) {
      if (startupId === this.startupId) this.showError(`无法启动 Toonflow：${(error as Error).message}`);
    } finally {
      this.starting = false;
    }
  }

  private isLocal(address: string): boolean {
    if (!this.origin) return false;
    try {
      const parsed = new url.URL(address);
      return parsed.origin === this.origin && !parsed.username && !parsed.password;
    } catch (_) {
      return false;
    }
  }

  private isLocalPage(): boolean {
    try {
      return !this.disposed && !this.failed && this.attached && this.isLocal(this.controller.getUrl());
    } catch (_) {
      return false;
    }
  }

  private async pageFinished(address: string): Promise<void> {
    if (!this.isLocal(address) || this.disposed || this.failed) return;
    const parsed = new url.URL(address);
    if (parsed.params.get("token")) return;
    if (this.stage === "probe" && parsed.params.get("probe") === "1") {
      this.stage = "checking";
      try {
        const raw = await this.controller.runJavaScript("JSON.stringify(window.toonflowBrowserProbe)");
        const value = JSON.parse(raw) as BrowserProbe | string;
        const probe = typeof value === "string" ? JSON.parse(value) as BrowserProbe : value;
        if (!probe || !Array.isArray(probe.missing) || typeof probe.userAgent !== "string" || !probe.userAgent) {
          throw new Error("鸿蒙浏览器未返回有效的能力检测结果");
        }
        if (probe.missing.length > 0) {
          throw new Error(`当前鸿蒙浏览器缺少所需能力：${probe.missing.join("、")}。请更新系统后重新打开 Toonflow。`);
        }
        if (this.disposed || this.failed) return;
        console.info(`ArkWeb 能力检测通过：${probe.userAgent}`);
        this.stage = "page";
        this.message = "正在加载 Toonflow…";
        this.setTimeout("Toonflow 页面加载超时，请退出后重新打开。", 30000);
        this.controller.loadUrl(`${this.origin}/?mobile=1`);
      } catch (error) {
        this.showError((error as Error).message);
      }
    } else if (this.stage === "page" && parsed.pathname === "/" && !parsed.params.get("probe")) {
      clearTimeout(this.timeoutId);
      this.stage = "ready";
      this.ready = true;
      this.controller.clearHistory();
    }
  }

  private navigate(address: string, mainFrame: boolean): boolean {
    if (address === "about:blank" && !this.origin) return false;
    if (this.isLocal(address)) return false;
    try {
      const parsed = new url.URL(address);
      if (mainFrame && parsed.protocol === "toonflow:" && this.isLocalPage()) {
        if (parsed.hostname === "restart") this.start();
        else if (parsed.hostname === "save") this.saveFile(parsed);
        return true;
      }
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        if (!mainFrame) return false;
        this.context.openLink(address).catch((error: Error) => {
          this.getUIContext().getPromptAction().showToast({ message: `无法打开外部链接：${error.message}` });
        });
      } else if (!mainFrame && (parsed.protocol === "data:" || parsed.protocol === "blob:")) return false;
    } catch (_) {
      return true;
    }
    return true;
  }

  private async exportRequest(address: string, token: string, method: http.RequestMethod): Promise<http.HttpResponse> {
    const request = http.createHttp();
    try {
      return await request.request(address, {
        method, header: { Cookie: `toonflowMobile=${token}` }, expectDataType: http.HttpDataType.ARRAY_BUFFER,
        usingCache: false, usingProxy: false, connectTimeout: 10000, readTimeout: 30000, maxLimit: 100 * 1024 * 1024,
      });
    } finally {
      request.destroy();
    }
  }

  private async saveFile(request: url.URL): Promise<void> {
    const requestId = request.params.get("requestId") || "";
    const address = request.params.get("url") || "";
    const fileName = request.params.get("fileName") || "";
    if (!this.uuidPattern.test(requestId) || !this.isLocalPage()) return;
    const origin = this.origin;
    const token = this.token;
    const result: SaveResult = { requestId, saved: false };
    let valid = false;
    let ownsSave = false;
    try {
      const source = new url.URL(address);
      if (!this.isLocal(address) || source.search || source.hash || !source.pathname.startsWith("/api/mobile/exports/")
        || !this.uuidPattern.test(source.pathname.slice("/api/mobile/exports/".length)) || !fileName.trim()
        || fileName.length > 255 || /[\\/\x00-\x1f]/.test(fileName)) throw new Error("无效的导出请求");
      valid = true;
      if (this.saving) throw new Error("请先完成当前文件保存");
      this.saving = true;
      ownsSave = true;
      const destinations = await new picker.DocumentViewPicker(this.context).save({ newFileNames: [fileName] });
      if (destinations.length > 0) {
        const response = await this.exportRequest(address, token, http.RequestMethod.GET);
        if (response.responseCode !== 200 || !(response.result instanceof ArrayBuffer)) {
          throw new Error(`读取导出文件失败（HTTP ${response.responseCode}）`);
        }
        await this.writeFile(destinations[0], response.result as ArrayBuffer);
        result.saved = true;
      }
    } catch (error) {
      result.error = (error as Error).message;
    } finally {
      if (ownsSave) this.saving = false;
      if (valid) {
        try {
          await this.exportRequest(address, token, http.RequestMethod.DELETE);
        } catch (error) {
          console.warn(`清理临时导出失败：${(error as Error).message}`);
        }
      }
      if (this.isLocalPage() && this.origin === origin) {
        this.controller.runJavaScript(`window.dispatchEvent(new CustomEvent("toonflow:mobile-save",{detail:${JSON.stringify(result)}}))`)
          .catch((error: Error) => console.error(`无法返回文件保存结果：${error.message}`));
      }
    }
  }

  build() {
    Stack() {
      Web({ src: "about:blank", controller: this.controller })
        .width("100%")
        .height("100%")
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .fileAccess(false)
        .multiWindowAccess(false)
        .allowWindowOpenMethod(true)
        .onControllerAttached(() => {
          this.attached = true;
          if (this.browserUrl) this.controller.loadUrl(this.browserUrl);
        })
        .onLoadIntercept((event) => this.navigate(event.data.getRequestUrl(), event.data.isMainFrame()))
        .onPageEnd((event) => this.pageFinished(event.url))
        .onErrorReceive((event) => {
          if (event.request.isMainFrame() && this.isLocal(event.request.getRequestUrl())) {
            this.showError(`本地页面加载失败：${event.error.getErrorInfo()}`);
          }
        })
        .onHttpErrorReceive((event) => {
          if (event.request.isMainFrame() && this.isLocal(event.request.getRequestUrl())) {
            this.showError(`本地页面返回 HTTP ${event.response.getResponseCode()}`);
          }
        })
        .onRenderExited(() => this.showError("鸿蒙浏览器进程已退出，请重新打开 Toonflow。"))
      if (!this.ready) {
        Column({ space: 20 }) {
          if (!this.failed) LoadingProgress().width(36).height(36)
          Scroll() {
            Text(this.message).fontSize(16).fontColor("#1e293b").width("100%")
          }.width("100%").constraintSize({ maxHeight: "70%" })
          if (this.failed) Button("重试").onClick(() => this.start())
        }
        .padding(32)
        .width("100%")
        .height("100%")
        .justifyContent(FlexAlign.Center)
        .backgroundColor("#ffffff")
      }
    }.width("100%").height("100%")
  }
}
