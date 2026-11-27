// ACT: 客户端切换连接会重新加载页面，运行模式只在启动时读取。
const parameters = new URLSearchParams(window.location.search);
const desktop = parameters.get("desktop") === "1";
const mobile = parameters.get("mobile") === "1";
const remoteConnection = (mobile || desktop) && parameters.get("remote") === "1";
const platformSimulationValues = ["actual", "browser", "windowsDesktop", "macDesktop", "mobile"] as const;

// ACT: 模拟只用于前端分支；宿主握手、原生调用与连接边界始终读取真实平台。
export const actualPlatform = {
  isDesktop: desktop,
  isMobile: mobile,
  isRemoteConnection: remoteConnection,
  isLocalDesktop: desktop && !remoteConnection,
  isLocalMobile: mobile && !remoteConnection,
  isWindows: /Windows/i.test(navigator.userAgent),
  isMac: navigator.platform.includes("Mac"),
} as const;

export const platformSimulation = platformSimulationValues.find(value => value === parameters.get("simulatePlatform")) ?? "actual";
export const isMobile = platformSimulation === "actual" ? actualPlatform.isMobile : platformSimulation === "mobile";
export const isDesktop = platformSimulation === "actual" ? actualPlatform.isDesktop : platformSimulation === "windowsDesktop" || platformSimulation === "macDesktop";
export const isRemoteConnection = actualPlatform.isRemoteConnection;
export const isLocalDesktop = isDesktop && !isRemoteConnection;
export const isLocalMobile = isMobile && !isRemoteConnection;
// ACT: 只在启动时判断是否存在触屏，用于显示触屏专用入口；具体手势仍按每次事件的 pointerType 区分，触屏笔记本接鼠标时不改鼠标操作。
export const touchScreen = isMobile || window.matchMedia("(any-pointer: coarse)").matches;
export const isWindows = platformSimulation === "actual" || platformSimulation === "browser" ? actualPlatform.isWindows : platformSimulation === "windowsDesktop";
export const isMac = platformSimulation === "actual" || platformSimulation === "browser" ? actualPlatform.isMac : platformSimulation === "macDesktop";

export function setPlatformSimulation(value: string) {
  if (!platformSimulationValues.some(option => option === value)) throw new Error("不支持的模拟平台");
  if (value === platformSimulation) return;
  const url = new URL(window.location.href);
  if (value === "actual") url.searchParams.delete("simulatePlatform");
  else url.searchParams.set("simulatePlatform", value);
  window.location.replace(url.href);
}
