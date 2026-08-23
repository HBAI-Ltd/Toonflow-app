# Kế hoạch 1: hạ tầng i18n và chuỗi người dùng nhìn thấy

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng trục locale `en`/`vi`/`zh` cho backend Toonflow và dịch mọi chuỗi tiếng Trung mà người dùng nhìn thấy ngoài thư viện prompt AI.

**Architecture:** Một module `src/i18n/` thuần tuý (không chạm cơ sở dữ liệu) cung cấp `t()` tra catalog JSON, cộng một lớp phân giải locale đọc header `X-Toonflow-Lang` rồi tới khoá `content_language` trong bảng `o_setting`. Chuỗi backend rút ra `src/i18n/locales/{en,vi,zh}.json`, trong đó `zh.json` giữ nguyên văn gốc làm mốc hồi quy. Dữ liệu nhà cung cấp và bundle giao diện được dịch một chiều sang tiếng Anh/Việt vì chúng không cần chuyển đổi lúc chạy.

**Tech Stack:** TypeScript 5.9 (CommonJS, strict), Express 5, Knex + better-sqlite3, tsx, Vitest (thêm mới ở Task 1).

**Spec:** `docs/superpowers/specs/2026-08-23-i18n-translation-design.md`

**Phạm vi:** Kế hoạch này phủ mục 4 bước 1–6 của spec. Kế hoạch này cũng kéo sẵn phần `data/skills` hiển thị trực tiếp cho người dùng — 24 file README của sổ tay hình ảnh và sổ tay đạo diễn (Task 7). 159 file prompt còn lại của bước 7–8 thuộc kế hoạch 2, viết sau khi kế hoạch này hoàn tất.

## Global Constraints

- Locale hợp lệ: đúng ba giá trị `en` | `vi` | `zh`. Mặc định `en`.
- `zh` là fallback khi thiếu bản dịch, và là locale giữ nguyên văn tiếng Trung gốc.
- **Không sửa comment tiếng Trung trong `src/**`.** Chỉ đụng vào dòng chứa chuỗi.
- **Không sửa file gốc trong `data/skills/**`.** Kế hoạch này không chạm tới thư mục đó.
- **Không sửa tay `src/lib/vendor.json`** — nó được sinh ra bởi `yarn vendor2json`.
- Alias import: `@/*` trỏ tới `src/*` (xem `tsconfig.json`).
- `src/utils.ts` là barrel export `u`; `u.db` là knex client. **Không import `@/utils` hay `@/utils/db` từ module i18n lõi** — `src/utils/db.ts` mở cơ sở dữ liệu và chạy `initDB`/`fixDB` ngay lúc import, sẽ làm hỏng unit test.
- `src/router.ts` được sinh tự động bởi `src/core.ts` từ cây thư mục `src/routes/`. Đường dẫn route = `/api/` + đường dẫn file. Không sửa tay `src/router.ts`.
- Mọi task kết thúc bằng `yarn lint` (`tsc --noEmit`) sạch. Baseline hiện tại: 0 lỗi.
- Thuật ngữ dịch tuân theo `docs/i18n/glossary.json` (dựng ở Task 2).

## Cấu trúc file

| File | Trách nhiệm |
| --- | --- |
| `vitest.config.ts` | Cấu hình test, ánh xạ alias `@/` |
| `docs/i18n/glossary.json` | Bảng thuật ngữ zh → en/vi |
| `scripts/i18n-scan.ts` | Quét CJK còn sót ngoài vùng cho phép |
| `src/i18n/types.ts` | `Locale`, `LOCALES`, `DEFAULT_LOCALE`, `FALLBACK_LOCALE` |
| `src/i18n/translate.ts` | `t()` thuần tuý, nạp catalog, nội suy biến |
| `src/i18n/locales/{en,vi,zh}.json` | Catalog chuỗi backend |
| `src/i18n/locale.ts` | `getLocale(req?)`, `setLocale()` — chạm cơ sở dữ liệu |
| `src/i18n/skillPath.ts` | Phân giải file skill theo locale, lùi về bản gốc |
| `data/skills/**/README.{en,vi}.md` | Bản dịch sidecar của 24 sổ tay |
| `data/skills/.i18n-manifest.json` | Hash bản gốc lúc dịch, để phát hiện lỗi thời sau khi sync |
| `src/i18n/index.ts` | Barrel export |
| `src/routes/setting/language/getLanguage.ts` | `GET /api/setting/language/getLanguage` |
| `src/routes/setting/language/setLanguage.ts` | `POST /api/setting/language/setLanguage` |
| `src/lib/migrations/i18nSeed.ts` | Cập nhật dữ liệu tiếng Trung đã seed trong cơ sở dữ liệu cũ |
| `scripts/patch-web-i18n.ts` | Vá catalog vue-i18n trong bundle giao diện |

---

### Task 1: Hạ tầng test

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/i18n/__tests__/smoke.test.ts`

**Interfaces:**
- Consumes: không
- Produces: lệnh `yarn test` chạy Vitest; alias `@/` dùng được trong test

Repo hiện không có test nào. Task này dựng nền cho toàn bộ các task sau.

- [ ] **Step 1: Cài Vitest**

```bash
yarn add -D vitest@^3 vite-tsconfig-paths@^5
```

- [ ] **Step 2: Tạo `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 3: Viết test khói để xác nhận alias hoạt động**

Tạo `src/i18n/__tests__/smoke.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import getPath from "@/utils/getPath";

describe("hạ tầng test", () => {
  it("phân giải được alias @/", () => {
    expect(typeof getPath).toBe("function");
  });
});
```

- [ ] **Step 4: Thêm script `test` vào `package.json`**

Trong khối `"scripts"`, thêm cạnh `"lint"`:

```json
"test": "vitest run",
"test:watch": "vitest",
```

- [ ] **Step 5: Chạy test, xác nhận PASS**

Run: `yarn test`
Expected: 1 passed. Nếu alias lỗi, kiểm lại `vite-tsconfig-paths` đã nằm trong `plugins`.

- [ ] **Step 6: Chạy lint**

Run: `yarn lint`
Expected: 0 lỗi.

- [ ] **Step 7: Commit**

```bash
git add package.json yarn.lock vitest.config.ts src/i18n/__tests__/smoke.test.ts
git commit -m "test: thêm Vitest làm hạ tầng kiểm thử"
```

---

### Task 2: Glossary và script quét

**Files:**
- Create: `docs/i18n/glossary.json`
- Create: `scripts/i18n-scan.ts`
- Create: `scripts/i18n-scan.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: hạ tầng test từ Task 1
- Produces: `yarn i18n:scan`; hàm `scanText(text: string, opts: ScanOptions): CjkHit[]` và `stripComments(source: string): string` export từ `scripts/i18n-scan.ts`

- [ ] **Step 1: Tạo `docs/i18n/glossary.json`**

```json
{
  "分镜": { "en": "storyboard", "vi": "phân cảnh" },
  "分镜表": { "en": "storyboard table", "vi": "bảng phân cảnh" },
  "资产": { "en": "asset", "vi": "tài nguyên" },
  "剧本": { "en": "script", "vi": "kịch bản" },
  "小说": { "en": "novel", "vi": "tiểu thuyết" },
  "章节": { "en": "chapter", "vi": "chương" },
  "角色": { "en": "character", "vi": "nhân vật" },
  "场景": { "en": "scene", "vi": "bối cảnh" },
  "道具": { "en": "prop", "vi": "đạo cụ" },
  "提示词": { "en": "prompt", "vi": "prompt" },
  "供应商": { "en": "provider", "vi": "nhà cung cấp" },
  "模型": { "en": "model", "vi": "mô hình" },
  "统筹": { "en": "coordinator", "vi": "điều phối" },
  "生产": { "en": "production", "vi": "sản xuất" },
  "项目": { "en": "project", "vi": "dự án" },
  "任务": { "en": "task", "vi": "tác vụ" },
  "配置": { "en": "config", "vi": "cấu hình" },
  "成功": { "en": "Success", "vi": "Thành công" },
  "失败": { "en": "Failed", "vi": "Thất bại" },
  "已完成": { "en": "Completed", "vi": "Đã hoàn thành" },
  "衍生资产": { "en": "derived asset", "vi": "tài nguyên phái sinh" },
  "首帧": { "en": "first frame", "vi": "khung đầu" },
  "尾帧": { "en": "last frame", "vi": "khung cuối" },
  "运镜": { "en": "camera movement", "vi": "chuyển động máy quay" },
  "景别": { "en": "shot size", "vi": "cỡ cảnh" },
  "台词": { "en": "dialogue", "vi": "thoại" },
  "音效": { "en": "sound effect", "vi": "hiệu ứng âm thanh" }
}
```

- [ ] **Step 2: Viết test thất bại cho `stripComments` và `scanText`**

Tạo `scripts/i18n-scan.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { stripComments, scanText } from "./i18n-scan";

describe("stripComments", () => {
  it("bỏ comment dòng", () => {
    expect(stripComments('const a = 1; // 停止消息')).not.toContain("停止");
  });

  it("bỏ comment khối", () => {
    expect(stripComments("/* 处理未捕获的异常 */\nconst a = 1;")).not.toContain("处理");
  });

  it("giữ lại chuỗi trông giống comment", () => {
    expect(stripComments('const a = "http://x/y // 更新成功";')).toContain("更新成功");
  });
});

describe("scanText", () => {
  it("báo chuỗi CJK trong mã", () => {
    const hits = scanText('res.send(success("更新成功"));', { stripComments: true });
    expect(hits).toHaveLength(1);
    expect(hits[0].text).toBe("更新成功");
    expect(hits[0].line).toBe(1);
  });

  it("bỏ qua CJK nằm trong comment khi được yêu cầu", () => {
    expect(scanText("// 停止消息", { stripComments: true })).toHaveLength(0);
  });

  it("báo CJK trong comment khi không strip", () => {
    expect(scanText("// 停止消息", { stripComments: false })).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Chạy test, xác nhận FAIL**

Run: `yarn test scripts/i18n-scan.test.ts`
Expected: FAIL — không tìm thấy module `./i18n-scan`.

- [ ] **Step 4: Viết `scripts/i18n-scan.ts`**

```typescript
import fs from "fs";
import path from "path";
import fg from "fast-glob";

export interface CjkHit {
  file?: string;
  line: number;
  text: string;
}

export interface ScanOptions {
  stripComments: boolean;
}

const CJK = /[一-鿿]+/g;

/** Thay comment bằng khoảng trắng, giữ nguyên độ dài để số dòng không đổi. */
export function stripComments(source: string): string {
  let out = "";
  let i = 0;
  let quote: string | null = null;

  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];

    if (quote) {
      if (c === "\\") { out += source.slice(i, i + 2); i += 2; continue; }
      if (c === quote) quote = null;
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

    out += c; i++;
  }
  return out;
}

export function scanText(source: string, opts: ScanOptions): CjkHit[] {
  const text = opts.stripComments ? stripComments(source) : source;
  const hits: CjkHit[] = [];
  text.split("\n").forEach((line, idx) => {
    for (const m of line.matchAll(CJK)) hits.push({ line: idx + 1, text: m[0] });
  });
  return hits;
}

const TARGETS: { glob: string; stripComments: boolean }[] = [
  { glob: "src/**/*.ts", stripComments: true },
  { glob: "data/vendor/*.ts", stripComments: true },
  { glob: "scripts/*.ts", stripComments: true },
  { glob: "README.md", stripComments: false },
  { glob: "docs/README.en.md", stripComments: false },
  { glob: "docs/README.vi.md", stripComments: false },
];

const IGNORE = ["src/i18n/locales/zh.json", "src/lib/vendor.json", "src/router.ts", "**/*.test.ts"];

async function main() {
  let total = 0;
  for (const target of TARGETS) {
    const files = await fg(target.glob, { ignore: IGNORE, dot: false });
    for (const file of files) {
      const hits = scanText(fs.readFileSync(file, "utf-8"), { stripComments: target.stripComments });
      for (const hit of hits) {
        console.log(`${file}:${hit.line}  ${hit.text}`);
        total++;
      }
    }
  }
  console.log(total === 0 ? "\nSạch: không còn CJK ngoài vùng cho phép." : `\nCòn ${total} chuỗi CJK.`);
  process.exit(total === 0 ? 0 : 1);
}

if (require.main === module) main();
```

- [ ] **Step 5: Chạy test, xác nhận PASS**

Run: `yarn test scripts/i18n-scan.test.ts`
Expected: 6 passed.

- [ ] **Step 6: Thêm script và chạy thử để lấy con số baseline**

Thêm vào `"scripts"` của `package.json`:

```json
"i18n:scan": "tsx scripts/i18n-scan.ts",
```

Run: `yarn i18n:scan | tail -3`
Expected: thoát mã 1 với một con số lớn. **Ghi lại con số này vào phần commit message** — nó là baseline để các task sau đo tiến độ.

- [ ] **Step 7: Chạy lint và commit**

```bash
yarn lint
git add docs/i18n/glossary.json scripts/i18n-scan.ts scripts/i18n-scan.test.ts package.json
git commit -m "chore: thêm glossary i18n và script quét CJK"
```

---

### Task 3: Module i18n lõi

**Files:**
- Create: `src/i18n/types.ts`
- Create: `src/i18n/translate.ts`
- Create: `src/i18n/locales/en.json`
- Create: `src/i18n/locales/vi.json`
- Create: `src/i18n/locales/zh.json`
- Create: `src/i18n/translate.test.ts`

**Interfaces:**
- Consumes: hạ tầng test từ Task 1
- Produces:
  - `type Locale = "en" | "vi" | "zh"`
  - `const LOCALES: readonly Locale[]`
  - `const DEFAULT_LOCALE: Locale` (= `"en"`), `const FALLBACK_LOCALE: Locale` (= `"zh"`)
  - `function isLocale(value: unknown): value is Locale`
  - `function t(key: string, vars?: Record<string, string | number>, locale?: Locale): string`

Module này **thuần tuý** — không import `@/utils`, không chạm cơ sở dữ liệu.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/i18n/translate.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { t, isLocale } from "./translate";
import { DEFAULT_LOCALE, FALLBACK_LOCALE, LOCALES } from "./types";

describe("hằng số locale", () => {
  it("có đúng ba locale", () => {
    expect([...LOCALES]).toEqual(["en", "vi", "zh"]);
    expect(DEFAULT_LOCALE).toBe("en");
    expect(FALLBACK_LOCALE).toBe("zh");
  });

  it("isLocale nhận đúng giá trị hợp lệ", () => {
    expect(isLocale("vi")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("t", () => {
  it("tra được chuỗi theo locale", () => {
    expect(t("common.success", {}, "en")).toBe("Success");
    expect(t("common.success", {}, "vi")).toBe("Thành công");
    expect(t("common.success", {}, "zh")).toBe("成功");
  });

  it("nội suy biến", () => {
    expect(t("common.itemCount", { count: 3 }, "en")).toBe("3 items");
  });

  it("lùi về zh khi locale thiếu khoá", () => {
    expect(t("test.onlyInZh", {}, "en")).toBe("仅中文");
  });

  it("trả về chính key khi không locale nào có", () => {
    expect(t("khong.ton.tai", {}, "en")).toBe("khong.ton.tai");
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `yarn test src/i18n/translate.test.ts`
Expected: FAIL — không tìm thấy `./translate`.

- [ ] **Step 3: Tạo `src/i18n/types.ts`**

```typescript
export const LOCALES = ["en", "vi", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const FALLBACK_LOCALE: Locale = "zh";
```

- [ ] **Step 4: Tạo ba catalog khởi điểm**

`src/i18n/locales/en.json`:

```json
{
  "common.success": "Success",
  "common.failed": "Failed",
  "common.itemCount": "{count} items",
  "setting.language.invalid": "Invalid language. Allowed values: en, vi, zh."
}
```

`src/i18n/locales/vi.json`:

```json
{
  "common.success": "Thành công",
  "common.failed": "Thất bại",
  "common.itemCount": "{count} mục",
  "setting.language.invalid": "Ngôn ngữ không hợp lệ. Giá trị cho phép: en, vi, zh."
}
```

`src/i18n/locales/zh.json`:

```json
{
  "common.success": "成功",
  "common.failed": "失败",
  "common.itemCount": "{count} 项",
  "setting.language.invalid": "语言无效。允许的值：en、vi、zh。",
  "test.onlyInZh": "仅中文"
}
```

Khoá `test.onlyInZh` tồn tại có chủ đích, chỉ trong `zh.json`, để test cơ chế fallback.

- [ ] **Step 5: Tạo `src/i18n/translate.ts`**

```typescript
import en from "./locales/en.json";
import vi from "./locales/vi.json";
import zh from "./locales/zh.json";
import { DEFAULT_LOCALE, FALLBACK_LOCALE, LOCALES, type Locale } from "./types";

type Catalog = Record<string, string>;

const CATALOGS: Record<Locale, Catalog> = { en, vi, zh };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole,
  );
}

export function t(
  key: string,
  vars: Record<string, string | number> = {},
  locale: Locale = DEFAULT_LOCALE,
): string {
  const template = CATALOGS[locale]?.[key] ?? CATALOGS[FALLBACK_LOCALE]?.[key];
  if (template === undefined) {
    console.warn(`[i18n] thiếu khoá dịch: ${key}`);
    return key;
  }
  return interpolate(template, vars);
}
```

- [ ] **Step 6: Chạy test, xác nhận PASS**

Run: `yarn test src/i18n/translate.test.ts`
Expected: 6 passed.

- [ ] **Step 7: Loại `src/i18n/locales/zh.json` khỏi báo cáo quét**

Đã có sẵn trong mảng `IGNORE` của `scripts/i18n-scan.ts` từ Task 2. Xác nhận:

Run: `yarn i18n:scan | grep "locales/zh.json" || echo "đã loại đúng"`
Expected: `đã loại đúng`

- [ ] **Step 8: Chạy lint và commit**

```bash
yarn lint
git add src/i18n/
git commit -m "feat(i18n): thêm module dịch lõi với ba catalog en/vi/zh"
```

---

### Task 4: Phân giải locale và route cài đặt ngôn ngữ

**Files:**
- Create: `src/i18n/locale.ts`
- Create: `src/i18n/index.ts`
- Create: `src/i18n/locale.test.ts`
- Create: `src/routes/setting/language/getLanguage.ts`
- Create: `src/routes/setting/language/setLanguage.ts`
- Modify: `src/lib/initDB.ts` (thêm hàng seed vào `initData` của bảng `o_setting`)

**Interfaces:**
- Consumes: `Locale`, `isLocale`, `DEFAULT_LOCALE` từ Task 3
- Produces:
  - `function localeFromHeader(header: unknown): Locale | null`
  - `async function getLocale(req?: { headers: Record<string, unknown> }): Promise<Locale>`
  - `async function setLocale(locale: Locale): Promise<void>`
  - Khoá `o_setting.content_language`
  - `GET /api/setting/language/getLanguage`, `POST /api/setting/language/setLanguage`

Tách `localeFromHeader` ra thành hàm thuần tuý để test được mà không cần cơ sở dữ liệu.

- [ ] **Step 1: Viết test thất bại cho phần thuần tuý**

Tạo `src/i18n/locale.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { localeFromHeader } from "./locale";

describe("localeFromHeader", () => {
  it("nhận locale hợp lệ", () => {
    expect(localeFromHeader("vi")).toBe("vi");
    expect(localeFromHeader("EN")).toBe("en");
  });

  it("ánh xạ mã đầy đủ của giao diện về locale backend", () => {
    expect(localeFromHeader("vi-VN")).toBe("vi");
    expect(localeFromHeader("zh-CN")).toBe("zh");
    expect(localeFromHeader("en-US")).toBe("en");
  });

  it("trả null với giá trị không hỗ trợ", () => {
    expect(localeFromHeader("ja-JP")).toBeNull();
    expect(localeFromHeader(undefined)).toBeNull();
    expect(localeFromHeader(["vi"])).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `yarn test src/i18n/locale.test.ts`
Expected: FAIL — không tìm thấy `./locale`.

- [ ] **Step 3: Tạo `src/i18n/locale.ts`**

Lưu ý: `u` chỉ được import **bên trong** hàm async, không import ở đầu file, để `localeFromHeader` test được mà không kích hoạt việc mở cơ sở dữ liệu.

```typescript
import { DEFAULT_LOCALE, type Locale } from "./types";
import { isLocale } from "./translate";

export const LANGUAGE_SETTING_KEY = "content_language";

/** Chấp nhận cả mã ngắn (`vi`) lẫn mã đầy đủ của giao diện (`vi-VN`). */
export function localeFromHeader(header: unknown): Locale | null {
  if (typeof header !== "string") return null;
  const base = header.trim().toLowerCase().split("-")[0];
  return isLocale(base) ? base : null;
}

export async function getLocale(req?: { headers: Record<string, unknown> }): Promise<Locale> {
  const fromHeader = localeFromHeader(req?.headers?.["x-toonflow-lang"]);
  if (fromHeader) return fromHeader;

  const u = (await import("@/utils")).default;
  const row = await u.db("o_setting").where("key", LANGUAGE_SETTING_KEY).first();
  return isLocale(row?.value) ? row.value : DEFAULT_LOCALE;
}

export async function setLocale(locale: Locale): Promise<void> {
  const u = (await import("@/utils")).default;
  const existing = await u.db("o_setting").where("key", LANGUAGE_SETTING_KEY).first();
  if (existing) {
    await u.db("o_setting").where("key", LANGUAGE_SETTING_KEY).update({ value: locale });
  } else {
    await u.db("o_setting").insert({ key: LANGUAGE_SETTING_KEY, value: locale });
  }
}
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `yarn test src/i18n/locale.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Tạo barrel `src/i18n/index.ts`**

```typescript
export { t, isLocale } from "./translate";
export { getLocale, setLocale, localeFromHeader, LANGUAGE_SETTING_KEY } from "./locale";
export { LOCALES, DEFAULT_LOCALE, FALLBACK_LOCALE, type Locale } from "./types";
```

- [ ] **Step 6: Seed khoá mặc định trong `src/lib/initDB.ts`**

Tìm mảng `knex("o_setting").insert([...])` (quanh dòng 274). Thêm một phần tử vào mảng, cạnh `{ key: "ragLimit", value: 3 }`:

```typescript
          {
            key: "content_language",
            value: "en",
          },
```

- [ ] **Step 7: Tạo route đọc ngôn ngữ**

Tạo `src/routes/setting/language/getLanguage.ts`:

```typescript
import express from "express";
import { success } from "@/lib/responseFormat";
import { getLocale } from "@/i18n";

const router = express.Router();

export default router.get("/", async (req, res) => {
  const locale = await getLocale(req as any);
  res.status(200).send(success(locale));
});
```

- [ ] **Step 8: Tạo route ghi ngôn ngữ**

Tạo `src/routes/setting/language/setLanguage.ts`:

```typescript
import express from "express";
import { success, error } from "@/lib/responseFormat";
import { isLocale, setLocale, t, getLocale } from "@/i18n";

const router = express.Router();

export default router.post("/", async (req, res) => {
  const { language } = req.body ?? {};
  if (!isLocale(language)) {
    const current = await getLocale(req as any);
    return res.status(200).send(error(t("setting.language.invalid", {}, current)));
  }
  await setLocale(language);
  res.status(200).send(success(language, t("common.success", {}, language)));
});
```

- [ ] **Step 9: Sinh lại router và kiểm tra bằng tay**

Chạy `yarn dev`, chờ log `数据库目录:` rồi trong terminal khác:

```bash
curl -s localhost:10588/api/setting/language/getLanguage
curl -s -X POST localhost:10588/api/setting/language/setLanguage \
  -H 'Content-Type: application/json' -d '{"language":"vi"}'
curl -s localhost:10588/api/setting/language/getLanguage
curl -s -X POST localhost:10588/api/setting/language/setLanguage \
  -H 'Content-Type: application/json' -d '{"language":"fr"}'
curl -s localhost:10588/api/setting/language/getLanguage -H 'X-Toonflow-Lang: en-US'
```

Expected, theo thứ tự: `"en"` (hoặc `"vi"` nếu cơ sở dữ liệu đã có sẵn), `code:200` với `message` tiếng Việt, `"vi"`, `code:400` với thông báo tiếng Việt, `"en"` (header thắng giá trị trong cơ sở dữ liệu).

Xác nhận `src/router.ts` đã tự sinh thêm hai dòng `/api/setting/language/...`.

- [ ] **Step 10: Chạy lint, test và commit**

```bash
yarn lint && yarn test
git add src/i18n/ src/routes/setting/language/ src/lib/initDB.ts src/router.ts
git commit -m "feat(i18n): phân giải locale từ header và cài đặt content_language"
```

---

### Task 5: Đưa `t()` vào `responseFormat` và các route cài đặt

**Files:**
- Modify: `src/lib/responseFormat.ts`
- Modify: các file dưới `src/routes/setting/**` có chuỗi CJK
- Modify: `src/i18n/locales/{en,vi,zh}.json`
- Create: `src/lib/responseFormat.test.ts`

**Interfaces:**
- Consumes: `t`, `getLocale`, `Locale` từ Task 3 và Task 4
- Produces: `success`/`error` mặc định dùng khoá dịch; mẫu chuyển đổi để Task 6 nhân rộng

Đây là task **mẫu**: nó thiết lập khuôn mẫu chuyển đổi mà Task 6 sẽ áp cho phần còn lại.

- [ ] **Step 1: Viết test thất bại cho `responseFormat`**

Tạo `src/lib/responseFormat.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { success, error } from "./responseFormat";

describe("success", () => {
  it("mặc định trả thông báo tiếng Anh", () => {
    expect(success(null).message).toBe("Success");
  });

  it("giữ nguyên thông báo được truyền vào", () => {
    expect(success(null, "Đã cập nhật").message).toBe("Đã cập nhật");
  });

  it("giữ nguyên code và data", () => {
    expect(success({ a: 1 })).toMatchObject({ code: 200, data: { a: 1 } });
  });
});

describe("error", () => {
  it("giữ code 400", () => {
    expect(error("boom")).toMatchObject({ code: 400, message: "boom", data: null });
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `yarn test src/lib/responseFormat.test.ts`
Expected: FAIL — nhận `"成功"`, mong đợi `"Success"`.

- [ ] **Step 3: Sửa `src/lib/responseFormat.ts`**

Chỉ đổi giá trị mặc định. Giữ nguyên comment tiếng Trung.

```typescript
import { t } from "@/i18n/translate";

export interface ApiResponse {
  code: number;
  data: any;
  message: string;
}

// 成功回调
export function success<T>(data: T | null = null, message?: string): ApiResponse {
  return {
    code: 200,
    data,
    message: message ?? t("common.success"),
  };
}

// 客户端错误响应
export function error<T>(message: string = "", data: T | null = null): ApiResponse {
  return {
    code: 400,
    data,
    message,
  };
}
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `yarn test src/lib/responseFormat.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Liệt kê chuỗi cần chuyển trong `src/routes/setting`**

```bash
yarn i18n:scan 2>/dev/null | grep '^src/routes/setting' | tee /tmp/setting-strings.txt
wc -l /tmp/setting-strings.txt
```

- [ ] **Step 6: Chuyển từng chuỗi theo khuôn mẫu**

Với mỗi chuỗi, đặt khoá theo đường dẫn module. Ví dụ trong
`src/routes/setting/vendorConfig/updateVendorInputs.ts`:

Trước:
```typescript
if (!vendorConfigData.inputValues) return res.status(500).send(error("未找到模型配置数据"));
res.status(200).send(success("配置成功"));
```

Sau:
```typescript
const locale = await getLocale(req as any);
if (!vendorConfigData.inputValues) {
  return res.status(500).send(error(t("setting.vendorConfig.configDataNotFound", {}, locale)));
}
res.status(200).send(success(null, t("setting.vendorConfig.configured", {}, locale)));
```

Thêm ở đầu file: `import { t, getLocale } from "@/i18n";`

Và bổ sung vào ba catalog:

```json
"setting.vendorConfig.configDataNotFound": "Model configuration data not found."
"setting.vendorConfig.configured": "Configured successfully."
```
```json
"setting.vendorConfig.configDataNotFound": "Không tìm thấy dữ liệu cấu hình mô hình."
"setting.vendorConfig.configured": "Cấu hình thành công."
```
```json
"setting.vendorConfig.configDataNotFound": "未找到模型配置数据"
"setting.vendorConfig.configured": "配置成功"
```

Quy tắc bắt buộc: `zh.json` phải chứa **đúng nguyên văn** chuỗi bị thay thế. Đây là mốc hồi quy.

- [ ] **Step 7: Xác nhận vùng này đã sạch**

Run: `yarn i18n:scan 2>/dev/null | grep '^src/routes/setting' | wc -l`
Expected: `0`

- [ ] **Step 8: Xác nhận ba catalog cùng bộ khoá**

```bash
node -e "
const en=require('./src/i18n/locales/en.json'),vi=require('./src/i18n/locales/vi.json'),zh=require('./src/i18n/locales/zh.json');
const ke=Object.keys(en),kv=Object.keys(vi),kz=Object.keys(zh);
const miss=(a,b,n)=>{const d=a.filter(k=>!b.includes(k)); if(d.length) console.log(n,d);};
miss(ke,kv,'vi thiếu:'); miss(ke,kz,'zh thiếu:'); miss(kz.filter(k=>k!=='test.onlyInZh'),ke,'en thiếu:');
console.log('en',ke.length,'vi',kv.length,'zh',kz.length);
"
```
Expected: không dòng `thiếu:` nào; ba số bằng nhau (trừ `zh` hơn 1 vì `test.onlyInZh`).

- [ ] **Step 9: Chạy lint, test và commit**

```bash
yarn lint && yarn test
git add src/lib/responseFormat.ts src/lib/responseFormat.test.ts src/routes/setting src/i18n/locales
git commit -m "feat(i18n): chuyển chuỗi các route setting sang catalog"
```

---

### Task 6: Chuyển nốt chuỗi backend còn lại

**Files:**
- Modify: các file còn lại trong `src/routes/**`, `src/utils/**`, `src/agents/**`, `src/socket/**`, `src/lib/**`, `src/app.ts`
- Modify: `src/i18n/locales/{en,vi,zh}.json`

**Interfaces:**
- Consumes: khuôn mẫu chuyển đổi từ Task 5
- Produces: `yarn i18n:scan` sạch trên toàn bộ `src/**`

Làm theo **từng lô, mỗi lô một commit**, để review được và để dễ khoanh vùng khi có hồi quy.

Lô theo thứ tự: `src/routes/project` + `src/routes/novel` → `src/routes/assets` + `src/routes/assetsGenerate` → `src/routes/production` → `src/routes/script` + `src/routes/scriptAgent` → `src/routes/*` còn lại → `src/agents/**` → `src/socket/**` → `src/utils/**` + `src/lib/**` + `src/app.ts`.

**Lưu ý riêng cho `src/agents/**` và `src/utils/agent/**`:** chuỗi ở đây phần lớn là `description` của tool AI (ví dụ `z.string().describe("交给子Agent的任务简约描述，100字以内")`). Đây là **prompt gửi cho mô hình**, không phải chuỗi giao diện. Chúng vẫn chuyển sang catalog nhưng dùng tiền tố khoá `agent.` để phân biệt, và phải lấy locale từ ngữ cảnh tác vụ chứ không từ `req` — nếu hàm không có `req`, gọi `await getLocale()` để đọc từ cài đặt.

- [ ] **Step 1: Với mỗi lô, liệt kê chuỗi**

```bash
yarn i18n:scan 2>/dev/null | grep '^src/routes/project\|^src/routes/novel'
```

- [ ] **Step 2: Chuyển theo đúng khuôn mẫu ở Task 5 Step 6**

Ba quy tắc bắt buộc, lặp lại vì task này dễ làm sai:
1. `zh.json` giữ **đúng nguyên văn** chuỗi cũ.
2. **Không đụng vào comment tiếng Trung.**
3. Khoá đặt theo đường dẫn module, ví dụ `project.visualManual.notFound`.

- [ ] **Step 3: Sau mỗi lô, xác nhận lô đó sạch**

```bash
yarn i18n:scan 2>/dev/null | grep '^src/routes/project\|^src/routes/novel' | wc -l
```
Expected: `0`

- [ ] **Step 4: Sau mỗi lô, kiểm tra catalog đồng bộ**

Chạy lại lệnh `node -e` ở Task 5 Step 8. Expected: không dòng `thiếu:` nào.

- [ ] **Step 5: Sau mỗi lô, lint + test + commit**

```bash
yarn lint && yarn test
git add -A src/ && git commit -m "feat(i18n): chuyển chuỗi lô <tên lô> sang catalog"
```

- [ ] **Step 6: Sau lô cuối, xác nhận toàn bộ `src/` sạch**

Run: `yarn i18n:scan 2>/dev/null | grep '^src/' | wc -l`
Expected: `0`

- [ ] **Step 7: Kiểm tra hồi quy locale `zh`**

Chạy `yarn dev`, đặt ngôn ngữ về `zh`, gọi vài route đã chuyển và xác nhận `message` trả về **giống hệt** văn bản tiếng Trung trước khi sửa:

```bash
curl -s -X POST localhost:10588/api/setting/language/setLanguage \
  -H 'Content-Type: application/json' -d '{"language":"zh"}'
curl -s localhost:10588/api/setting/agentDeploy/getAgentUseMode
```
Expected: `message` là `"成功"`.

---

### Task 7: Sổ tay hình ảnh và sổ tay đạo diễn

**Files:**
- Create: `src/i18n/skillPath.ts`
- Create: `src/i18n/skillPath.test.ts`
- Create: `data/skills/art_skills/*/README.en.md` và `README.vi.md` (11 style × 2)
- Create: `data/skills/story_skills/*/README.en.md` và `README.vi.md` (13 thể loại × 2)
- Create: `data/skills/.i18n-manifest.json`
- Modify: `src/routes/project/getVisualManual.ts`
- Modify: `src/routes/project/queryDirectorManual.ts`

**Interfaces:**
- Consumes: `Locale`, `getLocale` từ Task 3 và Task 4; glossary từ Task 2
- Produces:
  - `function localizedSkillPath(filePath: string, locale: Locale): string`
  - `function readLocalizedSkill(filePath: string, locale: Locale): string`
  - `data/skills/.i18n-manifest.json`

Đây là phần `data/skills` **duy nhất** nằm trong kế hoạch này, vì nó hiển thị trực tiếp trong hộp thoại Visual Manual / Director's Handbook. 159 file prompt còn lại thuộc kế hoạch 2.

**Bắt buộc:** không sửa một byte nào trong 24 file `README.md` gốc. Bản dịch nằm ở file sidecar.

Lý do kỹ thuật: `scripts/main.ts:18` chép `data/` sang userData theo quy tắc
`fs.existsSync(d) || fs.copyFileSync(s, d)` — file đã tồn tại **không bao giờ bị ghi đè**.
Sửa file gốc tại chỗ sẽ không có tác dụng trên máy đã cài; file sidecar mới thì được chép bình thường.

- [ ] **Step 1: Viết test thất bại cho bộ phân giải path**

Tạo `src/i18n/skillPath.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { localizedSkillPath } from "./skillPath";

describe("localizedSkillPath", () => {
  it("chèn hậu tố locale trước phần mở rộng", () => {
    expect(localizedSkillPath("/a/b/README.md", "en")).toBe("/a/b/README.en.md");
    expect(localizedSkillPath("/a/b/README.md", "vi")).toBe("/a/b/README.vi.md");
  });

  it("locale zh dùng thẳng file gốc", () => {
    expect(localizedSkillPath("/a/b/README.md", "zh")).toBe("/a/b/README.md");
  });

  it("giữ nguyên phần còn lại của đường dẫn", () => {
    expect(localizedSkillPath("/x/art_prompt/art_scene.md", "en")).toBe("/x/art_prompt/art_scene.en.md");
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `yarn test src/i18n/skillPath.test.ts`
Expected: FAIL — không tìm thấy `./skillPath`.

- [ ] **Step 3: Viết `src/i18n/skillPath.ts`**

```typescript
import fs from "fs";
import path from "path";
import { FALLBACK_LOCALE, type Locale } from "./types";

/** `/a/README.md` + `en` -> `/a/README.en.md`. Locale zh dùng thẳng file gốc. */
export function localizedSkillPath(filePath: string, locale: Locale): string {
  if (locale === FALLBACK_LOCALE) return filePath;
  const ext = path.extname(filePath);
  return `${filePath.slice(0, filePath.length - ext.length)}.${locale}${ext}`;
}

/** Đọc bản dịch nếu có, không thì lùi về file gốc. Không có file nào thì trả chuỗi rỗng. */
export function readLocalizedSkill(filePath: string, locale: Locale): string {
  const candidate = localizedSkillPath(filePath, locale);
  for (const p of [candidate, filePath]) {
    try {
      return fs.readFileSync(p, "utf-8");
    } catch {
      continue;
    }
  }
  return "";
}
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `yarn test src/i18n/skillPath.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Xuất thêm từ barrel**

Thêm vào `src/i18n/index.ts`:

```typescript
export { localizedSkillPath, readLocalizedSkill } from "./skillPath";
```

- [ ] **Step 6: Dịch 24 file README sang hai sidecar**

11 file dưới `data/skills/art_skills/*/README.md` và 13 file dưới
`data/skills/story_skills/*/README.md`. Tổng 1.419 dòng.

Với mỗi file, tạo `README.en.md` và `README.vi.md` cùng thư mục. Yêu cầu:
- Giữ **nguyên cấu trúc markdown**: cùng số heading, cùng thứ tự, cùng mức heading.
- Dòng đầu tiên là H1 — nó chính là nhãn hiển thị trên thẻ, nên phải ngắn gọn.
- Thuật ngữ theo `docs/i18n/glossary.json`.

Ví dụ dòng đầu, dùng làm chuẩn cho các file còn lại:

| Gốc | `en` | `vi` |
| --- | --- | --- |
| `# 90年代日式动画风格说明` | `# 1990s Japanese Anime Style` | `# Phong cách anime Nhật thập niên 1990` |
| `# 2D扁平风（Flat Design）风格说明` | `# 2D Flat Design Style` | `# Phong cách 2D Flat Design` |
| `# 喜剧搞笑 · 导演叙事手法技能包` | `# Comedy — Director Narrative Toolkit` | `# Hài hước — Bộ kỹ năng dẫn chuyện đạo diễn` |
| `# 恐怖灵异 · 导演叙事手法技能包` | `# Horror & Supernatural — Director Narrative Toolkit` | `# Kinh dị siêu nhiên — Bộ kỹ năng dẫn chuyện đạo diễn` |

- [ ] **Step 7: Tạo `data/skills/.i18n-manifest.json`**

Sinh bằng lệnh sau, để hash luôn khớp với nội dung thật:

```bash
node -e '
const fs=require("fs"),path=require("path"),crypto=require("crypto"),fg=require("fast-glob");
const files=fg.sync(["data/skills/art_skills/*/README.md","data/skills/story_skills/*/README.md"]);
const out={};
for(const f of files){
  const rel=path.relative("data/skills",f);
  const translated=["en","vi"].filter(l=>fs.existsSync(f.replace(/\.md$/,`.${l}.md`)));
  out[rel]={sourceHash:crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex"),translated};
}
fs.writeFileSync("data/skills/.i18n-manifest.json",JSON.stringify(out,null,2)+"\n");
console.log("đã ghi",Object.keys(out).length,"mục");
'
```
Expected: `đã ghi 24 mục`. Kiểm tra mọi mục đều có `"translated": ["en","vi"]`.

- [ ] **Step 8: Đấu nối vào `getVisualManual.ts`**

Thêm import: `import { getLocale, readLocalizedSkill } from "@/i18n";`

Ngay đầu handler, sau `try {`:

```typescript
    const locale = await getLocale(req as any);
```

Đổi phần đọc README (quanh dòng 74–76) từ:

```typescript
        const readmePath = path.join(styleDir, "README.md");
        const readmeContent = fs.readFileSync(readmePath, "utf-8");
        const firstLine = readmeContent.split("\n")[0].replace(/--/g, "");
```

thành:

```typescript
        const readmePath = path.join(styleDir, "README.md");
        const readmeContent = readLocalizedSkill(readmePath, locale);
        const firstLine = readmeContent.split("\n")[0].replace(/--/g, "");
```

Và trong `DATA_MAP.map`, đổi `data: readMd(mdPath)` thành `data: readLocalizedSkill(mdPath, locale)`.

Hàm `readMd` trở nên không dùng tới — xoá nó đi để `tsc` không báo biến thừa.

- [ ] **Step 9: Đấu nối tương tự vào `queryDirectorManual.ts`**

Cùng ba thay đổi: lấy `locale` đầu handler, `readLocalizedSkill` thay `readMd`, xoá `readMd`.

- [ ] **Step 10: Nhãn `DATA_MAP` phải đã được chuyển ở Task 6**

`DATA_MAP` trong hai file này có `label` tiếng Trung (`前缀`, `角色`, `道具`, `分镜`…). Chúng
thuộc lô `src/routes/project` của Task 6. Xác nhận đã xong:

Run: `yarn i18n:scan 2>/dev/null | grep 'getVisualManual\|queryDirectorManual' | wc -l`
Expected: `0`

Nếu khác `0`, chuyển chúng ngay theo khuôn mẫu Task 5 Step 6, khoá đặt là
`project.visualManual.label.<value>`.

- [ ] **Step 11: Kiểm tra bằng tay trên giao diện**

```bash
yarn dev
```
Mở dự án, bấm mở hộp thoại Visual Manual. Expected ở locale `en`: tên thẻ là tiếng Anh
(`# 1990s Japanese Anime Style`…), mục Director's Handbook cũng tiếng Anh, nhãn tab bên
trong trình soạn thảo là tiếng Anh. Đổi sang `vi` và kiểm lại. Đổi sang `zh`, xác nhận
hiển thị **đúng như trước khi sửa** — đây là kiểm tra hồi quy.

- [ ] **Step 12: Xác nhận không đụng file gốc**

```bash
git status --porcelain data/skills | grep -v '^??' || echo "không sửa file gốc nào"
```
Expected: `không sửa file gốc nào` — mọi thay đổi trong `data/skills` phải là file mới (`??`).

- [ ] **Step 13: Chạy lint, test và commit**

```bash
yarn lint && yarn test
git add src/i18n/ src/routes/project/ data/skills/
git commit -m "feat(i18n): dịch sổ tay hình ảnh và sổ tay đạo diễn qua file sidecar"
```

---

### Task 8: Dịch dữ liệu nhà cung cấp

**Files:**
- Modify: `data/vendor/atlascloud.ts`, `deepseek.ts`, `grsai.ts`, `klingai.ts`, `minimax.ts`, `null.ts`, `openai.ts`, `toonflow.ts`, `vidu.ts`, `volcengine.ts`, `volcengineSd2.ts`
- Regenerate: `src/lib/vendor.json`

**Interfaces:**
- Consumes: `docs/i18n/glossary.json` từ Task 2
- Produces: dữ liệu nhà cung cấp tiếng Anh; nguồn cho migration ở Task 9

**Quyết định thiết kế:** dữ liệu nhà cung cấp dịch **một chiều sang tiếng Anh**, không chuyển đổi theo locale. Lý do: chúng được seed một lần vào cơ sở dữ liệu và người dùng sửa được, nên không có đường chuyển đổi lúc chạy mà không phá dữ liệu người dùng. Tên thương hiệu vốn đã là tiếng Anh.

- [ ] **Step 1: Xem phạm vi**

```bash
for f in data/vendor/*.ts; do echo "$f: $(grep -o -P '[\x{4e00}-\x{9fff}]+' "$f" | wc -l)"; done
```

- [ ] **Step 2: Dịch từng file**

Chỉ đụng vào các trường `name`, `description`, `inputs[].label`, `inputs[].placeholder`, và `name` của từng model. **Không đổi `key`, `id`, hay bất kỳ định danh nào.**

Cách dịch tên riêng đã chốt:

| Gốc | Tiếng Anh |
| --- | --- |
| `Toonflow官方中转平台` | `Toonflow Official Relay Platform` |
| `火山引擎(豆包)` | `Volcengine (Doubao)` |
| `火山引擎sd2.0真人` | `Volcengine SD2.0 Live-Action` |
| `可灵AI` | `Kling AI` |
| `Vidu 开放平台` | `Vidu Open Platform` |
| `MiniMax(海螺AI)` | `MiniMax (Hailuo AI)` |
| `OpenAI标准接口` | `OpenAI Standard API` |
| `空模板` | `Blank Template` |
| `API密钥` | `API Key` |
| `(支持真人)` | `(Live-Action Supported)` |

- [ ] **Step 3: Sinh lại `vendor.json`**

Run: `yarn vendor2json`
Expected: log `Done, saved vendor.json`.

- [ ] **Step 4: Xác nhận vùng này sạch**

```bash
yarn i18n:scan 2>/dev/null | grep '^data/vendor' | wc -l
grep -c -P '[\x{4e00}-\x{9fff}]' src/lib/vendor.json || echo "vendor.json sạch"
```
Expected: `0` và `vendor.json sạch`.

- [ ] **Step 5: Xác nhận cấu trúc `vendor.json` không đổi ngoài phần văn bản**

```bash
git diff --stat src/lib/vendor.json
node -e "const v=require('./src/lib/vendor.json'); console.log('số nhà cung cấp:', Array.isArray(v)?v.length:Object.keys(v).length)"
```
Expected: số nhà cung cấp giữ nguyên so với trước khi sửa.

- [ ] **Step 6: Chạy lint và commit**

```bash
yarn lint
git add data/vendor src/lib/vendor.json
git commit -m "feat(i18n): dịch dữ liệu nhà cung cấp sang tiếng Anh"
```

---

### Task 9: Migration cho cơ sở dữ liệu đã tồn tại

**Files:**
- Create: `src/lib/migrations/i18nSeed.ts`
- Create: `src/lib/migrations/i18nSeed.test.ts`
- Modify: `src/lib/fixDB.ts`

**Interfaces:**
- Consumes: `src/lib/vendor.json` đã dịch từ Task 8
- Produces: `async function migrateI18nSeed(knexDb: Knex): Promise<{ updated: number; skipped: number }>`

Không có migration này, máy đã cài từ trước vẫn hiển thị tiếng Trung dù mã nguồn đã dịch.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/lib/migrations/i18nSeed.test.ts`. Dùng sqlite trong bộ nhớ để không đụng cơ sở dữ liệu thật.

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import knexFactory, { type Knex } from "knex";
import { migrateI18nSeed } from "./i18nSeed";

let db: Knex;

beforeEach(async () => {
  db = knexFactory({ client: "better-sqlite3", connection: { filename: ":memory:" }, useNullAsDefault: true });
  await db.schema.createTable("o_vendor", (t) => {
    t.text("key");
    t.text("name");
    t.text("description");
  });
});

describe("migrateI18nSeed", () => {
  it("cập nhật bản ghi còn khớp nguyên văn seed gốc", async () => {
    await db("o_vendor").insert({ key: "toonflow", name: "Toonflow官方中转平台", description: "" });
    const result = await migrateI18nSeed(db);
    expect(result.updated).toBeGreaterThan(0);
    const row = await db("o_vendor").where("key", "toonflow").first();
    expect(row.name).toBe("Toonflow Official Relay Platform");
  });

  it("không đè lên bản ghi người dùng đã sửa", async () => {
    await db("o_vendor").insert({ key: "toonflow", name: "Tên tôi tự đặt", description: "" });
    const result = await migrateI18nSeed(db);
    const row = await db("o_vendor").where("key", "toonflow").first();
    expect(row.name).toBe("Tên tôi tự đặt");
    expect(result.skipped).toBeGreaterThan(0);
  });

  it("chạy lại nhiều lần không đổi kết quả", async () => {
    await db("o_vendor").insert({ key: "toonflow", name: "Toonflow官方中转平台", description: "" });
    await migrateI18nSeed(db);
    const second = await migrateI18nSeed(db);
    expect(second.updated).toBe(0);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `yarn test src/lib/migrations/i18nSeed.test.ts`
Expected: FAIL — không tìm thấy `./i18nSeed`.

- [ ] **Step 3: Xác định tên bảng và cột thật**

Test trên dùng `o_vendor`/`name`/`description` làm giả định. Xác nhận bằng:

```bash
grep -n "o_vendor\|name:" src/lib/fixDB.ts | head -20
node -e "const v=require('./src/lib/vendor.json'); console.log(JSON.stringify(Array.isArray(v)?v[0]:Object.values(v)[0],null,2).slice(0,600))"
```

Nếu tên bảng hoặc cột khác, **sửa test cho khớp thực tế trước khi viết implementation**, đừng uốn implementation theo giả định sai.

- [ ] **Step 4: Viết `src/lib/migrations/i18nSeed.ts`**

Bảng ánh xạ nguyên văn tiếng Trung → bản dịch tiếng Anh, lấy từ bảng ở Task 8 Step 2. Chỉ `update` khi giá trị hiện tại **khớp chính xác** chuỗi tiếng Trung gốc.

```typescript
import type { Knex } from "knex";

/** nguyên văn tiếng Trung đã từng được seed -> bản dịch tiếng Anh */
const NAME_MAP: Record<string, string> = {
  "Toonflow官方中转平台": "Toonflow Official Relay Platform",
  "火山引擎(豆包)": "Volcengine (Doubao)",
  "火山引擎sd2.0真人": "Volcengine SD2.0 Live-Action",
  "可灵AI": "Kling AI",
  "Vidu 开放平台": "Vidu Open Platform",
  "MiniMax(海螺AI)": "MiniMax (Hailuo AI)",
  "OpenAI标准接口": "OpenAI Standard API",
  "空模板": "Blank Template",
};

export async function migrateI18nSeed(knexDb: Knex): Promise<{ updated: number; skipped: number }> {
  let updated = 0;
  let skipped = 0;

  for (const [zh, en] of Object.entries(NAME_MAP)) {
    const affected = await knexDb("o_vendor").where("name", zh).update({ name: en });
    updated += affected;
  }

  const remaining = await knexDb("o_vendor").whereNotIn("name", Object.values(NAME_MAP));
  skipped = remaining.length;

  return { updated, skipped };
}
```

- [ ] **Step 5: Chạy test, xác nhận PASS**

Run: `yarn test src/lib/migrations/i18nSeed.test.ts`
Expected: 3 passed.

- [ ] **Step 6: Gọi migration từ `fixDB.ts`**

Thêm vào cuối hàm export mặc định của `src/lib/fixDB.ts`:

```typescript
  const { migrateI18nSeed } = await import("./migrations/i18nSeed");
  const result = await migrateI18nSeed(knexDb);
  if (result.updated > 0) console.log(`[i18n] đã cập nhật ${result.updated} bản ghi nhà cung cấp sang tiếng Anh`);
```

Tên tham số knex trong `fixDB.ts` có thể khác `knexDb` — dùng đúng tên đang có trong file.

- [ ] **Step 7: Thử trên bản sao cơ sở dữ liệu thật**

```bash
cp data/db2.sqlite /tmp/db2-backup.sqlite
yarn dev
```
Expected: log `[i18n] đã cập nhật N bản ghi`. Mở giao diện, vào Settings → Model Providers, xác nhận tên nhà cung cấp đã sang tiếng Anh. Nếu hỏng: `cp /tmp/db2-backup.sqlite data/db2.sqlite`.

- [ ] **Step 8: Chạy lint, test và commit**

```bash
yarn lint && yarn test
git add src/lib/migrations src/lib/fixDB.ts
git commit -m "feat(i18n): migration dịch dữ liệu nhà cung cấp trong cơ sở dữ liệu cũ"
```

---

### Task 10: Vá catalog vue-i18n trong bundle giao diện

**Files:**
- Create: `scripts/patch-web-i18n.ts`
- Create: `scripts/patch-web-i18n.test.ts`
- Modify: `data/web/index.html` (kết quả chạy script)
- Modify: `package.json`

**Interfaces:**
- Consumes: không
- Produces: `yarn i18n:patch-web`; hàm `patchBundle(source: string): { output: string; applied: string[] }`

Ba key `settings.menu.ui`, `settings.menu.modelMap`, `settings.menu.devConfig` có trong catalog `zh` nhưng thiếu ở `en` và `vi`, nên hiện ra dạng key thô. Ngoài ra `skillsSkillsManagement` ở `en` bị lặp từ.

**Bắt buộc:** định vị bằng neo cú pháp `menu:{…}`, **không** bằng tên biến đã minify (`$Ci`, `Jxi`, `XLi`) — chúng đổi sau mỗi lần upstream build lại.

- [ ] **Step 1: Viết test thất bại**

Tạo `scripts/patch-web-i18n.test.ts`. Dùng bundle giả tối giản để test nhanh và ổn định.

```typescript
import { describe, it, expect } from "vitest";
import { patchBundle } from "./patch-web-i18n";

const FAKE = [
  'var Aaa={menu:{about:"关于",skillsSkillsManagement:"Skills技能管理",ui:"界面设置",modelMap:"模型映射",devConfig:"开发者选项"},other:1};',
  'var Bbb={menu:{about:"About",skillsSkillsManagement:"SkillsSkills Management"},other:1};',
  'var Ccc={menu:{about:"Giới thiệu",skillsSkillsManagement:"Quản lý Skills"},other:1};',
].join("");

describe("patchBundle", () => {
  it("chèn key thiếu vào catalog tiếng Anh", () => {
    const { output } = patchBundle(FAKE);
    expect(output).toContain('ui:"Interface Settings"');
    expect(output).toContain('modelMap:"Model Mapping"');
    expect(output).toContain('devConfig:"Developer Options"');
  });

  it("chèn key thiếu vào catalog tiếng Việt", () => {
    const { output } = patchBundle(FAKE);
    expect(output).toContain('ui:"Cài đặt giao diện"');
    expect(output).toContain('modelMap:"Ánh xạ mô hình"');
  });

  it("sửa giá trị lặp từ", () => {
    const { output } = patchBundle(FAKE);
    expect(output).not.toContain("SkillsSkills Management");
    expect(output).toContain('skillsSkillsManagement:"Skills Management"');
  });

  it("không đụng vào catalog tiếng Trung", () => {
    const { output } = patchBundle(FAKE);
    expect(output).toContain('ui:"界面设置"');
  });

  it("chạy lại lần hai không đổi gì thêm", () => {
    const once = patchBundle(FAKE).output;
    expect(patchBundle(once).output).toBe(once);
  });

  it("báo lỗi khi không tìm được neo", () => {
    expect(() => patchBundle("var x=1;")).toThrow(/không tìm thấy/i);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `yarn test scripts/patch-web-i18n.test.ts`
Expected: FAIL — không tìm thấy `./patch-web-i18n`.

- [ ] **Step 3: Viết `scripts/patch-web-i18n.ts`**

Nhận diện locale của mỗi khối `menu:{…}` bằng giá trị của key `about` (dấu hiệu ngôn ngữ tin cậy, có trong mọi catalog).

```typescript
import fs from "fs";

const ADDITIONS: Record<"en" | "vi", Record<string, string>> = {
  en: { ui: "Interface Settings", modelMap: "Model Mapping", devConfig: "Developer Options" },
  vi: { ui: "Cài đặt giao diện", modelMap: "Ánh xạ mô hình", devConfig: "Tuỳ chọn nhà phát triển" },
};

const FIXES: Record<"en" | "vi", Record<string, string>> = {
  en: { skillsSkillsManagement: "Skills Management" },
  vi: { skillsSkillsManagement: "Quản lý Skills" },
};

/** Đoán locale của một khối menu qua giá trị key `about`. */
function detectLocale(block: string): "en" | "vi" | "other" {
  const about = /about:"([^"]*)"/.exec(block)?.[1] ?? "";
  if (/[一-鿿]/.test(about)) return "other";
  if (/^Giới thiệu$/.test(about)) return "vi";
  if (/^About$/.test(about)) return "en";
  return "other";
}

export function patchBundle(source: string): { output: string; applied: string[] } {
  const applied: string[] = [];
  let found = 0;

  const output = source.replace(/menu:\{([^{}]*)\}/g, (whole, body: string) => {
    found++;
    const locale = detectLocale(whole);
    if (locale === "other") return whole;

    let next = body;
    for (const [key, value] of Object.entries(FIXES[locale])) {
      const re = new RegExp(`${key}:"[^"]*"`);
      if (re.test(next)) {
        next = next.replace(re, `${key}:"${value}"`);
        applied.push(`${locale}.${key} (sửa)`);
      }
    }
    for (const [key, value] of Object.entries(ADDITIONS[locale])) {
      if (new RegExp(`(^|,)${key}:`).test(next)) continue;
      next += `,${key}:"${value}"`;
      applied.push(`${locale}.${key} (thêm)`);
    }
    return `menu:{${next}}`;
  });

  if (found === 0) throw new Error("không tìm thấy neo `menu:{…}` trong bundle — cấu trúc đã đổi, dừng lại");

  return { output, applied };
}

function main() {
  const file = "data/web/index.html";
  const source = fs.readFileSync(file, "utf-8");
  const { output, applied } = patchBundle(source);
  if (applied.length === 0) {
    console.log("Không có gì để vá (đã vá từ trước).");
    return;
  }
  fs.writeFileSync(file, output, "utf-8");
  console.log(`Đã vá ${applied.length} mục:`);
  for (const a of applied) console.log("  -", a);
}

if (require.main === module) main();
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `yarn test scripts/patch-web-i18n.test.ts`
Expected: 6 passed.

Nếu test "không đụng vào catalog tiếng Trung" trượt, kiểm lại `detectLocale` — nó phải trả `other` cho khối có `about` chứa CJK.

- [ ] **Step 5: Sao lưu bundle rồi chạy thật**

```bash
cp data/web/index.html /tmp/index.html.backup
```

Thêm vào `"scripts"` của `package.json`:

```json
"i18n:patch-web": "tsx scripts/patch-web-i18n.ts",
```

Run: `yarn i18n:patch-web`
Expected: liệt kê 8 mục (3 thêm + 1 sửa, cho mỗi locale `en` và `vi`).

Nếu script báo lỗi `không tìm thấy neo`, **dừng lại** và báo cáo — regex khối menu cần chỉnh cho khớp bundle thật, đừng nới lỏng nó cho tới khi hết lỗi.

- [ ] **Step 6: Xác nhận trên giao diện thật**

```bash
yarn dev
```
Mở `http://localhost:10588/#/task`, vào Settings. Expected: menu bên trái hiện "Interface Settings", "Model Mapping", "Developer Options", "Skills Management" — không còn dòng nào dạng `settings.menu.*`. Đổi ngôn ngữ sang Tiếng Việt, kiểm lại tương ứng.

Nếu bundle hỏng (trang trắng): `cp /tmp/index.html.backup data/web/index.html`.

- [ ] **Step 7: Chạy lại lần hai, xác nhận không đổi gì thêm**

Run: `yarn i18n:patch-web`
Expected: `Không có gì để vá (đã vá từ trước).`

- [ ] **Step 8: Chạy lint, test và commit**

```bash
yarn lint && yarn test
git add scripts/patch-web-i18n.ts scripts/patch-web-i18n.test.ts package.json data/web/index.html
git commit -m "fix(i18n): vá key menu thiếu trong catalog en/vi của bundle giao diện"
```

---

### Task 11: Tài liệu và metadata

**Files:**
- Modify: `README.md`, `docs/README.en.md`, `docs/README.vi.md`
- Modify: `package.json`
- Modify: `.github/workflows/release.yml`, `.github/workflows/debug.yml`
- Create: `docs/i18n/README.md`

**Interfaces:**
- Consumes: toàn bộ công việc từ Task 1–10
- Produces: tài liệu mô tả đúng trạng thái fork

Đặt cuối cùng vì tài liệu phải mô tả hệ thống **đã hoàn tất**, không phải hệ thống dự định.

- [ ] **Step 1: Cập nhật metadata trong `package.json`**

```json
"description": "Toonflow is an AI short-drama and comic-drama tool that turns novels into scripts automatically and pairs them with AI-generated images and video.",
"homepage": "https://github.com/kienmatu/Toonflow-app#readme",
"repository": { "type": "git", "url": "git+https://github.com/kienmatu/Toonflow-app.git" },
"bugs": { "url": "https://github.com/kienmatu/Toonflow-app/issues" }
```

Giữ nguyên trường `author` — công lao thuộc về tác giả gốc.

- [ ] **Step 2: Dịch chuỗi CJK trong hai workflow**

```bash
yarn i18n:scan 2>/dev/null | grep github || grep -n -P '[\x{4e00}-\x{9fff}]' .github/workflows/*.yml
```
Dịch phần `name:` của các step sang tiếng Anh. Không đổi logic.

- [ ] **Step 3: Viết `docs/i18n/README.md`**

Nội dung bắt buộc có:
- Ba locale `en`/`vi`/`zh` và ý nghĩa của từng locale.
- Cách đổi ngôn ngữ: route `/api/setting/language/setLanguage`, hoặc header `X-Toonflow-Lang`.
- Cách thêm chuỗi mới: thêm khoá vào cả ba file `src/i18n/locales/*.json`, `zh.json` giữ nguyên văn tiếng Trung.
- Quy trình sync upstream, chép từ mục 6 của spec.
- Cách chạy `yarn i18n:scan` và `yarn i18n:patch-web`.

- [ ] **Step 4: Cập nhật `README.md` và `docs/README.en.md`, `docs/README.vi.md`**

Thêm mục "Language support" mô tả ba locale backend và trỏ tới `docs/i18n/README.md`. Sửa link repo trỏ về fork ở phần hướng dẫn clone. Giữ nguyên phần ghi công và link tới repo gốc.

- [ ] **Step 5: Xác nhận toàn bộ sạch**

Run: `yarn i18n:scan`
Expected: `Sạch: không còn CJK ngoài vùng cho phép.`, thoát mã 0.

- [ ] **Step 6: Chạy lint, test và commit**

```bash
yarn lint && yarn test
git add README.md docs/ package.json .github/workflows
git commit -m "docs: cập nhật tài liệu và metadata cho fork đã quốc tế hoá"
```

---

## Kiểm chứng cuối kế hoạch

- [ ] `yarn lint` — 0 lỗi
- [ ] `yarn test` — toàn bộ xanh
- [ ] `yarn i18n:scan` — thoát mã 0
- [ ] Ba catalog cùng bộ khoá (lệnh `node -e` ở Task 5 Step 8)
- [ ] Đặt locale `zh`, gọi vài route, xác nhận `message` giống hệt trước khi sửa
- [ ] Đặt locale `en` rồi `vi`, mở Settings → Model Providers, xác nhận không còn tiếng Trung và không còn key thô
- [ ] Mở hộp thoại Visual Manual và Director's Handbook ở cả ba locale, xác nhận nhãn thẻ và nhãn tab đúng ngôn ngữ
- [ ] `git status --porcelain data/skills | grep -v '^??'` không trả về gì — không file gốc nào bị sửa
- [ ] `yarn i18n:patch-web` chạy lần hai báo "không có gì để vá"

## Việc còn lại sau kế hoạch này

159 file prompt còn lại trong `data/skills` (~14.100 dòng) vẫn nguyên tiếng Trung, nên nội dung AI sinh ra vẫn theo tiếng Trung. Đó là nội dung của kế hoạch 2, sẽ viết sau khi kế hoạch này hoàn tất — nó dùng lại bộ phân giải path và manifest do Task 7 dựng nên.
