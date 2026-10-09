import axios from "axios";

export const isDesktopClipboard = new URLSearchParams(window.location.search).get("desktop") === "1";
const headers = { "x-toonflow-desktop": "1" };

export async function readClipboardText(): Promise<string> {
  if (!isDesktopClipboard) return navigator.clipboard.readText();
  const { data } = await axios.post<{ code: number; data: { text: string }; message: string }>("/api/desktop/clipboard/read", {}, { headers });
  if (data.code !== 200) throw new Error(data.message || "读取剪贴板失败");
  return data.data.text;
}

export async function readClipboardImage(): Promise<Blob | null> {
  if (isDesktopClipboard) {
    const { data } = await axios.post<{ code: number; data: { image: string | null }; message: string }>("/api/desktop/clipboard/read", { format: "image" }, { headers });
    if (data.code !== 200) throw new Error(data.message || "读取剪贴板图片失败");
    if (!data.data.image) return null;
    const binary = atob(data.data.image);
    return new Blob([Uint8Array.from(binary, (char) => char.charCodeAt(0))], { type: "image/png" });
  }
  if (!navigator.clipboard?.read) throw new Error("当前环境不支持读取剪贴板图片");
  for (const item of await navigator.clipboard.read()) {
    const imageType = item.types.find((type) => type.startsWith("image/"));
    if (imageType) return item.getType(imageType);
  }
  return null;
}

function clipboardFile(type: string, base64: string, name: string) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new File([bytes], name, { type });
}

export async function readClipboardFiles(): Promise<File[]> {
  if (isDesktopClipboard) {
    const { data } = await axios.post<{ code: number; data: { files: { name: string; mimeType: string; data: string }[] }; message: string }>(
      "/api/desktop/clipboard/read",
      { format: "files" },
      { headers }
    );
    if (data.code !== 200) throw new Error(data.message || "读取剪贴板文件失败");
    return data.data.files.map(file => clipboardFile(file.mimeType, file.data, file.name));
  }
  if (!navigator.clipboard?.read) throw new Error("当前环境不支持读取剪贴板文件");
  const files: File[] = [];
  for (const item of await navigator.clipboard.read()) {
    for (const type of item.types.filter(type => /^(image|audio|video)\//.test(type))) {
      const extension = type.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "bin";
      files.push(new File([await item.getType(type)], "pasted-media-" + (files.length + 1) + "." + extension, { type }));
    }
  }
  return files;
}

function blobBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error ?? new Error("图片读取失败"));
    reader.readAsDataURL(blob);
  });
}

async function imagePngBlob(image: Blob) {
  if (image.type === "image/png") return image;
  const bitmap = await createImageBitmap(image);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("当前环境无法处理图片");
    context.drawImage(bitmap, 0, 0);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("图片转换失败")), "image/png"));
  } finally {
    bitmap.close();
  }
}
export async function writeClipboardImage(image: Blob): Promise<void> {
  if (isDesktopClipboard) {
    const { data } = await axios.post<{ code: number; message: string }>("/api/desktop/clipboard/write", {
      format: "image",
      image: await blobBase64(image),
    }, { headers });
    if (data.code !== 200) throw new Error(data.message || "写入剪贴板图片失败");
    return;
  }
  if (!navigator.clipboard?.write) throw new Error("当前环境不支持写入剪贴板图片");
  await navigator.clipboard.write([new ClipboardItem({ "image/png": await imagePngBlob(image) })]);
}
export async function writeClipboardText(text: string): Promise<void> {
  if (!isDesktopClipboard) return navigator.clipboard.writeText(text);
  const { data } = await axios.post<{ code: number; message: string }>("/api/desktop/clipboard/write", { text }, { headers });
  if (data.code !== 200) throw new Error(data.message || "写入剪贴板失败");
}
