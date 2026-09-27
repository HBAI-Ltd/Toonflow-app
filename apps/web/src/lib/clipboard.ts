import axios from "axios";
import { t } from "@/lib/i18n";
import { createDisplayError } from "@toonflow/i18n";

const isDesktop = new URLSearchParams(window.location.search).get("desktop") === "1";
const headers = { "x-toonflow-desktop": "1" };

export async function readClipboardText(): Promise<string> {
  if (!isDesktop) return navigator.clipboard.readText();
  const { data } = await axios.post<{ code: number; data: { text: string }; message: string }>("/api/desktop/clipboard/read", {}, { headers });
  if (data.code !== 200) throw data.message ? new Error(data.message) : createDisplayError("读取剪贴板失败", () => t("clipboard.readFailed"));
  return data.data.text;
}

export async function writeClipboardText(text: string): Promise<void> {
  if (!isDesktop) return navigator.clipboard.writeText(text);
  const { data } = await axios.post<{ code: number; message: string }>("/api/desktop/clipboard/write", { text }, { headers });
  if (data.code !== 200) throw data.message ? new Error(data.message) : createDisplayError("写入剪贴板失败", () => t("clipboard.writeFailed"));
}
