// ACT: 一个进程一个宿主，由启动入口声明；子进程默认是独立服务，不继承宿主权限。
let runtimeHost: "server" | "desktop" | "mobile" = "server";

export function setRuntimeHost(host: typeof runtimeHost) {
  runtimeHost = host;
}

// 宿主在启动过程中设置，每次调用读取，不在导入时缓存或初始化配置。
export function getRuntimePlatform() {
  const os = (process.platform as string) === "openharmony" || (process.platform === "linux" && process.env.TOONFLOW_PLATFORM === "ohos") ? "ohos" : process.platform;
  const development = process.env.NODE_ENV === "dev";
  const desktop = runtimeHost === "desktop";
  const mobile = runtimeHost === "mobile";
  const desktopSystem = process.platform === "win32" || process.platform === "darwin";
  const nativeDevelopment = desktopSystem && development;
  // local 表示本机任意工作目录能力，不代替请求授权。
  const local = desktop || nativeDevelopment;

  return {
    os, development, desktop, mobile, local,
    nativeDevelopment,
    browserSupported: desktop || development,
    // 独立 Linux 服务仍保留服务器工作区边界；桌面宿主始终限制 Host。
    requiresLocalHost: desktop || nativeDevelopment,
  };
}
