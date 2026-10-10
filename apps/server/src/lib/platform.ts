// ACT: 一个进程一个宿主，由启动入口声明；子进程默认是独立服务，不继承宿主权限。
let runtimeHost: "server" | "desktop" | "mobile" = "server";

export function setRuntimeHost(host: typeof runtimeHost) {
  runtimeHost = host;
}

// 宿主在启动过程中设置，每次调用读取，不在导入时缓存或初始化配置。
export function getRuntimePlatform() {
  const os = process.platform === "linux" && process.env.TOONFLOW_PLATFORM === "ohos" ? "ohos" : process.platform;
  const development = process.env.NODE_ENV === "dev";
  const desktop = runtimeHost === "desktop";
  const mobile = runtimeHost === "mobile";
  const desktopSystem = process.platform === "win32" || process.platform === "darwin";
  const nativeDevelopment = desktopSystem && development;
  const host = desktop || mobile;
  // local 表示本机任意工作目录能力，native 表示原生宿主或开发原生操作，均不代替请求授权。
  const local = desktopSystem && (development || desktop);
  const native = host || nativeDevelopment;

  return {
    // ID 仅是 l/n/h 能力摘要；开发模式单列，业务不解析 ID 或用它作为权限缓存键。
    id: `${os}-l${Number(local)}n${Number(native)}h${Number(host)}`,
    os, development, desktop, mobile, local, native, host,
    nativeDevelopment,
    // 此限制与 local 不等价：Linux 桌面宿主仍限制 Host，但不开放任意工作目录。
    requiresLocalHost: desktop || nativeDevelopment,
  };
}
