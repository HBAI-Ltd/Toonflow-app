import { describe, it, expect } from "vitest";
import { patchBundle } from "./patch-web-ui";

// ---------------------------------------------------------------------------
// Lỗi 1 — font
// ---------------------------------------------------------------------------

const BROKEN_FONT_CSS =
  ':root{--td-font-family: PingFang SC, Microsoft YaHei, Arial Regular;--td-font-family-medium: PingFang SC, Microsoft YaHei, Arial Medium}' +
  ':root{--td-font-family: pingfang sc, microsoft yahei, arial regular;--td-font-family-medium: pingfang sc, microsoft yahei, arial medium}';

// Mảnh interceptor + ft(...) hợp lệ tối thiểu để patchBundle() (áp cả ba vá
// trong một lượt) không bị chặn ở các anchor khác khi test chỉ nhắm vào font.
const VALID_INTERCEPTOR =
  'Jt.interceptors.request.use(function(e){const{baseUrl:t,otherSetting:n}=yr(Ns());e.baseURL=t.value,e.timeout=n.value.axiosTimeOut;const r=localStorage.getItem("token");return r&&(e.headers.Authorization=r),e});';

const ONE_FT_CALL = 'ft("返回首页",-1)';

function wrap(css: string): string {
  return css + VALID_INTERCEPTOR + ONE_FT_CALL;
}

describe("patchBundle — lỗi 1 (font tiếng Việt vỡ dấu)", () => {
  it("thay toàn bộ khai báo --td-font-family bắt đầu bằng PingFang SC (cả hai case)", () => {
    const { output, fontsChanged } = patchBundle(wrap(BROKEN_FONT_CSS));
    expect(fontsChanged).toBe(4);
    expect(output).toContain('-apple-system, BlinkMacSystemFont, "Segoe UI"');
    // không còn khai báo nào có PingFang SC đứng đầu
    expect(/--td-font-family(-medium)?\s*:\s*["']?pingfang sc/i.test(output)).toBe(false);
  });

  it("giữ nguyên PingFang SC làm fallback ở cuối", () => {
    const { output } = patchBundle(wrap(BROKEN_FONT_CSS));
    expect(output).toContain('"PingFang SC"');
    expect(output).toContain('"Microsoft YaHei"');
  });

  it("không đụng vào --td-font-family khác đã có Latin đứng trước (đã đúng từ đầu)", () => {
    const src = wrap(':root{--td-font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif}');
    const { output, fontsChanged } = patchBundle(src);
    expect(fontsChanged).toBe(0);
    expect(output).toContain('--td-font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif');
  });

  it("idempotent: chạy lần hai không đổi gì", () => {
    const once = patchBundle(wrap(BROKEN_FONT_CSS)).output;
    const twice = patchBundle(once);
    expect(twice.output).toBe(once);
    expect(twice.fontsChanged).toBe(0);
  });

  it("báo lỗi khi thiếu neo --td-font-family", () => {
    const src = VALID_INTERCEPTOR + ONE_FT_CALL; // không có CSS var nào
    expect(() => patchBundle(src)).toThrow(/--td-font-family/);
  });
});

// ---------------------------------------------------------------------------
// Lỗi 2 — interceptor không gửi locale
// ---------------------------------------------------------------------------

describe("patchBundle — lỗi 2 (interceptor không gửi X-Toonflow-Lang)", () => {
  it("thêm header X-Toonflow-Lang lấy từ localStorage locale", () => {
    const src = wrap(BROKEN_FONT_CSS);
    const { output, interceptorPatched } = patchBundle(src);
    expect(interceptorPatched).toBe(true);
    expect(output).toContain('localStorage.getItem("locale")');
    expect(output).toContain('headers["X-Toonflow-Lang"]');
  });

  it("không phá vỡ logic gửi Authorization token gốc", () => {
    const { output } = patchBundle(wrap(BROKEN_FONT_CSS));
    expect(output).toContain('localStorage.getItem("token")');
    expect(output).toContain("e.headers.Authorization=r");
  });

  it("bỏ qua đối số quote khi lấy locale (strip dấu ngoặc kép bọc quanh)", () => {
    const { output } = patchBundle(wrap(BROKEN_FONT_CSS));
    expect(output).toMatch(/replace\(\/\^"\|"\$\/g,""\)/);
  });

  it("idempotent: chạy lần hai không đổi gì và không patch lại", () => {
    const once = patchBundle(wrap(BROKEN_FONT_CSS)).output;
    const twice = patchBundle(once);
    expect(twice.output).toBe(once);
    expect(twice.interceptorPatched).toBe(false);
  });

  it("báo lỗi khi thiếu neo interceptors.request.use + localStorage token", () => {
    const src = BROKEN_FONT_CSS + ONE_FT_CALL; // không có interceptor nào
    expect(() => patchBundle(src)).toThrow(/token/);
  });
});

// ---------------------------------------------------------------------------
// Lỗi 3 — chuỗi CJK hardcode trong ft("…")
// ---------------------------------------------------------------------------

describe("patchBundle — lỗi 3 (chuỗi tiếng Trung hardcode trong ft(\"…\"))", () => {
  it("dịch một chuỗi CJK đã biết sang tiếng Anh", () => {
    const src = wrap(BROKEN_FONT_CSS);
    const { output, stringsTranslated } = patchBundle(src);
    expect(output).toContain('ft("Back to Home",-1)');
    expect(output).not.toContain("返回首页");
    expect(stringsTranslated).toContain("返回首页");
  });

  it("giữ nguyên khoảng trắng đầu/cuối khi dịch", () => {
    const src =
      ':root{--td-font-family: -apple-system, sans-serif}' +
      VALID_INTERCEPTOR +
      'ft(" 保存 ",-1)';
    const { output } = patchBundle(src);
    expect(output).toContain('ft(" Save ",-1)');
  });

  it("dịch nhiều chuỗi CJK khác nhau trong cùng một lượt", () => {
    const src =
      ':root{--td-font-family: -apple-system, sans-serif}' +
      VALID_INTERCEPTOR +
      'ft("自动",-1);ft("浅色",-1);ft("深色",-1)';
    const { output } = patchBundle(src);
    expect(output).toContain('ft("Auto",-1)');
    expect(output).toContain('ft("Light",-1)');
    expect(output).toContain('ft("Dark",-1)');
  });

  it("không đụng vào chuỗi CJK ngoài ft(...) (ví dụ trong catalog vi/en/zh)", () => {
    const src = wrap(BROKEN_FONT_CSS) + 'var Zzz={confirm:"保存"};';
    const { output } = patchBundle(src);
    expect(output).toContain('confirm:"保存"');
  });

  it("idempotent: chạy lần hai không đổi gì và không dịch lại", () => {
    const once = patchBundle(wrap(BROKEN_FONT_CSS)).output;
    const twice = patchBundle(once);
    expect(twice.output).toBe(once);
    expect(twice.stringsTranslated).toEqual([]);
  });

  it("báo lỗi khi thiếu neo ft(\"…\") hoàn toàn", () => {
    const src = BROKEN_FONT_CSS + VALID_INTERCEPTOR; // không có ft(...) nào
    expect(() => patchBundle(src)).toThrow(/ft\(/);
  });

  it("báo lỗi to (không âm thầm bỏ qua) khi gặp chuỗi CJK lạ chưa có trong bảng dịch", () => {
    const src = wrap(BROKEN_FONT_CSS) + 'ft("这是一个从未见过的新字符串",-1)';
    expect(() => patchBundle(src)).toThrow(/chưa có trong bảng dịch|这是一个从未见过的新字符串/);
  });
});

// ---------------------------------------------------------------------------
// Idempotence toàn cục — cả ba vá trong cùng một lượt
// ---------------------------------------------------------------------------

describe("patchBundle — idempotence toàn cục", () => {
  it("bundle giả lập đầy đủ ba lỗi: vá một lần xong, vá lần hai byte-identical", () => {
    const src =
      ':root{--td-font-family: PingFang SC, Microsoft YaHei, Arial Regular}' +
      VALID_INTERCEPTOR +
      'ft("已上传",-1);ft("批量删除",-1)';
    const once = patchBundle(src);
    expect(once.fontsChanged).toBeGreaterThan(0);
    expect(once.interceptorPatched).toBe(true);
    expect(once.stringsTranslated.length).toBe(2);

    const twice = patchBundle(once.output);
    expect(twice.output).toBe(once.output);
    expect(twice.fontsChanged).toBe(0);
    expect(twice.interceptorPatched).toBe(false);
    expect(twice.stringsTranslated).toEqual([]);
  });
});
