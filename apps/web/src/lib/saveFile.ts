import axios from "axios";
import { ElMessage } from "element-plus";

const isDesktop = new URLSearchParams(window.location.search).get("desktop") === "1";

export default async function saveFile(content: Blob | (() => Promise<Blob>), fileName: string): Promise<boolean> {
  if (isDesktop) {
    const { data: selectData } = await axios.post<{ code: number; data: { token: string | null }; message?: string }>(
      "/api/desktop/selectSaveFile",
      { fileName },
      { headers: { "x-toonflow-desktop": "1" } },
    );
    if (selectData.code !== 200) throw new Error(selectData.message || "选择保存位置失败");
    const token = selectData.data?.token;
    if (!token) return false;
    const blob = typeof content === "function" ? await content() : content;
    const { data } = await axios.post<{ code: number; data: { saved: boolean }; message?: string }>("/api/desktop/saveFile", blob, {
      params: { token },
      headers: { "Content-Type": "application/octet-stream", "x-toonflow-desktop": "1" },
    });
    if (data.code !== 200 || typeof data.data?.saved !== "boolean") throw new Error(data.message || "保存文件失败");
    return data.data.saved;
  }
  const blob = typeof content === "function" ? await content() : content;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return true;
}

export function registerDesktopDownloads() {
  const pending = new WeakSet<HTMLAnchorElement>();
  function handleDownload(event: MouseEvent) {
    const link = event.composedPath().find(element => element instanceof HTMLAnchorElement && element.hasAttribute("download")) as HTMLAnchorElement | undefined;
    if (!link?.href || event.button !== 0) return;
    const url = new URL(link.href);
    if (url.origin !== window.location.origin || !["blob:", "http:", "https:"].includes(url.protocol)) return;
    event.preventDefault();
    if (pending.has(link) || link.getAttribute("aria-disabled") === "true") return;
    pending.add(link);
    link.dispatchEvent(new CustomEvent("downloadstate", { detail: true }));
    // ACT: 在捕获阶段接管下载，兼容已安装节点的 @click.stop，无需重打包节点；先选保存位置，确认后才拉取内容。
    void saveFile(() => axios.get<Blob>(url.href, { responseType: "blob" }).then(({ data }) => data), link.download || "download").catch(error => {
      ElMessage.error(axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || error.message : error instanceof Error ? error.message : "保存文件失败");
    }).finally(() => {
      pending.delete(link);
      link.dispatchEvent(new CustomEvent("downloadstate", { detail: false }));
    });
  }
  if (isDesktop) document.addEventListener("click", handleDownload, true);
  return () => document.removeEventListener("click", handleDownload, true);
}
