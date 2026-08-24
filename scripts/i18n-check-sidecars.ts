/**
 * i18n:check-sidecars — cổng kiểm tra cơ học cho các file dịch skill (data/skills/**).
 *
 * `data/skills/**` (mọi `*.md`) là bản gốc tiếng Trung (KHÔNG BAO GIỜ sửa ở đây). Bản dịch nằm
 * cạnh nó dưới dạng sidecar: `foo.md` (zh) + `foo.en.md` + `foo.vi.md`. Script này chạy
 * năm kiểm tra trên từng bộ ba đã có đủ sidecar:
 *
 *   1. Bảo toàn literal (hard fail) — mọi entry trong docs/i18n/prompt-terms.json có
 *      policy keep-zh-literal / never-translate và zh chứa ký tự CJK phải xuất hiện
 *      đúng số lần trong bản dịch như trong bản gốc. Ngoại lệ: nếu docs/i18n/sidecar-budget.json
 *      ghi một `literalAllowance` cho file/locale/token đó (kèm `reason` không rỗng, do con
 *      người viết — không phải `--update` tự sinh), số lần bắt buộc là `expected` trong miễn
 *      trừ thay vì số đếm bản gốc. Dùng khi cùng một chuỗi vừa là giá trị vận máy vừa là từ
 *      thường trong văn xuôi ở file đó.
 *   2. Parity cấu trúc (hard fail) — số heading ATX (và chuỗi cấp), số dòng bảng, số
 *      hàng rào code, số token ảnh @图N/@图片N phải khớp giữa bản gốc và bản dịch. Nội
 *      dung bên trong khối code không tính vào heading/bảng.
 *   3. Ngân sách CJK còn sót (hard fail khi tăng) — sau khi xoá các literal term khỏi
 *      bản dịch, số ký tự CJK còn lại không được vượt số đã ghi trong
 *      docs/i18n/sidecar-budget.json. File chưa có trong budget không fail, chỉ được
 *      liệt kê để chạy `--update`.
 *   4. Rào frontmatter `name` (hard fail) — trường `name` trong frontmatter YAML phải giống
 *      hệt nhau ở cả ba file zh/en/vi (activate_skill dựng z.enum(skillNames) từ nó, đọc theo
 *      locale — xem commit 1b95fcf). `description` được phép khác. File không có frontmatter
 *      thì bỏ qua, không fail.
 *   5. Danh sách bản gốc thiếu sidecar (thông tin, không fail) — đếm theo thư mục.
 *
 * Chạy `tsx scripts/i18n-check-sidecars.ts` để kiểm tra, hoặc `--update` để ghi lại
 * ngân sách CJK còn sót từ trạng thái đĩa hiện tại (kiểm tra 1, 2 và 4 luôn phải đúng
 * tuyệt đối, không có ngân sách cho chúng; `--update` giữ nguyên mọi `literalAllowance` đã
 * có, không tự sinh miễn trừ mới).
 *
 * `--paths <glob-hoặc-đường-dẫn>...` giới hạn kiểm tra vào các bộ ba mà bản gốc khớp (đường dẫn
 * file lẻ, thư mục, hoặc glob `*`/`**`/`?`) — dùng để một batch dịch chỉ đụng vài file có thể tự
 * chứng minh phần mình sạch (exit 0) mà không bị các bản gốc chưa dịch còn lại kéo xuống. Không
 * áp dụng cho `--update` — ngân sách luôn ghi lại cho toàn bộ cây, vì residualCjk phải phản ánh
 * đúng trạng thái đĩa của mọi file, không chỉ phần đang được lọc.
 */
import fs from "node:fs";
import path from "node:path";

export const SKILLS_DIR_NAME = "data/skills";
export const TERMS_PATH = "docs/i18n/prompt-terms.json";
export const BUDGET_PATH = "docs/i18n/sidecar-budget.json";

const CJK_CHAR = /[一-鿿]/;
const IMAGE_REF = /@图片?\d+/g;

export type Problem = { check: "literal" | "structure" | "cjk-budget" | "literal-allowance" | "frontmatter-name"; detail: string };
export type FileProblems = { file: string; problems: Problem[] };

/**
 * Miễn trừ literal cho một token, ghi theo từng file/locale trong sidecar-budget.json.
 * `expected` thay cho số đếm bản gốc; `reason` bắt buộc, không được rỗng — do con người viết,
 * không được `--update` tự sinh. Kiểu ở đây lỏng có chủ đích (Partial ngầm định qua optional
 * trên `reason`) vì dữ liệu đọc từ đĩa chưa được validate; validateLiteralAllowance kiểm nghiêm.
 */
export type LiteralAllowanceEntry = { expected: number; reason: string };
export type LiteralAllowance = Record<string, LiteralAllowanceEntry>;

/** Giá trị ngân sách một locale: dạng số cũ (không có miễn trừ), hoặc dạng object mới mang literalAllowance. */
export type BudgetLocaleValue = number | { residualCjk: number; literalAllowance?: LiteralAllowance };
export type Budget = Record<string, { en: BudgetLocaleValue; vi: BudgetLocaleValue }>;

/** Chuẩn hoá một giá trị ngân sách locale (dạng number cũ hoặc object mới) về cùng một hình dạng. */
export function normalizeBudgetLocale(
  raw: BudgetLocaleValue | undefined,
): { residualCjk: number; literalAllowance: LiteralAllowance } | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw === "number") return { residualCjk: raw, literalAllowance: {} };
  return { residualCjk: raw.residualCjk, literalAllowance: raw.literalAllowance ?? {} };
}

/**
 * Kiểm tra mọi miễn trừ literal đều có `reason` không rỗng, không chỉ khoảng trắng. Một miễn trừ
 * không có lý do viết ra thì không phải phán đoán, chỉ là làm ngơ — hard fail, không im lặng bỏ qua.
 */
export function validateLiteralAllowance(literalAllowance: LiteralAllowance): string[] {
  const errors: string[] = [];
  for (const [token, entry] of Object.entries(literalAllowance)) {
    const reason = entry?.reason;
    if (typeof reason !== "string" || reason.trim() === "") {
      errors.push(
        `miễn trừ literal cho \`${token}\` thiếu \`reason\` hợp lệ (rỗng hoặc chỉ khoảng trắng) — mọi ` +
          `literalAllowance phải ghi lý do rõ ràng, nếu không chỉ là làm ngơ lỗi, không phải phán đoán`,
      );
    }
  }
  return errors;
}

/** Đếm số lần xuất hiện thô của một chuỗi con trong văn bản — không regex, không dedupe. */
export function occurrences(needle: string, haystack: string): number {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

/** Đếm ký tự CJK cơ bản (U+4E00–U+9FFF) trong văn bản. */
export function countCJK(text: string): number {
  const matches = text.match(/[一-鿿]/g);
  return matches ? matches.length : 0;
}

/**
 * Các entry cần bảo toàn nguyên văn khi dịch: policy keep-zh-literal / never-translate
 * mà zh chứa ký tự CJK (bỏ qua các never-translate thuần ASCII như `duration`, `tool`).
 * Khử trùng lặp theo chuỗi zh — đếm chuỗi con thô cho từng chuỗi độc lập, không "khử
 * trùng lặp thông minh" giữa các token lồng nhau như 远景/大远景.
 */
export function extractLiteralTerms(registry: { terms: Array<{ zh: string; policy: string }> }): string[] {
  const seen = new Set<string>();
  for (const term of registry.terms) {
    if ((term.policy === "keep-zh-literal" || term.policy === "never-translate") && term.zh && CJK_CHAR.test(term.zh)) {
      seen.add(term.zh);
    }
  }
  return [...seen];
}

/** Chuỗi cấp heading ATX (`^#{1,6} `), bỏ qua nội dung bên trong khối code ```` ``` ````. */
export function extractHeadingLevels(text: string): number[] {
  const levels: number[] = [];
  let inFence = false;
  for (const rawLine of text.split("\n")) {
    if (rawLine.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{1,6})\s/.exec(rawLine);
    if (m) levels.push(m[1].length);
  }
  return levels;
}

/** Số dòng bảng Markdown (bắt đầu bằng `|` sau khi trim), bỏ qua bên trong khối code. */
export function countTableLines(text: string): number {
  let count = 0;
  let inFence = false;
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (line.startsWith("|")) count++;
  }
  return count;
}

/** Số hàng rào code (mỗi dòng ```` ``` ```` mở hoặc đóng đều tính). */
export function countCodeFences(text: string): number {
  return text.split("\n").filter((l) => l.trim().startsWith("```")).length;
}

/** Số token tham chiếu ảnh dạng `@图N` / `@图片N`. */
export function countImageRefs(text: string): number {
  const matches = text.match(IMAGE_REF);
  return matches ? matches.length : 0;
}

/**
 * Xoá mọi occurrence của từng literal term khỏi văn bản (dùng trước khi đếm CJK còn sót).
 * Luôn xoá token DÀI nhất trước — với token lồng nhau như 远景/大远景, xoá 远景 trước sẽ để
 * lại "大" mồ côi (không còn khớp 大远景 nữa) và làm CJK còn sót bị đếm sai. Xoá 大远景
 * trước loại bỏ đúng nguyên khối, không phụ thuộc thứ tự literalTerms truyền vào.
 */
export function stripLiteralTerms(text: string, literalTerms: string[]): string {
  const byLengthDesc = [...literalTerms].sort((a, b) => b.length - a.length);
  let out = text;
  for (const term of byLengthDesc) {
    if (term) out = out.split(term).join("");
  }
  return out;
}

/** Diễn giải vì sao chuỗi cấp heading lệch nhau — số lượng theo từng cấp, hoặc chỉ thứ tự. */
function headingDiffHint(zh: number[], translated: number[]): string {
  const countBy = (arr: number[]) =>
    arr.reduce<Record<number, number>>((m, v) => {
      m[v] = (m[v] ?? 0) + 1;
      return m;
    }, {});
  const zc = countBy(zh);
  const tc = countBy(translated);
  const levels = [...new Set([...Object.keys(zc), ...Object.keys(tc)].map(Number))].sort((a, b) => a - b);
  const diffs: string[] = [];
  for (const lvl of levels) {
    const d = (zc[lvl] ?? 0) - (tc[lvl] ?? 0);
    if (d > 0) diffs.push(`thiếu ${d} heading cấp ${lvl}`);
    if (d < 0) diffs.push(`thừa ${-d} heading cấp ${lvl}`);
  }
  return diffs.length > 0 ? ` — ${diffs.join(", ")}` : " — thứ tự cấp heading khác bản gốc";
}

/**
 * Kiểm tra 1 (literal) và kiểm tra 2 (parity cấu trúc) cho một file bản dịch so với bản
 * gốc zh tương ứng. Không đụng đĩa — nhận thẳng nội dung văn bản.
 *
 * `literalAllowance` (D1): miễn trừ theo từng token, đọc từ sidecar-budget.json. Khi có mặt,
 * `expected` thay cho số đếm bản gốc làm số lần bắt buộc trong bản dịch — dùng khi bản gốc
 * dùng chuỗi đó theo nghĩa văn xuôi ở (một phần) các chỗ xuất hiện, không phải giá trị vận máy
 * ở mọi chỗ. Không kiểm `reason` ở đây — đó là việc của validateLiteralAllowance, gọi riêng ở
 * tầng checkSidecars vì nó áp dụng một lần cho cả budget entry, không phụ thuộc nội dung file.
 */
export function checkSidecarFile(
  zh: string,
  translated: string,
  literalTerms: string[],
  literalAllowance: LiteralAllowance = {},
): Problem[] {
  const problems: Problem[] = [];

  // Kiểm tra 1 — bảo toàn literal.
  for (const term of literalTerms) {
    const zhCount = occurrences(term, zh);
    if (zhCount === 0) continue; // token không xuất hiện trong bản gốc file này, bỏ qua
    const allowance = literalAllowance[term];
    const requiredCount = allowance ? allowance.expected : zhCount;
    const trCount = occurrences(term, translated);
    if (trCount !== requiredCount) {
      const diff = Math.abs(requiredCount - trCount);
      const verb = trCount < requiredCount ? "đã bị dịch mất" : "xuất hiện thừa so với yêu cầu";
      const baseline = allowance ? `miễn trừ literalAllowance yêu cầu ${requiredCount} lần` : `bản gốc có ${requiredCount} lần`;
      problems.push({
        check: "literal",
        detail:
          `literal \`${term}\` xuất hiện ${trCount} lần, ${baseline} — ${diff} lần ${verb}. ` +
          `Hãy khôi phục token về đúng số nếu đây là giá trị vận máy, hoặc thêm miễn trừ literalAllowance ` +
          `có lý do trong docs/i18n/sidecar-budget.json nếu bản gốc dùng chuỗi này theo nghĩa văn xuôi.`,
      });
    }
  }

  // Kiểm tra 2 — parity cấu trúc.
  const zhHeadings = extractHeadingLevels(zh);
  const trHeadings = extractHeadingLevels(translated);
  const headingsMatch = zhHeadings.length === trHeadings.length && zhHeadings.every((v, i) => v === trHeadings[i]);
  if (!headingsMatch) {
    problems.push({
      check: "structure",
      detail: `heading: bản gốc ${JSON.stringify(zhHeadings)}, bản dịch ${JSON.stringify(trHeadings)}${headingDiffHint(zhHeadings, trHeadings)}`,
    });
  }

  const zhTables = countTableLines(zh);
  const trTables = countTableLines(translated);
  if (zhTables !== trTables) {
    problems.push({ check: "structure", detail: `dòng bảng: bản gốc có ${zhTables}, bản dịch có ${trTables}` });
  }

  const zhFences = countCodeFences(zh);
  const trFences = countCodeFences(translated);
  if (zhFences !== trFences) {
    problems.push({ check: "structure", detail: `hàng rào code: bản gốc có ${zhFences}, bản dịch có ${trFences}` });
  }

  const zhImages = countImageRefs(zh);
  const trImages = countImageRefs(translated);
  if (zhImages !== trImages) {
    problems.push({ check: "structure", detail: `token ảnh @图N: bản gốc có ${zhImages}, bản dịch có ${trImages}` });
  }

  return problems;
}

/** Kiểm tra 3 — ngân sách CJK còn sót cho một file bản dịch. */
export function checkCJKBudgetForFile(
  translated: string,
  literalTerms: string[],
  budgetValue: number | undefined,
): { problem?: Problem; actual: number; isNew: boolean } {
  const actual = countCJK(stripLiteralTerms(translated, literalTerms));
  if (budgetValue === undefined) {
    return { actual, isNew: true };
  }
  if (actual > budgetValue) {
    return {
      problem: {
        check: "cjk-budget",
        detail: `CJK còn sót: ${actual} ký tự, ngân sách đã ghi ${budgetValue} — vượt ${actual - budgetValue}`,
      },
      actual,
      isNew: false,
    };
  }
  return { actual, isNew: false };
}

/** Chuyển một pattern glob đơn giản (`*` = bất kỳ đoạn nào trong 1 segment, `**` = mọi segment, `?` = 1 ký tự) thành RegExp. */
function globToRegExp(glob: string): RegExp {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        re += ".*";
        i++;
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") {
      re += "[^/]";
    } else if ("\\^$+.()|{}[]".includes(c)) {
      re += `\\${c}`;
    } else {
      re += c;
    }
  }
  return new RegExp(`^${re}$`);
}

/**
 * D2 — lọc theo `--paths`. Một bản gốc khớp filter nếu đường dẫn tương đối của nó trùng khớp
 * chính xác một filter, nằm trong một thư mục filter chỉ định (so khớp theo segment, "a" không
 * khớp nhầm "ab"), hoặc khớp một glob pattern (`*`, `**`, `?`). Mảng filter rỗng nghĩa là không
 * lọc gì — mọi bản gốc đều khớp (hành vi mặc định khi không truyền `--paths`).
 */
export function matchesPathFilters(relPath: string, filters: string[]): boolean {
  if (filters.length === 0) return true;
  return filters.some((rawFilter) => {
    const filter = rawFilter.split(path.sep).join("/").replace(/\/+$/, "");
    if (relPath === filter) return true;
    if (relPath.startsWith(`${filter}/`)) return true;
    if (/[*?]/.test(filter)) return globToRegExp(filter).test(relPath);
    return false;
  });
}

const FRONTMATTER_NAME = /^name:\s*(.+?)\s*$/m;

/**
 * D3 — đọc trường `name` trong frontmatter YAML mở đầu file (nếu có). Trả undefined khi file
 * không có frontmatter (không bắt đầu bằng `---`) — những file này bị bỏ qua kiểm tra name,
 * không fail.
 */
export function extractFrontmatterName(text: string): string | undefined {
  if (!text.startsWith("---")) return undefined;
  const end = text.indexOf("\n---", 3);
  if (end === -1) return undefined;
  const frontmatter = text.slice(0, end);
  const m = FRONTMATTER_NAME.exec(frontmatter);
  return m ? m[1] : undefined;
}

/**
 * D3 — `activate_skill` dựng `z.enum(skillNames)` từ trường `name` đọc theo locale (xem commit
 * 1b95fcf). Nếu một bản dịch dịch luôn `name`, tập enum đổi theo locale. Bắt buộc `name` giống
 * hệt nhau ở cả ba file zh/en/vi. `description` được phép khác — đó là văn xuôi cho người/model
 * đọc, không phải khoá. File nào thiếu frontmatter (undefined) thì bỏ qua toàn bộ kiểm tra này.
 */
export function checkFrontmatterNameParity(zh: string, en: string, vi: string): Problem[] {
  const zhName = extractFrontmatterName(zh);
  const enName = extractFrontmatterName(en);
  const viName = extractFrontmatterName(vi);
  if (zhName === undefined || enName === undefined || viName === undefined) return [];
  if (zhName === enName && zhName === viName) return [];
  return [
    {
      check: "frontmatter-name",
      detail:
        `frontmatter \`name\` lệch giữa ba file: zh="${zhName}", en="${enName}", vi="${viName}" — ` +
        `name dựng z.enum(skillNames) cho activate_skill nên phải giống hệt nhau ở mọi locale ` +
        `(description được phép khác, đó là văn xuôi)`,
    },
  ];
}

const toPosix = (p: string) => p.split(path.sep).join("/");

const walk = (dir: string, out: string[] = []): string[] => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

const isSidecar = (f: string) => /\.(en|vi)\.md$/.test(f);

/** Mọi bản gốc `*.md` dưới skillsDir (loại trừ sidecar `.en.md` / `.vi.md`), đã sắp xếp. */
export function findSkillOriginals(skillsDir: string): string[] {
  return walk(skillsDir)
    .filter((f) => f.endsWith(".md") && !isSidecar(f))
    .sort();
}

export type SidecarReport = {
  files: FileProblems[];
  hasHardFail: boolean;
  missingSidecars: string[];
  newInBudget: string[];
};

/**
 * Chạy cả bốn kiểm tra trên toàn bộ cây skillsDir. `root` dùng để tính đường dẫn tương
 * đối (key trong budget và trong report) — với repo thật root là thư mục gốc repo và
 * skillsDir là `<root>/data/skills`.
 */
/**
 * `pathFilters` (D2, `--paths`): khi khác rỗng, chỉ các bộ ba mà bản gốc khớp filter mới được
 * kiểm — kể cả liệt kê missingSidecars / newInBudget. Bản gốc thiếu sidecar nằm ngoài tập lọc
 * không được tính vào kết quả, để một batch dịch chỉ đụng vài file có thể tự chứng minh phần
 * mình sạch (exit 0) mà không bị 139 bản gốc chưa dịch còn lại kéo xuống.
 */
export function checkSidecars(
  root: string,
  skillsDir: string,
  literalTerms: string[],
  budget: Budget,
  pathFilters: string[] = [],
): SidecarReport {
  const files: FileProblems[] = [];
  const missingSidecars: string[] = [];
  const newInBudget: string[] = [];
  let hasHardFail = false;

  for (const absZh of findSkillOriginals(skillsDir)) {
    const relPath = toPosix(path.relative(root, absZh));
    if (!matchesPathFilters(relPath, pathFilters)) continue;

    const base = absZh.slice(0, -".md".length);
    const enPath = `${base}.en.md`;
    const viPath = `${base}.vi.md`;
    const hasEn = fs.existsSync(enPath);
    const hasVi = fs.existsSync(viPath);

    if (!hasEn || !hasVi) {
      missingSidecars.push(relPath);
    }
    if (!hasEn && !hasVi) continue; // chưa có sidecar nào — không có gì để kiểm tra cơ học

    const zhText = fs.readFileSync(absZh, "utf8");
    const budgetEntry = budget[relPath];
    if (!budgetEntry) newInBudget.push(relPath);

    const enText = hasEn ? fs.readFileSync(enPath, "utf8") : undefined;
    const viText = hasVi ? fs.readFileSync(viPath, "utf8") : undefined;

    // D3 — rào frontmatter `name`: chỉ so sánh khi có đủ cả ba file (đọc lại từ zh/en/vi ở trên).
    if (enText !== undefined && viText !== undefined) {
      const nameProblems = checkFrontmatterNameParity(zhText, enText, viText);
      if (nameProblems.length > 0) {
        hasHardFail = true;
        files.push({ file: relPath, problems: nameProblems });
      }
    }

    for (const [locale, sidecarPath, exists, translated] of [
      ["en", enPath, hasEn, enText],
      ["vi", viPath, hasVi, viText],
    ] as const) {
      if (!exists || translated === undefined) continue;
      const normalizedBudget = normalizeBudgetLocale(budgetEntry?.[locale]);
      const allowanceErrors = normalizedBudget ? validateLiteralAllowance(normalizedBudget.literalAllowance) : [];
      const problems = checkSidecarFile(zhText, translated, literalTerms, normalizedBudget?.literalAllowance);
      for (const err of allowanceErrors) problems.push({ check: "literal-allowance", detail: err });
      const cjk = checkCJKBudgetForFile(translated, literalTerms, normalizedBudget?.residualCjk);
      if (cjk.problem) problems.push(cjk.problem);
      if (problems.length > 0) {
        hasHardFail = true;
        files.push({ file: toPosix(path.relative(root, sidecarPath)), problems });
      }
    }
  }

  return { files, hasHardFail, missingSidecars: missingSidecars.sort(), newInBudget: newInBudget.sort() };
}

/** Đếm bản gốc thiếu sidecar theo thư mục — dùng để in kiểm tra 4. */
export function groupMissingByDir(missingRelPaths: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of missingRelPaths) {
    const dir = path.posix.dirname(p);
    counts[dir] = (counts[dir] ?? 0) + 1;
  }
  return counts;
}

/**
 * Tính lại toàn bộ ngân sách CJK còn sót từ trạng thái đĩa hiện tại — dùng cho `--update`.
 * Chỉ ghi entry cho bộ ba có ĐỦ cả `.en.md` và `.vi.md`.
 */
/**
 * `previousBudget` (D1): `--update` KHÔNG được tự sinh miễn trừ — chỉ ghi lại `residualCjk`
 * và phải giữ nguyên mọi khối `literalAllowance` đã có (do con người viết tay). File chưa từng
 * có literalAllowance vẫn ghi dạng số cũ (không bọc object) để không phát sinh diff thừa trên
 * hàng trăm file không liên quan.
 */
export function buildBudget(root: string, skillsDir: string, literalTerms: string[], previousBudget: Budget = {}): Budget {
  const budget: Budget = {};
  for (const absZh of findSkillOriginals(skillsDir)) {
    const relPath = toPosix(path.relative(root, absZh));
    const base = absZh.slice(0, -".md".length);
    const enPath = `${base}.en.md`;
    const viPath = `${base}.vi.md`;
    if (!fs.existsSync(enPath) || !fs.existsSync(viPath)) continue;
    const en = fs.readFileSync(enPath, "utf8");
    const vi = fs.readFileSync(viPath, "utf8");
    const enResidual = countCJK(stripLiteralTerms(en, literalTerms));
    const viResidual = countCJK(stripLiteralTerms(vi, literalTerms));
    const prevEntry = previousBudget[relPath];
    const prevEn = normalizeBudgetLocale(prevEntry?.en);
    const prevVi = normalizeBudgetLocale(prevEntry?.vi);
    const hasPrevEnAllowance = prevEn && Object.keys(prevEn.literalAllowance).length > 0;
    const hasPrevViAllowance = prevVi && Object.keys(prevVi.literalAllowance).length > 0;
    budget[relPath] = {
      en: hasPrevEnAllowance ? { residualCjk: enResidual, literalAllowance: prevEn!.literalAllowance } : enResidual,
      vi: hasPrevViAllowance ? { residualCjk: viResidual, literalAllowance: prevVi!.literalAllowance } : viResidual,
    };
  }
  const sorted: Budget = {};
  for (const key of Object.keys(budget).sort()) sorted[key] = budget[key];
  return sorted;
}

/** Đọc danh sách giá trị theo sau flag `--paths` trên argv, dừng ở flag kế tiếp (bắt đầu `--`). */
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
  const registry = JSON.parse(fs.readFileSync(path.join(root, TERMS_PATH), "utf8"));
  const literalTerms = extractLiteralTerms(registry);
  const pathFilters = parsePathsArg(process.argv);

  if (process.argv.includes("--update")) {
    let previousBudget: Budget = {};
    if (fs.existsSync(path.join(root, BUDGET_PATH))) {
      const raw = JSON.parse(fs.readFileSync(path.join(root, BUDGET_PATH), "utf8"));
      previousBudget = raw.budget ?? {};
    }
    const budget = buildBudget(root, skillsDir, literalTerms, previousBudget);
    const out = {
      $comment:
        "Ngân sách CJK còn sót cho phép trong từng sidecar bản dịch skill, sau khi đã xoá các literal term " +
        "trong docs/i18n/prompt-terms.json. Sinh và ghi đè bằng `tsx scripts/i18n-check-sidecars.ts --update` " +
        "sau khi rà lại các ký tự CJK còn sót là hợp lệ (tên riêng trong ví dụ, từ vựng gaps đã ghi nhận cố ý " +
        "chưa đăng ký). Không sửa tay — mọi thay đổi phải qua --update để phản ánh đúng trạng thái đĩa.",
      budget,
    };
    fs.writeFileSync(path.join(root, BUDGET_PATH), `${JSON.stringify(out, null, 2)}\n`);
    console.log(`[i18n:check-sidecars] ngân sách CJK đã ghi lại cho ${Object.keys(budget).length} file trong ${BUDGET_PATH}`);
    return;
  }

  let budget: Budget = {};
  if (fs.existsSync(path.join(root, BUDGET_PATH))) {
    const raw = JSON.parse(fs.readFileSync(path.join(root, BUDGET_PATH), "utf8"));
    budget = raw.budget ?? {};
  }

  const report = checkSidecars(root, skillsDir, literalTerms, budget, pathFilters);

  for (const f of report.files) {
    console.error(`✗ ${f.file}`);
    for (const p of f.problems) console.error(`    ${p.detail}`);
  }

  if (report.newInBudget.length > 0) {
    console.log(`\nfile mới, chạy --update để ghi nhận (${report.newInBudget.length}):`);
    for (const f of report.newInBudget) console.log(`  ${f}`);
  }

  if (report.missingSidecars.length > 0) {
    const byDir = groupMissingByDir(report.missingSidecars);
    console.log(`\nbản gốc chưa có sidecar (${report.missingSidecars.length} file, theo thư mục):`);
    for (const dir of Object.keys(byDir).sort()) console.log(`  ${dir}: ${byDir[dir]}`);
  }

  const checkedFiles = report.files.length;
  console.log(
    `\n[i18n:check-sidecars] ${report.hasHardFail ? "FAILED" : "OK"} — ` +
      `${report.missingSidecars.length} bản gốc thiếu sidecar, ${report.newInBudget.length} file mới chưa ghi ngân sách, ` +
      `${checkedFiles} file bản dịch có vấn đề.`,
  );

  if (report.hasHardFail) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith(path.join("scripts", "i18n-check-sidecars.ts"))) {
  main();
}
