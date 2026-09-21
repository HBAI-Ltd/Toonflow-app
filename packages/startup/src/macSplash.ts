import { dlopen, ptr } from "bun:ffi";
import { join } from "node:path";
import { createSplashPlayer } from "./splashPlayer";

function loadNativeLibrary(assetDir: string) {
  const target = process.arch === "arm64" ? "macArm64" : "macX64";
  return dlopen(join(assetDir, target, "nativeSplash.dylib"), {
    createNativeSplash: { args: ["ptr"], returns: "ptr" },
    presentNativeSplash: { args: ["ptr", "ptr"], returns: "i32" },
    closeNativeSplash: { args: ["ptr"], returns: "void" },
  });
}
// ACT: Objective-C 类会注册到进程运行时；桥接库保留到退出，窗口和像素仍逐次释放。
let nativeLibrary: ReturnType<typeof loadNativeLibrary> | undefined;

export function showMacSplash(assetDir: string, onClose: () => void) {
  const library = nativeLibrary ??= loadNativeLibrary(assetDir);
  let window: ReturnType<typeof library.symbols.createNativeSplash> = null;
  let player: ReturnType<typeof createSplashPlayer> | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  let isClosed = false;
  const { promise: finished, resolve: finishAnimation } = Promise.withResolvers<void>();

  function close() {
    if (isClosed) return;
    isClosed = true;
    clearInterval(timer);
    player?.close();
    if (window) library.symbols.closeNativeSplash(window);
    finishAnimation();
  }

  try {
    const size = new Uint32Array(2);
    window = library.symbols.createNativeSplash(ptr(size));
    if (!window) throw new Error("无法创建 macOS 启动画面");
    const width = size[0]!, height = size[1]!;
    const pixels = new Uint8Array(width * height * 4);
    player = createSplashPlayer(assetDir, width, height, pixels);
    const startedAt = performance.now();

    function draw() {
      const isEnded = player!.draw(performance.now() - startedAt);
      const status = library.symbols.presentNativeSplash(window, ptr(pixels));
      if (status === 1) {
        close();
        onClose();
        return;
      }
      if (status !== 0) throw new Error("macOS 启动画面绘制失败");
      if (isEnded) {
        clearInterval(timer);
        finishAnimation();
      }
    }

    draw();
    if (!isClosed) timer = setInterval(() => {
      try {
        draw();
      } catch (error) {
        console.error("原生启动动画失败：", error);
        close();
      }
    }, 1000 / 60);
    return {
      finish() {
        if (!isClosed) player!.finish(performance.now() - startedAt);
        return finished;
      },
      close,
    };
  } catch (error) {
    close();
    throw error;
  }
}
