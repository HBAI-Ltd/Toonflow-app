import DOMPurify from "dompurify";
import { marked, Renderer } from "marked";

export interface MarkdownFiles {
  read(path: string): Promise<ArrayBuffer>;
  acquireUrl?(path: string, mimeType?: string): { url: Promise<string>; release(): void };
  mkdir?(path: string): Promise<void>;
  write?(path: string, content: string | Blob | ArrayBuffer, exclusive?: boolean, signal?: AbortSignal): Promise<void>;
}
export function resolveMarkdownPath(source: string, documentPath = "") {
  if (/^(?:https?:|mailto:|#)/i.test(source)) return;
  if (/^(?:[a-z][a-z\d+.-]*:|[\\/])/i.test(source)) throw new Error("文件路径必须位于工作区内");
  const path = decodeURIComponent(source.split(/[?#]/)[0]!).replaceAll("\\", "/");
  if (!path || /^(?:[a-z][a-z\d+.-]*:|\/)/i.test(path) || path.includes("\0")) throw new Error("文件路径无效");
  const parts = documentPath.replaceAll("\\", "/").split("/").slice(0, -1);
  for (const part of path.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (!parts.length) throw new Error("文件路径超出工作区");
      parts.pop();
    } else parts.push(part);
  }
  return parts.join("/");
}

function protectHtmlCode(text: string) {
  if (!/<pre\b/i.test(text)) return text;
  const source = text.replace(/\r\n?/g, "\n");
  const segments: string[] = [];
  const closing = /<\/pre\s*>/gi;
  let position = 0;
  let copied = 0;
  for (const token of marked.lexer(source, { gfm: true })) {
    const start = source.indexOf(token.raw, position);
    if (start < 0) continue;
    position = start + token.raw.length;
    if (token.type !== "html") continue;
    for (const opening of token.raw.matchAll(/<pre\b[^>]*>/gi)) {
      const from = start + opening.index;
      if (from < copied) continue;
      closing.lastIndex = from + opening[0].length;
      const end = closing.exec(source);
      if (!end) continue;
      const to = end.index + end[0].length;
      segments.push(source.slice(copied, from), source.slice(from, to).replaceAll("\n", "&#10;"));
      copied = to;
    }
  }
  // ACT: 只保护顶层 HTML token 内开始的 pre；代码围栏及引用代码中的字面 HTML 不参与转换。
  return segments.length ? segments.join("") + source.slice(copied) : text;
}

export interface SourceBlocks { leading: string; trailing: string; blocks: { key: string; gap: string; raw: string }[] }

const letters = (text: string) => text.replace(/[^\p{L}\p{N}]/gu, "");

// 记录每个顶层块的原文和块间空白，key 为该块当前的序列化结果；块数与编辑器顶层节点对不上（任务列表拆分、HTML 等）时返回 undefined，整篇重新序列化。
export function captureSourceBlocks(text: string, keys: string[]): SourceBlocks | undefined {
  const source = text.replace(/\r\n?/g, "\n");
  const tokens = marked.lexer(source, { gfm: true });
  if (tokens.map(token => token.raw).join("") !== source) return;
  const blocks: SourceBlocks["blocks"] = [];
  let position = 0;
  let end = 0;
  for (const token of tokens) {
    const start = position;
    position += token.raw.length;
    // 链接引用定义不生成节点，随空白留在相邻块之间。
    if (token.type === "space" || token.type === "def") continue;
    const raw = token.raw.replace(/\n+$/, "");
    const key = keys[blocks.length] ?? "";
    // 块数相同不代表一一对应（如某块不生成节点、另一块拆成两个）；去掉标记后文字对不上就放弃保留，避免把原文接到别的块上。
    if (letters(key) !== letters(raw)) return;
    blocks.push({ key, gap: source.slice(end, start), raw });
    end = start + raw.length;
  }
  if (!blocks.length || blocks.length !== keys.length) return;
  const leading = blocks[0]!.gap;
  blocks[0]!.gap = "";
  return { leading, trailing: source.slice(end).replace(/\n+$/, ""), blocks };
}

// 只替换首尾都未变化的块之间的区段；被替换的第一个块沿用原有间隔，新增块用空行分隔。
// ACT: 按最长公共前后缀比对，一次会话里相隔很远的两处修改之间的块也会重新序列化；需要更精细时再改为逐块 LCS 对齐。
export function mergeSourceBlocks({ leading, trailing, blocks }: SourceBlocks, keys: string[]): SourceBlocks {
  let start = 0;
  while (start < blocks.length && start < keys.length && blocks[start]!.key === keys[start]) start++;
  let end = 0;
  while (end < blocks.length - start && end < keys.length - start && blocks[blocks.length - 1 - end]!.key === keys[keys.length - 1 - end]) end++;
  const changed = keys.slice(start, keys.length - end).map((key, index) => ({
    key, raw: key, gap: index === 0 && start < blocks.length - end ? blocks[start]!.gap : "\n\n",
  }));
  return { leading, trailing, blocks: [...blocks.slice(0, start), ...changed, ...blocks.slice(blocks.length - end)] };
}

export function joinSourceBlocks({ leading, trailing, blocks }: SourceBlocks) {
  return leading + blocks.map((block, index) => (index ? block.gap || "\n\n" : "") + block.raw).join("") + trailing;
}

export function markdownDom(text: string) {
  const renderer = new Renderer();
  const renderCode = renderer.code;
  renderer.code = function(token) { return renderCode.call(this, token).replace("<pre>", `<pre data-markdown-trim="${!token.text.endsWith("\n")}">`); };
  const dom = DOMPurify.sanitize(marked.parse(protectHtmlCode(text), { async: false, gfm: true, renderer }), {
    RETURN_DOM: true, USE_PROFILES: { html: true }, FORBID_TAGS: ["style", "form"],
  }) as HTMLElement;
  for (const element of dom.querySelectorAll<HTMLElement>("[style]")) {
    const alignment = element.style.textAlign;
    element.removeAttribute("style");
    if (["left", "center", "right", "justify"].includes(alignment)) element.style.textAlign = alignment;
  }
  // marked 用 encodeURI 处理链接，中文路径和锚点保存时会变成百分号编码；只还原多字节 UTF-8 序列，%20 等 ASCII 转义保持原样。
  for (const element of dom.querySelectorAll<HTMLElement>("a[href], img[src]")) {
    const name = element.tagName === "A" ? "href" : "src";
    element.setAttribute(name, element.getAttribute(name)!.replace(/%[c-f][\da-f](?:%[89ab][\da-f])+/gi, sequence => {
      try { return decodeURIComponent(sequence); }
      catch { return sequence; }
    }));
  }
  for (const link of dom.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    link.rel = "noopener noreferrer";
    if (/^https?:/i.test(link.getAttribute("href") || "")) link.target = "_blank";
  }
  return dom;
}

export function loadMarkdownImage(element: HTMLImageElement, source: string, path: string, files?: MarkdownFiles) {
  let cancelled = false;
  let release = () => {};
  element.removeAttribute("src");
  try {
    if (/^https?:\/\//i.test(source)) { element.src = source; return release; }
    const relative = resolveMarkdownPath(source, path);
    if (!relative || !files) throw new Error("当前宿主无法读取文档图片");
    const mimeTypes: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml", avif: "image/avif", bmp: "image/bmp", ico: "image/x-icon" };
    const mime = mimeTypes[relative.split(".").at(-1)?.toLowerCase() || ""] || "application/octet-stream";
    const shared = files.acquireUrl?.(relative, mime);
    if (shared) release = shared.release;
    const pending = shared?.url ?? files.read(relative).then(bytes => {
      const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
      if (cancelled) URL.revokeObjectURL(url);
      else release = () => URL.revokeObjectURL(url);
      return url;
    });
    void pending.then(url => { if (!cancelled) element.src = url; }, () => { if (!cancelled) element.title = "图片读取失败"; });
  } catch (error) { element.title = error instanceof Error ? error.message : "图片读取失败"; }
  return () => { cancelled = true; release(); };
}
