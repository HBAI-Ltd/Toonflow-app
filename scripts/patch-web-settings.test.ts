import { describe, it, expect } from "vitest";
import { patchBundle, BLOCK_ID, SCRIPT_ID } from "./patch-web-settings";

// Bundle giả: chỉ mang đúng ba neo mà patch-web-settings.ts đòi hỏi, dựng theo
// đúng hình dạng có thật trong data/web/index.html (đã kiểm chứng bằng tay trên
// bundle thật trước khi viết test này) — KHÔNG chạy test trên bundle thật 27MB.
const LOCALE_ARRAY =
  'Tpe=[{label:"简体中文",tips:"Chinese (Simplified)",value:"zh-CN"},' +
  '{label:"繁體中文",tips:"Chinese (Traditional)",value:"zh-TW"},' +
  '{label:"English",tips:"English",value:"en"},' +
  '{label:"ไทย",tips:"Thai",value:"th-TH"},' +
  '{label:"Tiếng Việt",tips:"Vietnamese",value:"vi-VN"},' +
  '{label:"日本語",tips:"Japanese",value:"ja-JP"},' +
  '{label:"Русский",tips:"Russian",value:"ru-RU"}],EF=Spe("locale","zh-CN"),';

const LANGUAGE_PAGE = 'de("p",q_r,Te(o.$t("settings.language.desc")),1)';

const HEAD = "<!doctype html>\n<html>\n  <head>\n    <title>Toonflow</title>\n    <scr" + "ipt type=\"module\">";
const HEAD_END = "</scr" + "ipt>\n  </head>\n";
const BODY = "  <body>\n    <div id=\"app\"></div>\n";
const TAIL = "  </body>\n</html>\n";

function fakeBundle(js = LOCALE_ARRAY + LANGUAGE_PAGE): string {
  return HEAD + js + HEAD_END + BODY + TAIL;
}

describe("patchBundle — chèn widget chọn ngôn ngữ prompt", () => {
  it("chèn đúng một khối script ngay trước </body> cuối file", () => {
    const { output, patched } = patchBundle(fakeBundle());
    expect(patched).toBe(true);
    expect(output.match(new RegExp(`id="${SCRIPT_ID}"`, "g"))?.length).toBe(1);
    // script nằm trước </body> cuối cùng, không phải sau
    const scriptIdx = output.indexOf(SCRIPT_ID);
    expect(scriptIdx).toBeGreaterThan(-1);
    expect(scriptIdx).toBeLessThan(output.lastIndexOf("</body>"));
    expect(output.endsWith(TAIL)).toBe(true);
  });

  it("không đụng vào bất cứ nội dung nào ngoài phần chèn", () => {
    const source = fakeBundle();
    const { output } = patchBundle(source);
    const start = output.indexOf("<scr" + `ipt id="${SCRIPT_ID}"`);
    const end = output.indexOf("</scr" + "ipt>", start) + "</scr".length + "ipt>".length;
    const withoutInsert = output.slice(0, start) + output.slice(end);
    // phần chèn kèm theo đúng phần xuống dòng/thụt lề của chính nó
    expect(withoutInsert.replace(/\n\s*\n/, "\n")).toBe(source);
  });

  it("widget gọi đúng hai endpoint backend (GET get, POST set) kèm header Authorization", () => {
    const { output } = patchBundle(fakeBundle());
    expect(output).toContain("/setting/language/getPromptLanguage");
    expect(output).toContain("/setting/language/setPromptLanguage");
    expect(output).toContain('localStorage.getItem("token")');
    expect(output).toContain("headers.Authorization");
    expect(output).toContain('method:"POST"');
  });

  it("widget mang đủ ba lựa chọn en/vi/zh và một id cố định", () => {
    const { output } = patchBundle(fakeBundle());
    expect(output).toContain(BLOCK_ID);
    for (const value of ['"en"', '"vi"', '"zh"']) expect(output).toContain(value);
  });

  it("widget đọc locale giao diện đúng cách patch-web-ui.ts đã dùng (bóc dấu nháy)", () => {
    const { output } = patchBundle(fakeBundle());
    expect(output).toContain('localStorage.getItem("locale")');
    expect(output).toMatch(/replace\(\/\^"\|"\$\/g,\s*""\)/);
  });

  it("widget neo trên văn bản do bundle render, không trên class/định danh minify", () => {
    const { output } = patchBundle(fakeBundle());
    // ba nhãn locale dùng làm neo DOM
    expect(output).toContain("简体中文");
    expect(output).toContain("Tiếng Việt");
    expect(output).toContain("MutationObserver");
  });

  it("idempotent: chạy lần hai không đổi gì, không nhân đôi script", () => {
    const once = patchBundle(fakeBundle());
    const twice = patchBundle(once.output);
    expect(twice.output).toBe(once.output);
    expect(twice.patched).toBe(false);
    expect(twice.output.match(new RegExp(`id="${SCRIPT_ID}"`, "g"))?.length).toBe(1);
  });

  it("thay khối cũ tại chỗ khi nội dung widget đổi (không chèn thêm khối thứ hai)", () => {
    const stale = patchBundle(fakeBundle()).output.replace(
      "MutationObserver",
      "MutationObserver/*phiên bản cũ*/",
    );
    const again = patchBundle(stale);
    expect(again.patched).toBe(true);
    expect(again.output).not.toContain("phiên bản cũ");
    expect(again.output.match(new RegExp(`id="${SCRIPT_ID}"`, "g"))?.length).toBe(1);
  });

  it("báo lỗi to khi thiếu neo danh sách locale giao diện", () => {
    const src = fakeBundle(LANGUAGE_PAGE);
    expect(() => patchBundle(src)).toThrow(/danh sách locale|label:"English"/);
  });

  it("báo lỗi to khi danh sách locale thiếu một nhãn neo", () => {
    const src = fakeBundle(LOCALE_ARRAY.replace('{label:"Tiếng Việt",tips:"Vietnamese",value:"vi-VN"},', "") + LANGUAGE_PAGE);
    expect(() => patchBundle(src)).toThrow(/Tiếng Việt/);
  });

  it("báo lỗi to khi thiếu neo trang Settings → Language", () => {
    const src = fakeBundle(LOCALE_ARRAY);
    expect(() => patchBundle(src)).toThrow(/settings\.language\.desc/);
  });

  it("báo lỗi to khi đuôi file không phải </body></html>", () => {
    const src = HEAD + LOCALE_ARRAY + LANGUAGE_PAGE + HEAD_END + BODY;
    expect(() => patchBundle(src)).toThrow(/<\/body>/);
  });

  it("báo lỗi to khi sau </body> còn nội dung lạ", () => {
    const src = HEAD + LOCALE_ARRAY + LANGUAGE_PAGE + HEAD_END + BODY + "  </body>\n<div>x</div>\n</html>\n";
    expect(() => patchBundle(src)).toThrow(/<\/body>/);
  });
});
