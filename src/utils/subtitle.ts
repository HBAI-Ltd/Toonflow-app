/**
 * 字幕与台词处理工具（借鉴 huobao-drama 的 TTS/字幕管线）
 *
 * - extractDialogue：从分镜 videoDesc 中提取「台词：xxx」标注的台词，过滤无台词标记
 * - buildSrt：按 4 字/秒的节奏把台词切分为字幕片段并生成 SRT 文本
 */

// 与 huobao-drama 一致的「无对白」判定
const IGNORE_TEXT = /^(无|无台词|无对白|无旁白|无需配音|none|null|n\/a|环境音|环境声|音效|效果音|纯音效|背景音|背景音乐|bgm|sfx|ambient)$/i;

/**
 * 从 videoDesc 文本中提取台词。
 * 分镜表 skill 约定台词以「台词：」标注（无台词时为「台词：无」或「无台词」）。
 */
export function extractDialogue(videoDesc: string | null | undefined): string {
  if (!videoDesc) return "";
  const match = videoDesc.match(/台词[：:]\s*([^。\n]*)/);
  if (!match) return "";
  const text = match[1].trim().replace(/^[「『"“]|[」』"”]$/g, "");
  if (!text || IGNORE_TEXT.test(text)) return "";
  return text;
}

/** 判断一段台词是否可忽略（无对白/纯音效等） */
export function isIgnorableDialogue(text: string | null | undefined): boolean {
  const trimmed = (text ?? "").trim();
  return !trimmed || IGNORE_TEXT.test(trimmed);
}

interface SrtSegment {
  text: string;
  start: number;
  end: number;
}

const MAX_LINE_CHARS = 20;

/** 把台词按标点切分为不超过 MAX_LINE_CHARS 的片段 */
function splitDialogue(text: string): string[] {
  const sentences = text
    .split(/[。！？!?；;\n｜|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const segments: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= MAX_LINE_CHARS) {
      segments.push(sentence);
      continue;
    }
    // 超长句先按逗号切，仍超长则硬切
    const parts = sentence.split(/[，,、]/).map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      for (let i = 0; i < part.length; i += MAX_LINE_CHARS) {
        segments.push(part.slice(i, i + MAX_LINE_CHARS));
      }
    }
  }
  return segments;
}

function formatSrtTime(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = Math.floor(clamped % 60);
  const ms = Math.round((clamped - Math.floor(clamped)) * 1000);
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

/**
 * 生成 SRT 字幕文本。
 * 时间按各片段字数占比分配到总时长（约 4 字/秒的阅读节奏，受总时长约束）。
 * @param text 完整台词
 * @param totalDuration 视频总时长（秒）
 * @returns SRT 文本；无有效台词时返回空字符串
 */
export function buildSrt(text: string, totalDuration: number): string {
  if (isIgnorableDialogue(text) || totalDuration <= 0) return "";
  const lines = splitDialogue(text);
  if (!lines.length) return "";

  const totalChars = lines.reduce((acc, line) => acc + line.length, 0);
  // 理想时长 = 字数 / 4字每秒，超出视频时长则压缩到视频时长
  const idealDuration = totalChars / 4;
  const usableDuration = Math.min(idealDuration, totalDuration);

  const segments: SrtSegment[] = [];
  let cursor = 0;
  for (const line of lines) {
    const duration = (line.length / totalChars) * usableDuration;
    segments.push({ text: line, start: cursor, end: Math.min(cursor + duration, totalDuration) });
    cursor += duration;
  }

  return segments
    .map((seg, i) => `${i + 1}\n${formatSrtTime(seg.start)} --> ${formatSrtTime(seg.end)}\n${seg.text}\n`)
    .join("\n");
}
