import { dlopen, ptr } from "bun:ffi";
import Electrobun, { type BrowserWindow } from "electrobun/main";

export default function registerWindowAppearance(window: BrowserWindow) {
  if (process.platform !== "win32") return;
  const handle = Number(window.ptr);
  if (!handle) return;
  const dwm = dlopen("dwmapi.dll", {
    DwmSetWindowAttribute: { args: ["u64", "u32", "ptr", "u32"], returns: "i32" },
  });
  const user32 = dlopen("user32.dll", {
    GetForegroundWindow: { args: [], returns: "u64" },
    SendMessageW: { args: ["u64", "u32", "u64", "i64"], returns: "i64" },
  });
  function updateAppearance(event: { data: { detail: unknown } }) {
    const detail = event.data.detail;
    if (!detail || typeof detail !== "object" || !("type" in detail) || detail.type !== "appearance"
      || !("dark" in detail) || typeof detail.dark !== "boolean"
      || !("backgroundColor" in detail) || typeof detail.backgroundColor !== "string" || detail.backgroundColor.length > 128
      || !("textColor" in detail) || typeof detail.textColor !== "string" || detail.textColor.length > 128) return;
    const background = Bun.color(detail.backgroundColor, "[rgb]");
    const text = Bun.color(detail.textColor, "[rgb]");
    if (!background || !text) return;
    const dark = new Int32Array([detail.dark ? 1 : 0]);
    // ACT: 先探测属性 20，失败再回退旧版 Windows 10 的 19；更旧系统保留原生标题栏。
    if (dwm.symbols.DwmSetWindowAttribute(handle, 20, ptr(dark), dark.byteLength) < 0) {
      dwm.symbols.DwmSetWindowAttribute(handle, 19, ptr(dark), dark.byteLength);
    }
    // ACT: 精确颜色仅 Windows 11 支持；Windows 10 保留上面的系统深浅色，亮色恢复系统默认。
    for (const [index, color] of [background, text].entries()) {
      const value = new Uint32Array([detail.dark ? color[0] | color[1] << 8 | color[2] << 16 : 0xffffffff]);
      dwm.symbols.DwmSetWindowAttribute(handle, 35 + index, ptr(value), value.byteLength);
    }
    // ACT: Windows 10 的 DWM 会缓存非客户区样式；仅刷新标题栏激活绘制，不改变窗口焦点或尺寸。
    const active = Number(user32.symbols.GetForegroundWindow()) === handle;
    user32.symbols.SendMessageW(handle, 0x86, active ? 0 : 1, 0);
    user32.symbols.SendMessageW(handle, 0x86, active ? 1 : 0, 0);
  }
  const eventName = `host-message-${window.webview.id}`;
  Electrobun.events.on(eventName, updateAppearance);
  window.on("close", () => {
    Electrobun.events.off(eventName, updateAppearance);
    user32.close();
    dwm.close();
  });
}
