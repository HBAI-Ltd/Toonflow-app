export const mediaMimeTypes: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif",
  avif: "image/avif", apng: "image/apng", bmp: "image/bmp", svg: "image/svg+xml", ico: "image/x-icon",
  tif: "image/tiff", tiff: "image/tiff", heic: "image/heic", heif: "image/heif",
  mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm", mov: "video/quicktime", mkv: "video/x-matroska", avi: "video/x-msvideo", ts: "video/mp2t", ogv: "video/ogg",
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", opus: "audio/ogg", flac: "audio/flac", m4a: "audio/mp4", aac: "audio/aac", pcm: "audio/pcm",
};

export function getMediaMimeType(file: Pick<File, "name" | "type">) {
  const type = file.type.split(";")[0]?.trim().toLowerCase() ?? "";
  return !type || type === "application/octet-stream" ? mediaMimeTypes[file.name.split(".").at(-1)?.toLowerCase() ?? ""] ?? type : type;
}

export function acceptsMediaFile(accept: string, file: Pick<File, "name" | "type">) {
  const mime = getMediaMimeType(file);
  const name = file.name.toLowerCase();
  return accept.toLowerCase().split(",").some(part => {
    const value = part.trim();
    if (value.startsWith(".")) return name.endsWith(value);
    if (value.endsWith("/*")) return mime.startsWith(value.slice(0, -1));
    return value !== "" && value === mime;
  });
}
