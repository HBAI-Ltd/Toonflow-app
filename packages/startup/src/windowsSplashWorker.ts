import { parentPort, workerData } from "node:worker_threads";
import { showWindowsSplash } from "./windowsSplash";

if (!parentPort || typeof workerData !== "string") throw new Error("启动动画必须在工作线程中运行。");
const port = parentPort;
const splash = showWindowsSplash(workerData, () => {
  port.postMessage("cancelled");
  close();
});

function close() {
  splash.close();
  // Bun 的消息监听会保活线程，关闭端口前须移除监听才能自然退出。
  port.off("message", onMessage);
  port.close();
}

function onMessage(command: "finish" | "close") {
  if (command === "finish") {
    void splash.finish().then(() => port.postMessage("finished"));
  } else if (command === "close") {
    close();
  }
}
port.on("message", onMessage);
// 自然退出前在创建窗口的线程中释放 Win32/GDI/动画资源，不强制终止 Worker。
process.on("exit", () => splash.close());
port.postMessage("ready");
