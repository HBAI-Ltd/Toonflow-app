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
