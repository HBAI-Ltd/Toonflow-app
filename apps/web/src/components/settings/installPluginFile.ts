import axios from "axios";

export async function installPluginFile(type: "node" | "tool" | "skill" | "agent", file: File, force = false) {
  if (!file.size || file.size > 20 * 1024 * 1024) throw new Error("请选择非空且不超过 20 MB 的插件文件");
  const payload = type === "skill" || type === "agent"
    ? { fileName: file.name, base64: await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",", 2)[1]!);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      }) }
    : { fileName: file.name, source: await file.text() };
  const { data } = await axios.post(`/api/${type}s/install`, { ...payload, force }, { headers: { "x-toonflow-workspace": "1" } });
  if (data.code !== 200) throw new Error(data.message || "安装插件失败");
  const name = data.data?.name;
  if (typeof name !== "string" || !name.trim()) throw new Error("安装接口未返回有效的插件名称");
  window.dispatchEvent(new CustomEvent("toonflow:plugin-installed", { detail: { type, name } }));
  return name;
}
