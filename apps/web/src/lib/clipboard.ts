import axios from "axios";

const isDesktop = new URLSearchParams(window.location.search).get("desktop") === "1";
const headers = { "x-toonflow-desktop": "1" };

export async function readClipboardText(): Promise<string> {
  if (!isDesktop) return navigator.clipboard.readText();
  const { data } = await axios.post<{ code: number; data: { text: string }; message: string }>("/api/desktop/clipboard/read", {}, { headers });
  if (data.code !== 200) throw new Error(data.message || "读取剪贴板失败");
  return data.data.text;
}

export async function writeClipboardText(text: string): Promise<void> {
  if (!isDesktop) return navigator.clipboard.writeText(text);
  const { data } = await axios.post<{ code: number; message: string }>("/api/desktop/clipboard/write", { text }, { headers });
  if (data.code !== 200) throw new Error(data.message || "写入剪贴板失败");
}
