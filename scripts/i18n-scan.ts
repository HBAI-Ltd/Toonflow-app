import fs from "fs";
import path from "path";
import fg from "fast-glob";
import { extractLiteralTerms, stripLiteralTerms, TERMS_PATH } from "./i18n-check-sidecars";

export interface CjkHit {
  file?: string;
  line: number;
  text: string;
}

export interface ScanOptions {
  stripComments: boolean;
  /**
   * Set of JSON keys whose value line is deliberately exempt from the scan — for locale
   * catalog entries that legitimately embed CJK characters (e.g. a regex example inside a
   * translated string). Plain JSON has no comment syntax, so the usual i18n-ignore pragma
   * can't be placed inline without leaking literal text into the translated value; this is
   * the "otherwise exempt" mechanism for that case. Matched against `"key":` at the start of
   * a line (this repo's locale JSON files are one key per line).
   */
  jsonKeyExemptions?: Set<string>;
  /**
   * `zh` forms of docs/i18n/prompt-terms.json entries with policy keep-zh-literal / never-translate
   * (read at runtime via extractLiteralTerms — never hardcode this list). data/skills/**\/README.{en,vi}.md
   * are required to carry these tokens verbatim (enforced by i18n:check-sidecars), so the scanner
   * must not flag them as untranslated. A CJK hit is suppressed only when it is made up ENTIRELY of
   * registered tokens once every occurrence is stripped out (nested tokens like 远景/大远景 handled by
   * stripLiteralTerms's longest-first removal, shared with i18n-check-sidecars). Any leftover CJK
   * outside a registered token (e.g. the "中" in "中近景", which is not itself a registered token even
   * though it contains the registered "近景") still gets reported — this must never blind the gate to
   * a real untranslated string just because part of it happens to overlap a registered token.
   */
  registeredTerms?: string[];
}

// Ranges: U+4E00-9FFF CJK Unified Ideographs, U+3000-303F CJK Symbols and Punctuation
// (fullwidth spaces/brackets/dots), U+FF00-FF60 Halfwidth and Fullwidth Forms (fullwidth
// ASCII punctuation, e.g. fullwidth parens/semicolon/comma).
// i18n-ignore — Unicode range boundaries for the scanner's own regex, not translatable text
const CJK = /[一-鿿　-〿＀-｠]+/g;
const IGNORE_PRAGMA = "i18n-ignore";

/**
 * Ký tự/token đứng trước dấu `/` khi dấu đó có thể là điểm bắt đầu một regex literal
 * (thay vì phép chia). Đây là heuristic kinh điển để phân biệt regex-literal và
 * division trong JS/TS mà không cần parser đầy đủ: nếu token có nghĩa gần nhất là
 * một trong các dấu câu/keyword "chờ biểu thức" này, `/` tiếp theo được coi là mở
 * đầu regex literal.
 */
const REGEX_PRECEDING_PUNCT = new Set([
  "(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";", "+", "-", "*", "/", "%", "^", "~", "<", ">",
]);
const REGEX_PRECEDING_KEYWORDS = new Set([
  "return", "typeof", "instanceof", "in", "of", "new", "delete", "void", "throw", "case", "yield", "await", "else", "do",
]);
const IDENT_CHAR = /[A-Za-z0-9_$]/;

/** Thay comment bằng khoảng trắng, giữ nguyên độ dài để số dòng không đổi. */
export function stripComments(source: string): string {
  let out = "";
  let i = 0;
  let quote: string | null = null;
  // Token có nghĩa gần nhất đã xử lý: ký tự dấu câu đơn, hoặc từ định danh/keyword.
  // null nghĩa là đầu file (regex literal được phép ngay từ đầu).
  let lastToken: string | null = null;

  const canStartRegex = () =>
    lastToken === null || REGEX_PRECEDING_PUNCT.has(lastToken) || REGEX_PRECEDING_KEYWORDS.has(lastToken);

  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];

    if (quote) {
      if (c === "\\") { out += source.slice(i, i + 2); i += 2; continue; }
      if (c === quote) { quote = null; lastToken = "STRING"; }
      out += c; i++; continue;
    }

    if (c === '"' || c === "'" || c === "`") { quote = c; out += c; i++; continue; }

    if (c === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") { out += " "; i++; }
      continue;
    }

    if (c === "/" && next === "*") {
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) {
        out += source[i] === "\n" ? "\n" : " ";
        i++;
      }
      out += "  "; i += 2; continue;
    }

    // Regex literal: /.../flags — bỏ qua nguyên khối để `'`/`"` bên trong (vd. trong
    // character class như /['"]/ ) không làm lệch pha bộ đếm quote ở trên.
    if (c === "/" && canStartRegex()) {
      const regexStart = i;
      let j = i + 1;
      let inClass = false;
      let closed = false;
      while (j < source.length) {
        const rc = source[j];
        if (rc === "\n") break; // regex literal không xuống dòng — không phải regex thật, bỏ cuộc
        if (rc === "\\") { j += 2; continue; }
        // Nếu dấu nháy này có một dấu nháy cùng loại "khớp cặp" trên cùng dòng, bỏ qua
        // nguyên chuỗi đó như một khối (vd. một URL như "http://x/y" nằm giữa hai dấu
        // `/` của một phép chia bị hiểu nhầm là regex) — nếu không, dấu `/` bên trong
        // chuỗi đó có thể bị coi nhầm là dấu đóng regex, trong khi dấu `/` đóng THẬT lại
        // nằm ngay sau chuỗi, trên cùng dòng. Nếu KHÔNG tìm được dấu nháy khớp cặp (vd.
        // regex /'/g chỉ chứa một dấu nháy đơn không cặp), coi nó là ký tự thường của
        // regex như hành vi gốc — bắt cặp một cách mù quáng ở đây từng khiến /'/g (có
        // thật trong data/vendor/volcengineSd2.ts) bị từ chối làm regex một cách sai.
        // Bỏ qua bước này khi đang trong character class `[...]` vì trong ngữ cảnh đó,
        // dấu nháy chỉ là ký tự thường của regex (vd. /['"]/), không mở một chuỗi mới.
        if (!inClass && (rc === '"' || rc === "'" || rc === "`")) {
          const q = rc;
          let k = j + 1;
          let matched = false;
          while (k < source.length && source[k] !== "\n") {
            if (source[k] === "\\") { k += 2; continue; }
            if (source[k] === q) { matched = true; k++; break; }
            k++;
          }
          if (matched) { j = k; continue; }
          j++; continue; // không có dấu nháy khớp cặp trên dòng này: coi q là ký tự thường
        }
        if (rc === "[") { inClass = true; j++; continue; }
        if (rc === "]") { inClass = false; j++; continue; }
        if (rc === "/" && !inClass) { j++; closed = true; break; }
        j++;
      }
      if (closed) {
        while (j < source.length && /[a-zA-Z]/.test(source[j])) j++;
        out += source.slice(regexStart, j);
        i = j;
        lastToken = "REGEX";
        continue;
      }
      // Không tìm được dấu `/` đóng trên cùng dòng: không phải regex literal (khả năng
      // cao là phép chia), xử lý `/` như ký tự bình thường và để vòng lặp tiếp tục.
    }

    if (IDENT_CHAR.test(c)) {
      let j = i;
      let word = "";
      while (j < source.length && IDENT_CHAR.test(source[j])) { word += source[j]; j++; }
      out += word;
      lastToken = word;
      i = j;
      continue;
    }

    if (!/\s/.test(c)) lastToken = c;
    out += c; i++;
  }
  return out;
}

interface ScanResult {
  hits: CjkHit[];
  suppressed: number;
  /** Of `suppressed`, how many were suppressed because they're entirely registered prompt-terms tokens. */
  registrySuppressed: number;
}

/**
 * Quét CJK, tách riêng các hit bị pragma i18n-ignore chặn.
 * Pragma luôn được kiểm tra trên dòng RAW (chưa strip comment), vì stripComments
 * xoá chính chữ "i18n-ignore" nếu nó nằm trong comment — kiểm tra trên text đã
 * strip sẽ khiến pragma không bao giờ có tác dụng với comment thật.
 */
function scanLines(source: string, opts: ScanOptions): ScanResult {
  const text = opts.stripComments ? stripComments(source) : source;
  const rawLines = source.split("\n");
  const lines = text.split("\n");
  const hits: CjkHit[] = [];
  let suppressed = 0;
  let registrySuppressed = 0;

  lines.forEach((line, idx) => {
    const lineHasPragma = rawLines[idx].includes(IGNORE_PRAGMA);
    const prevLineHasPragma = idx > 0 && rawLines[idx - 1].includes(IGNORE_PRAGMA);
    const keyMatch = opts.jsonKeyExemptions && rawLines[idx].match(/^\s*"([^"]+)":/);
    const keyExempt = !!(keyMatch && opts.jsonKeyExemptions!.has(keyMatch[1]));
    const ignored = lineHasPragma || prevLineHasPragma || keyExempt;

    for (const m of line.matchAll(CJK)) {
      if (ignored) {
        suppressed++;
        continue;
      }
      const registeredOnly =
        opts.registeredTerms !== undefined && stripLiteralTerms(m[0], opts.registeredTerms) === "";
      if (registeredOnly) {
        suppressed++;
        registrySuppressed++;
      } else {
        hits.push({ line: idx + 1, text: m[0] });
      }
    }
  });

  return { hits, suppressed, registrySuppressed };
}

export function scanText(source: string, opts: ScanOptions): CjkHit[] {
  return scanLines(source, opts).hits;
}

// Locale catalog entries that legitimately embed CJK characters (e.g. a Chinese chapter-marker
// regex example) inside an otherwise-translated en/vi string. See ScanOptions.jsonKeyExemptions.
const JSON_KEY_EXEMPTIONS = new Set(["agent.script.getAiRegex.systemPrompt"]);

export interface ScanTarget {
  glob: string;
  stripComments: boolean;
  jsonKeyExemptions?: Set<string>;
  /** Only set for the skill-sidecar targets — see ScanOptions.registeredTerms. */
  registeredTerms?: string[];
}

/**
 * Globs whose hits get filtered against docs/i18n/prompt-terms.json's registered literal
 * terms. Scoped deliberately: these are the translated skill sidecars that
 * i18n-check-sidecars.ts requires to carry keep-zh-literal / never-translate tokens verbatim.
 * Every other target (source code comments, top-level READMEs, locale catalogs) keeps the
 * old strict all-CJK-is-a-miss behavior — a registered term appearing there would be a
 * genuine translation gap, not a machine-matched token.
 */
const SKILL_SIDECAR_GLOBS = new Set(["data/skills/**/README.en.md", "data/skills/**/README.vi.md"]);

const TARGETS: ScanTarget[] = [
  { glob: "src/**/*.ts", stripComments: true },
  { glob: "data/vendor/*.ts", stripComments: true },
  { glob: "scripts/*.ts", stripComments: true },
  { glob: "README.md", stripComments: false },
  { glob: "docs/README.en.md", stripComments: false },
  { glob: "docs/README.vi.md", stripComments: false },
  { glob: "src/i18n/locales/en.json", stripComments: false, jsonKeyExemptions: JSON_KEY_EXEMPTIONS },
  { glob: "src/i18n/locales/vi.json", stripComments: false, jsonKeyExemptions: JSON_KEY_EXEMPTIONS },
  { glob: "data/skills/**/README.en.md", stripComments: false },
  { glob: "data/skills/**/README.vi.md", stripComments: false },
];

const IGNORE = ["src/i18n/locales/zh.json", "src/lib/vendor.json", "src/router.ts", "**/*.test.ts"];

/** Reads docs/i18n/prompt-terms.json under `root` and returns its registered literal `zh` terms. */
export function loadRegisteredTerms(root: string): string[] {
  const registry = JSON.parse(fs.readFileSync(path.join(root, TERMS_PATH), "utf8"));
  return extractLiteralTerms(registry);
}

/**
 * Runs every target glob (resolved relative to `root`) and returns all hits plus the
 * suppressed count. Pulled out of main() so tests can point it at a temp fixture directory
 * instead of the real repo tree.
 */
export async function runScan(
  root: string,
  targets: ScanTarget[] = TARGETS,
): Promise<{ hits: Required<CjkHit>[]; total: number; suppressed: number; registrySuppressed: number }> {
  const hits: Required<CjkHit>[] = [];
  let suppressed = 0;
  let registrySuppressed = 0;
  for (const target of targets) {
    const files = await fg(target.glob, { cwd: root, ignore: IGNORE, dot: false });
    for (const file of files.sort()) {
      const result = scanLines(fs.readFileSync(path.join(root, file), "utf-8"), {
        stripComments: target.stripComments,
        jsonKeyExemptions: target.jsonKeyExemptions,
        registeredTerms: target.registeredTerms,
      });
      suppressed += result.suppressed;
      registrySuppressed += result.registrySuppressed;
      for (const hit of result.hits) hits.push({ ...hit, file });
    }
  }
  return { hits, total: hits.length, suppressed, registrySuppressed };
}

async function main() {
  const root = process.cwd();
  const registeredTerms = loadRegisteredTerms(root);
  const targets = TARGETS.map((t) => (SKILL_SIDECAR_GLOBS.has(t.glob) ? { ...t, registeredTerms } : t));

  const { hits, total, suppressed, registrySuppressed } = await runScan(root, targets);
  for (const hit of hits) console.log(`${hit.file}:${hit.line}  ${hit.text}`);
  console.log(total === 0 ? "\nSạch: không còn CJK ngoài vùng cho phép." : `\nCòn ${total} chuỗi CJK.`);
  console.log(`Đã bỏ qua ${suppressed - registrySuppressed} chuỗi có pragma i18n-ignore.`);
  if (registrySuppressed > 0) {
    console.log(`Đã bỏ qua ${registrySuppressed} chuỗi vì là token đăng ký trong ${TERMS_PATH} (keep-zh-literal / never-translate).`);
  }
  process.exit(total === 0 ? 0 : 1);
}

if (require.main === module) main();
