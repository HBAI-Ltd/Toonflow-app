import fs from "fs";
import path from "path";
import { FALLBACK_LOCALE, LOCALES, type Locale } from "./types";

/** `/a/README.md` + `en` -> `/a/README.en.md`. Locale zh dùng thẳng file gốc. */
export function localizedSkillPath(filePath: string, locale: Locale): string {
  if (locale === FALLBACK_LOCALE) return filePath;
  const ext = path.extname(filePath);
  return `${filePath.slice(0, filePath.length - ext.length)}.${locale}${ext}`;
}

const SIDECAR_LOCALES = LOCALES.filter((l) => l !== FALLBACK_LOCALE);
const SIDECAR_SUFFIX_RE = new RegExp(`\\.(${SIDECAR_LOCALES.join("|")})\\.md$`);

/**
 * Sidecar (`foo.en.md`) -> bản gốc (`foo.md`). File không phải sidecar thì trả nguyên trạng.
 * Dùng để quy mọi biến thể của một skill (gốc + các sidecar) về cùng một định danh,
 * bất kể phía client gửi lên đường dẫn nào trong số đó.
 */
export function canonicalSkillPath(filePath: string): string {
  const match = filePath.match(SIDECAR_SUFFIX_RE);
  if (!match) return filePath;
  return `${filePath.slice(0, filePath.length - match[0].length)}.md`;
}

/**
 * Đường dẫn thật sự nên đọc/hiển thị cho locale này, xuất phát từ bản gốc:
 * sidecar nếu đã tồn tại trên đĩa, ngược lại là chính bản gốc.
 * Khác `readLocalizedSkill` ở chỗ hàm này trả về đường dẫn, không phải nội dung,
 * để gọi nơi cần kiểm tra containment / ghi đè trên chính path đã resolve.
 */
export function resolveSkillReadPath(filePath: string, locale: Locale): string {
  const candidate = localizedSkillPath(filePath, locale);
  return candidate !== filePath && fs.existsSync(candidate) ? candidate : filePath;
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
