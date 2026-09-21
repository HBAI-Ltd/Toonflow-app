import { join } from "node:path";
import { Worker } from "node:worker_threads";

export async function showNativeSplash(assetDir: string, onClose: () => void) {
  if (process.platform === "win32" && process.arch === "x64") {
    // ACT: Win32 窗口与消息循环都归 Worker 所有，主线程加载服务/WebView2 时动画仍能响应。
    const worker = new Worker(join(assetDir, "windowsSplashWorker.js"), { workerData: assetDir });
    const ready = Promise.withResolvers<void>();
    const finished = Promise.withResolvers<void>();
    let isReady = false;
    let isClosed = false;
    let isFinishing = false;

    function close() {
      if (isClosed) return;
      isClosed = true;
      worker.postMessage("close");
      finished.resolve();
    }

    worker.on("message", (message: "ready" | "finished" | "cancelled") => {
      if (message === "ready") {
        isReady = true;
        ready.resolve();
      } else if (message === "finished") {
        finished.resolve();
      } else if (!isClosed) {
        close();
        onClose();
      }
    });
    worker.on("error", (error) => {
      ready.reject(error);
      // ACT: 动画故障结束等待并继续启动，只有 cancelled 消息表示用户退出。
      if (isReady && !isClosed) {
        console.error("原生启动动画失败：", error);
        close();
      }
    });
    worker.on("exit", (code) => {
      ready.reject(new Error(`启动动画线程提前退出：${code}`));
      finished.resolve();
      isClosed = true;
    });
    await ready.promise;
    return {
      finish() {
        if (!isClosed && !isFinishing) {
          isFinishing = true;
          worker.postMessage("finish");
        }
        return finished.promise;
      },
      close,
    };
  }
  if (process.platform === "darwin" && (process.arch === "x64" || process.arch === "arm64")) {
    const { showMacSplash } = await import("./macSplash");
    return showMacSplash(assetDir, onClose);
  }
  throw new Error(`当前平台不支持原生启动画面：${process.platform}/${process.arch}`);
}
