/**
 * i18n:check-glossary — cổng kiểm tra nhất quán chú giải GIỮA các file sidecar.
 *
 * `i18n-check-sidecars.ts` kiểm từng file so với bản gốc CỦA CHÍNH NÓ: literal còn đủ,
 * cấu trúc khớp, ngân sách CJK không tăng. Nó mù hoàn toàn với lỗi *giữa các file* — và đó
 * đúng là lớp lỗi mà việc chia batch dịch song song tạo ra: nhất quán trong một batch thì có
 * người lo, nhất quán giữa các batch thì không ai lo.
 *
 * Script này gom mọi cặp **(chuỗi zh, chú giải đi kèm)** trong toàn bộ sidecar rồi báo hai
 * loại xung đột:
 *
 *   Loại 2 — NHIỀU chuỗi zh khác nhau dùng CHUNG một chú giải trong cùng một locale.
 *            Ví dụ thật: `近景` và `特写` cùng ra "close-up". Model đọc bảng đó không phân
 *            biệt được hai giá trị nữa, nên loại này nguy hiểm hơn và in TRƯỚC.
 *   Loại 1 — MỘT chuỗi zh mang nhiều chú giải khác nhau trong cùng một locale.
 *            Ví dụ thật: `古风` ra "cổ phong" ở phong cách này, "cổ trang" ở phong cách kia.
 *            Loại này không phải lúc nào cũng là lỗi: cùng một chuỗi có thể mang nghĩa khác
 *            nhau theo ngữ cảnh, nên cần người phân xử.
 *
 * Chú giải được so khớp sau khi chuẩn hoá: bỏ khoảng trắng thừa, hạ chữ thường, chuẩn hoá
 * NFC. Cố ý KHÔNG mờ hơn thế — "close-up" và "close up" là hai cách viết khác nhau của cùng
 * một khái niệm và đáng bị báo.
 *
 * Kèm theo là một lượt đếm E2: các giá trị cột `景别`/`运镜` CHƯA đăng ký trong
 * `docs/i18n/prompt-terms.json` (`手持微晃`, `跟拍`, `空镜`…). Phán quyết đã chốt là giữ
 * tiếng Trung TOÀN BỘ cột đó để cột không bị trộn hai ngôn ngữ, nhưng phán quyết ra đời sau
 * khi vài phong cách đã dịch xong — nên số đếm trong sidecar THẤP HƠN bản gốc nghĩa là token
 * đã bị dịch mất. Cổng kia không bắt được vì các token này không nằm trong registry.
 *
 * Chạy `tsx scripts/i18n-check-glossary.ts` để in báo cáo (luôn exit 0), thêm `--strict` để
 * exit 1 khi còn xung đột. Tách hai chế độ có lý do: lần chạy đầu chắc chắn có nhiễu cần
 * người phân xử, và một script chặn ngay từ đầu sẽ chỉ khiến người ta bỏ qua nó.
 *
 * `--paths <glob-hoặc-đường-dẫn>...` giới hạn phạm vi giống `i18n-check-sidecars.ts`.
 */
import fs from "node:fs";
import path from "node:path";

import { SKILLS_DIR_NAME, findSkillOriginals, matchesPathFilters, occurrences } from "./i18n-check-sidecars";

export type Locale = "en" | "vi";

/** Một lần chú giải xuất hiện: chuỗi zh, chú giải đi kèm, và chỗ tìm thấy. */
export type GlossOccurrence = {
  file: string;
  locale: Locale;
  zh: string;
  gloss: string;
  /** Dạng đã chuẩn hoá của `gloss`, dùng để so khớp. */
  normalized: string;
  line: number;
};

/** Loại 2 — một chú giải bị nhiều chuỗi zh khác nhau dùng chung. */
export type SharedGlossConflict = {
  locale: Locale;
  gloss: string;
  zhVariants: Array<{ zh: string; occurrences: GlossOccurrence[] }>;
};

/** Loại 1 — một chuỗi zh mang nhiều chú giải khác nhau. */
export type SplitGlossConflict = {
  locale: Locale;
  zh: string;
  glossVariants: Array<{ gloss: string; occurrences: GlossOccurrence[] }>;
};

export type GlossConflicts = { sharedGloss: SharedGlossConflict[]; splitGloss: SplitGlossConflict[] };

/**
 * E2 — các giá trị cột `景别` / `运镜` chưa có trong `docs/i18n/prompt-terms.json`. Chúng
 * phải được giữ nguyên tiếng Trung theo quy ước đã chốt, nhưng registry không phủ nên
 * `i18n:check-sidecars` không canh giúp.
 */
export const UNREGISTERED_SHOT_TOKENS = ["手持微晃", "稳定器流动", "跟拍", "空镜", "大远景", "中近景", "缓拉", "大全景", "一镜到底"];

export type TokenLossRow = { file: string; token: string; zh: number; en: number; vi: number };

const CJK_CHAR = /[一-鿿]/;
const CJK_ONLY = /^[一-鿿·]+$/;
const HAS_LETTER = /\p{L}/u;
/** Ký tự được phép nằm trong một chú giải khi quét ngược từ dấu ngoặc mở. */
const GLOSS_CHAR = /[\p{L}\p{M}\d \-/'’*_]/u;
/** Chú giải dài hơn ngần này từ thì gần như chắc chắn là văn xuôi, không phải chú giải. */
const MAX_GLOSS_WORDS = 6;
const PAREN = /[(（]([^()（）]*)[)）]/g;

/** Chuẩn hoá chú giải để so khớp: NFC, hạ chữ thường, gộp khoảng trắng. Cố ý không mờ hơn. */
export function normalizeGloss(gloss: string): string {
  return gloss.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Gọt dấu nhấn mạnh markdown và dấu đầu mục khỏi hai đầu chú giải quét được. */
function trimGloss(raw: string): string {
  return raw
    .replace(/^[\s*_>-]+/, "")
    .replace(/[\s*_]+$/, "")
    .trim();
}

/**
 * Trích các cặp (chuỗi zh, chú giải) trong một file, theo cả hai hướng mà quy ước cho phép:
 *
 *   `Wide shot (全景)`  → chú giải đứng trước, tiếng Trung trong ngoặc
 *   `已完成 (completed)` → tiếng Trung đứng trước, chú giải trong ngoặc
 *
 * Bỏ qua nội dung bên trong khối code: ở đó tiếng Trung đứng một mình làm ví dụ đầu ra mà
 * model sao chép nguyên dạng, không phải chú giải.
 */
export function extractGlossPairs(text: string): Array<{ zh: string; gloss: string; line: number }> {
  const pairs: Array<{ zh: string; gloss: string; line: number }> = [];
  let inFence = false;
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    PAREN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = PAREN.exec(line)) !== null) {
      const inner = m[1].trim();
      const before = line.slice(0, m.index);
      if (inner === "") continue;

      if (CJK_ONLY.test(inner)) {
        // Hướng 1: chú giải đứng trước, tiếng Trung trong ngoặc.
        let j = before.length - 1;
        while (j >= 0 && GLOSS_CHAR.test(before[j]) && !CJK_CHAR.test(before[j])) j--;
        const gloss = trimGloss(before.slice(j + 1));
        if (!HAS_LETTER.test(gloss)) continue;
        if (gloss.split(/\s+/).length > MAX_GLOSS_WORDS) continue;
        pairs.push({ zh: inner.normalize("NFC"), gloss, line: i + 1 });
      } else if (!CJK_CHAR.test(inner)) {
        // Hướng 2: tiếng Trung đứng trước, chú giải trong ngoặc.
        let j = before.length - 1;
        while (j >= 0 && /[\s*_]/.test(before[j])) j--;
        const end = j;
        while (j >= 0 && CJK_CHAR.test(before[j])) j--;
        const zh = before.slice(j + 1, end + 1).trim();
        if (zh === "") continue;
        const gloss = trimGloss(inner);
        if (!HAS_LETTER.test(gloss) || gloss.length < 2) continue;
        if (gloss.split(/\s+/).length > MAX_GLOSS_WORDS) continue;
        pairs.push({ zh: zh.normalize("NFC"), gloss, line: i + 1 });
      }
    }
  }
  return pairs;
}

const groupBy = <T>(items: T[], key: (item: T) => string): Map<string, T[]> => {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const bucket = map.get(k);
    if (bucket) bucket.push(item);
    else map.set(k, [item]);
  }
  return map;
};

/**
 * Tìm hai loại xung đột. So sánh luôn TRONG cùng một locale: en và vi dùng chung một chú
 * giải là chuyện bình thường (nhiều thuật ngữ điện ảnh tiếng Việt mượn nguyên tiếng Anh),
 * không phải lỗi.
 */
export function findGlossConflicts(items: GlossOccurrence[]): GlossConflicts {
  const sharedGloss: SharedGlossConflict[] = [];
  const splitGloss: SplitGlossConflict[] = [];

  for (const [, bucket] of groupBy(items, (o) => `${o.locale} ${o.normalized}`)) {
    const byZh = groupBy(bucket, (o) => o.zh);
    if (byZh.size < 2) continue;
    sharedGloss.push({
      locale: bucket[0].locale,
      gloss: bucket[0].normalized,
      zhVariants: [...byZh.entries()].map(([zh, occ]) => ({ zh, occurrences: occ })).sort((a, b) => a.zh.localeCompare(b.zh)),
    });
  }

  for (const [, bucket] of groupBy(items, (o) => `${o.locale} ${o.zh}`)) {
    const byGloss = groupBy(bucket, (o) => o.normalized);
    if (byGloss.size < 2) continue;
    splitGloss.push({
      locale: bucket[0].locale,
      zh: bucket[0].zh,
      glossVariants: [...byGloss.entries()]
        .map(([gloss, occ]) => ({ gloss, occurrences: occ }))
        .sort((a, b) => b.occurrences.length - a.occurrences.length || a.gloss.localeCompare(b.gloss)),
    });
  }

  const bySize = (a: { locale: Locale }, b: { locale: Locale }) => a.locale.localeCompare(b.locale);
  return {
    sharedGloss: sharedGloss.sort((a, b) => bySize(a, b) || a.gloss.localeCompare(b.gloss)),
    splitGloss: splitGloss.sort((a, b) => bySize(a, b) || a.zh.localeCompare(b.zh)),
  };
}

const toPosix = (p: string) => p.split(path.sep).join("/");

/** Mọi bộ ba khớp `pathFilters` và có đủ cả hai sidecar, dạng (đường dẫn tương đối, locale). */
function eachSidecar(root: string, skillsDir: string, pathFilters: string[]): Array<{ absZh: string; relZh: string }> {
  const out: Array<{ absZh: string; relZh: string }> = [];
  for (const absZh of findSkillOriginals(skillsDir)) {
    const relZh = toPosix(path.relative(root, absZh));
    if (!matchesPathFilters(relZh, pathFilters)) continue;
    out.push({ absZh, relZh });
  }
  return out;
}

export type GlossaryReport = { occurrences: GlossOccurrence[]; conflicts: GlossConflicts };

/** E1 — quét toàn bộ sidecar rồi tìm xung đột. */
export function scanGlossary(root: string, skillsDir: string, pathFilters: string[] = []): GlossaryReport {
  const items: GlossOccurrence[] = [];
  for (const { absZh } of eachSidecar(root, skillsDir, pathFilters)) {
    const base = absZh.slice(0, -".md".length);
    for (const locale of ["en", "vi"] as const) {
      const sidecarPath = `${base}.${locale}.md`;
      if (!fs.existsSync(sidecarPath)) continue;
      const text = fs.readFileSync(sidecarPath, "utf8");
      const relSidecar = toPosix(path.relative(root, sidecarPath));
      for (const pair of extractGlossPairs(text)) {
        items.push({ file: relSidecar, locale, zh: pair.zh, gloss: pair.gloss, normalized: normalizeGloss(pair.gloss), line: pair.line });
      }
    }
  }
  return { occurrences: items, conflicts: findGlossConflicts(items) };
}

/**
 * E2 — đếm `tokens` trong bản gốc và trong hai sidecar của nó. Chỉ trả về hàng nào có số
 * đếm sidecar THẤP HƠN bản gốc: đó là token đã bị dịch mất. Cao hơn thì không báo — một
 * bản dịch có thể phải nhắc lại token ở chỗ chú giải, và đó không phải mất mát.
 */
export function countUnregisteredTokens(root: string, skillsDir: string, tokens: string[], pathFilters: string[] = []): TokenLossRow[] {
  const rows: TokenLossRow[] = [];
  for (const { absZh, relZh } of eachSidecar(root, skillsDir, pathFilters)) {
    const base = absZh.slice(0, -".md".length);
    const enPath = `${base}.en.md`;
    const viPath = `${base}.vi.md`;
    if (!fs.existsSync(enPath) || !fs.existsSync(viPath)) continue;
    const zhText = fs.readFileSync(absZh, "utf8");
    const enText = fs.readFileSync(enPath, "utf8");
    const viText = fs.readFileSync(viPath, "utf8");
    for (const token of tokens) {
      const zh = occurrences(token, zhText);
      if (zh === 0) continue;
      const en = occurrences(token, enText);
      const vi = occurrences(token, viText);
      if (en < zh || vi < zh) rows.push({ file: relZh, token, zh, en, vi });
    }
  }
  return rows;
}

const where = (occ: GlossOccurrence[]): string =>
  occ
    .slice(0, 4)
    .map((o) => `${o.file}:${o.line}`)
    .join(", ") + (occ.length > 4 ? `, … (+${occ.length - 4})` : "");

/** Báo cáo E1. Loại 2 in TRƯỚC loại 1 vì nó nguy hiểm hơn: model mất khả năng phân biệt hai giá trị. */
export function formatGlossaryReport(conflicts: GlossConflicts): string {
  const lines: string[] = [];

  lines.push(`## Loại 2 — nhiều chuỗi zh khác nhau, cùng một chú giải (${conflicts.sharedGloss.length})`);
  lines.push("");
  if (conflicts.sharedGloss.length === 0) lines.push("  (không có)");
  for (const c of conflicts.sharedGloss) {
    lines.push(`  [${c.locale}] "${c.gloss}" ← ${c.zhVariants.map((v) => v.zh).join(" / ")}`);
    for (const v of c.zhVariants) lines.push(`      ${v.zh} (${v.occurrences.length}×): ${where(v.occurrences)}`);
  }

  lines.push("");
  lines.push(`## Loại 1 — một chuỗi zh, nhiều chú giải khác nhau (${conflicts.splitGloss.length})`);
  lines.push("");
  if (conflicts.splitGloss.length === 0) lines.push("  (không có)");
  for (const c of conflicts.splitGloss) {
    lines.push(`  [${c.locale}] ${c.zh} → ${c.glossVariants.map((v) => `"${v.gloss}" (${v.occurrences.length}×)`).join(" | ")}`);
    for (const v of c.glossVariants) lines.push(`      "${v.gloss}": ${where(v.occurrences)}`);
  }

  return lines.join("\n");
}

/** Bảng E2: file, token, số đếm gốc / en / vi. */
export function formatTokenLossTable(rows: TokenLossRow[]): string {
  const lines = [`## E2 — giá trị 景别/运镜 chưa đăng ký bị dịch mất (${rows.length})`, ""];
  if (rows.length === 0) {
    lines.push("  (không có — mọi giá trị chưa đăng ký đều được giữ nguyên tiếng Trung)");
    return lines.join("\n");
  }
  lines.push("| file | token | zh | en | vi |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const r of rows) lines.push(`| ${r.file} | ${r.token} | ${r.zh} | ${r.en} | ${r.vi} |`);
  return lines.join("\n");
}

function parsePathsArg(argv: string[]): string[] {
  const idx = argv.indexOf("--paths");
  if (idx === -1) return [];
  const paths: string[] = [];
  for (const arg of argv.slice(idx + 1)) {
    if (arg.startsWith("--")) break;
    paths.push(arg);
  }
  return paths;
}

function main(): void {
  const root = process.cwd();
  const skillsDir = path.join(root, SKILLS_DIR_NAME);
  const pathFilters = parsePathsArg(process.argv);

  const report = scanGlossary(root, skillsDir, pathFilters);
  const lossRows = countUnregisteredTokens(root, skillsDir, UNREGISTERED_SHOT_TOKENS, pathFilters);

  console.log(formatGlossaryReport(report.conflicts));
  console.log("");
  console.log(formatTokenLossTable(lossRows));

  const total = report.conflicts.sharedGloss.length + report.conflicts.splitGloss.length;
  console.log(
    `\n[i18n:check-glossary] ${report.occurrences.length} cặp (zh, chú giải) trong phạm vi quét, ` +
      `${total} xung đột, ${lossRows.length} hàng E2.`,
  );

  if (process.argv.includes("--strict") && total > 0) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith(path.join("scripts", "i18n-check-glossary.ts"))) {
  main();
}
