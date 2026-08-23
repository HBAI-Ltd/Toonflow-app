import fs from "fs";

const ADDITIONS: Record<"en" | "vi", Record<string, string>> = {
  en: { ui: "Interface Settings", modelMap: "Model Mapping", devConfig: "Developer Options" },
  vi: { ui: "Cài đặt giao diện", modelMap: "Ánh xạ mô hình", devConfig: "Tuỳ chọn nhà phát triển" },
};

const FIXES: Record<"en" | "vi", Record<string, string>> = {
  en: { skillsSkillsManagement: "Skills Management" },
  vi: { skillsSkillsManagement: "Quản lý Skills" },
};

/**
 * Đoán locale của một khối menu qua giá trị key `about` — dùng dải Unicode
 * theo hệ chữ viết (script), KHÔNG so khớp một câu chữ cụ thể. Trong bundle
 * thật, `about` mang nghĩa "Kiểm tra cập nhật" chứ không phải "Giới thiệu",
 * và nội dung này có thể đổi ở lần build tiếp theo — nhưng hệ chữ viết
 * (Latin có dấu tiếng Việt / ASCII thuần / CJK / Kana / Thái / Kirin) thì ổn định.
 * Khối không có key `about` (menu điều hướng, menu Monaco editor, …) bị bỏ qua.
 */
function detectLocale(block: string): "en" | "vi" | "other" {
  const match = /about:"([^"]*)"/.exec(block);
  if (!match) return "other"; // không phải catalog settings.menu — không đụng vào
  const about = match[1];

  // CJK (Hán), Kana (Nhật), Thái, Kirin (Nga) → không phải en/vi, bỏ qua.
  if (/[㐀-鿿぀-ヿ฀-๿Ѐ-ӿ]/.test(about)) return "other"; // i18n-ignore — cận trên dải mã CJK dùng để nhận diện hệ chữ viết, không phải chuỗi dịch

  // Ký tự có dấu đặc trưng tiếng Việt (đ/ơ/ư/â/ê/ô/ă + toàn bộ khối
  // Latin Extended Additional dùng cho nguyên âm có thanh điệu).
  if (/[đĐơƠưƯâÂêÊôÔăĂẠ-ỹ]/.test(about)) return "vi";

  // Không còn hệ chữ viết nào khác và toàn ASCII → tiếng Anh.
  if (/^[\x00-\x7f]*$/.test(about)) return "en";

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
        const already = new RegExp(`${key}:"${value}"`).test(next);
        if (!already) {
          next = next.replace(re, `${key}:"${value}"`);
          applied.push(`${locale}.${key} (sửa)`);
        }
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
