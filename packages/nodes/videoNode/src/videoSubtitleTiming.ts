const timing = /^((?:\d+:)?\d{2}:\d{2}[.,]\d{3})\s+-->\s+((?:\d+:)?\d{2}:\d{2}[.,]\d{3})([^\n]*)$/;
function seconds(value: string) { return value.replace(",", ".").split(":").reduce((n, part) => n * 60 + Number(part), 0); }
export function timestamp(value: number) {
  const ms = Math.round(value * 1000);
  return [Math.floor(ms / 3600000), Math.floor(ms / 60000) % 60, Math.floor(ms / 1000) % 60].map(n => String(n).padStart(2, "0")).join(":")
    + "." + String(ms % 1000).padStart(3, "0");
}
export function readSubtitleCues(input: string, requireAll = false) {
  const parts = input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split(/\n[ \t]*\n/);
  const cues = parts.flatMap(part => {
    const lines = part.trim().split("\n");
    const index = lines.findIndex(line => timing.test(line)), match = index >= 0 ? lines[index]!.match(timing) : undefined;
    if (!match) return [];
    const start = seconds(match[1]!), end = seconds(match[2]!), text = lines.slice(index + 1).join("\n");
    return end > start && text ? [{ start, end, settings: match[3] || "", text }] : [];
  });
  if (!cues.length || (requireAll && cues.length !== parts.filter(part => part.trim()).length)) throw new Error("未读取到有效字幕，请选用 UTF-8 编码的 SRT 或 WebVTT 文件");
  return cues;
}
