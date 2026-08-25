import { describe, it, expect } from "vitest";
import { defaultChapterRegex, patchBundle } from "./patch-web-ui";

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

// Hai mảng tab của màn "tạo mới" (manual mỹ thuật + manual đạo diễn), rút gọn
// đúng hình dạng có thật trong bundle. patchBundle() áp cả bốn vá trong một
// lượt nên mọi bundle giả đều phải mang đủ neo này.
const VALID_MANUAL_TABS =
  '<script type="module" crossorigin>' +
  'const u=()=>[{label:"README",value:"README",data:""},' +
  '{label:"前缀",value:"prefix",data:""},' +
  '{label:"角色",value:"art_character",data:""},' +
  '{label:"角色衍生",value:"art_character_derivative",data:""},' +
  '{label:"道具",value:"art_prop",data:""},' +
  '{label:"道具衍生",value:"art_prop_derivative",data:""},' +
  '{label:"场景",value:"art_scene",data:""},' +
  '{label:"场景衍生",value:"art_scene_derivative",data:""},' +
  '{label:"分镜",value:"director_storyboard",data:""},' +
  '{label:"分镜视频",value:"art_storyboard_video",data:""},' +
  '{label:"技法-导演规划",value:"director_planning_style",data:""},' +
  '{label:"技法-分镜表设计",value:"director_storyboard_table_style",data:""}],' +
  'q=()=>[{label:"README",value:"README",data:""},' +
  '{label:"导演规划",value:"director_planning_narrative",data:""},' +
  '{label:"分镜表",value:"director_storyboard_table_narrative",data:""}];';

// Mảnh tối thiểu của batchAddScript trong bundle thật: default trong Pinia,
// fallback parser, giá trị ban đầu của ô regex và reset khi đóng dialog.
const VALID_CHAPTER_IMPORT =
  'chapterReg:"/第\\\\s*([0-9０-９零一二三四五六七八九十百千万]+)\\\\s*[章回节]\\\\s*([^\\\\n\\\\r]*)/g",' +
  'const RJo=hr(MJo,[["__scopeId","data-v-test"]]),IJo=/第\\s*([0-9０-９零一二三四五六七八九十百千万]+)\\s*集\\s*([^\\n\\r]*)/g,w5e={};' +
  'function jJo(e,t){let n;const r=t==null?void 0:t.trim();r?n=UJo(r):n=IJo,n.lastIndex=0;return Array.from(e.matchAll(n))}' +
  'const h=ue(!1),f=ue(""),g=ue(""),k=ue(!1);lt(f,B=>B);' +
  'lt(o,B=>{B||(l.value="",d.value=[],u.value=[],s.value="To1",f.value="",g.value="")});';


function wrap(css: string): string {
  return css + VALID_INTERCEPTOR + ONE_FT_CALL + VALID_MANUAL_TABS + VALID_CHAPTER_IMPORT;
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
    const src = VALID_INTERCEPTOR + ONE_FT_CALL + VALID_MANUAL_TABS + VALID_CHAPTER_IMPORT; // không có CSS var nào
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
    const src = BROKEN_FONT_CSS + ONE_FT_CALL + VALID_MANUAL_TABS + VALID_CHAPTER_IMPORT; // không có interceptor nào
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
      VALID_MANUAL_TABS +
      VALID_CHAPTER_IMPORT +
      'ft(" 保存 ",-1)';
    const { output } = patchBundle(src);
    expect(output).toContain('ft(" Save ",-1)');
  });

  it("dịch nhiều chuỗi CJK khác nhau trong cùng một lượt", () => {
    const src =
      ':root{--td-font-family: -apple-system, sans-serif}' +
      VALID_INTERCEPTOR +
      VALID_MANUAL_TABS +
      VALID_CHAPTER_IMPORT +
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
    const src = BROKEN_FONT_CSS + VALID_INTERCEPTOR + VALID_MANUAL_TABS + VALID_CHAPTER_IMPORT; // không có ft(...) nào
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
      VALID_MANUAL_TABS +
      VALID_CHAPTER_IMPORT +
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

// ---------------------------------------------------------------------------
// Lỗi 4 — nhãn tab tiếng Trung trong hai màn "tạo mới"
// ---------------------------------------------------------------------------

describe('patchBundle — lỗi 4 (nhãn tab manual hardcode tiếng Trung)', () => {
  it("thay label và giữ nguyên value của cả hai mảng", () => {
    const { output, manualLabelsPatched } = patchBundle(wrap(BROKEN_FONT_CSS));
    expect(manualLabelsPatched.length).toBe(13);
    // value là tên file skill — không được đụng
    for (const value of manualLabelsPatched) {
      expect(output).toContain(`,value:"${value}",data:""}`);
    }
    // không còn nhãn tiếng Trung nào của hai mảng này
    for (const zh of ["导演规划", "分镜表", "前缀", "角色衍生", "技法-分镜表设计"]) {
      expect(output).not.toContain(`label:"${zh}"`);
    }
  });

  it("nhãn đọc theo locale trong localStorage (en/vi)", () => {
    const { output } = patchBundle(wrap(BROKEN_FONT_CSS));
    expect(output).toContain('localStorage.getItem("locale")');
    expect(output).toContain("Director planning"); // en
    expect(output).toContain("Kế hoạch đạo diễn"); // vi
    expect(output).toContain("Storyboard table");
    expect(output).toContain("Bảng phân cảnh");
  });

  it("không đụng vào nhãn README", () => {
    const { output } = patchBundle(wrap(BROKEN_FONT_CSS));
    expect(output.match(/\{label:"README",value:"README",data:""\}/g)?.length).toBe(2);
  });

  it("không đụng vào từ điển i18n tiếng Trung của bundle (locale zh hợp lệ)", () => {
    const zhCatalog = 'var Kzz={storyboardTable:{title:"分镜表",desc:"分镜表"}};';
    const { output } = patchBundle(wrap(BROKEN_FONT_CSS) + zhCatalog);
    expect(output).toContain(zhCatalog);
  });

  it("idempotent: chạy lần hai không đổi gì và không vá lại", () => {
    const once = patchBundle(wrap(BROKEN_FONT_CSS)).output;
    const twice = patchBundle(once);
    expect(twice.output).toBe(once);
    expect(twice.manualLabelsPatched).toEqual([]);
  });

  it("báo lỗi to khi thiếu neo mảng tab manual", () => {
    const src = BROKEN_FONT_CSS + VALID_INTERCEPTOR + ONE_FT_CALL + VALID_CHAPTER_IMPORT; // không có mảng tab nào
    expect(() => patchBundle(src)).toThrow(/không tìm thấy neo .*value:"prefix"/);
  });

  it("báo lỗi to khi mảng tab thiếu một entry (bundle đã đổi cấu trúc)", () => {
    const src =
      BROKEN_FONT_CSS +
      VALID_INTERCEPTOR +
      ONE_FT_CALL +
      VALID_MANUAL_TABS.replace('{label:"道具",value:"art_prop",data:""},', "");
    expect(() => patchBundle(src)).toThrow(/art_prop/);
  });
});

// ---------------------------------------------------------------------------
// Lỗi 5 — regex import chapter bị hardcode tiếng Trung
// ---------------------------------------------------------------------------

describe("patchBundle — lỗi 5 (regex chapter theo locale giao diện)", () => {
  it.each(["en", "en-US", "vi", "vi-VN"])(
    "locale %s dùng Chapter/Episode và thực sự tách được kịch bản tiếng Anh",
    (locale) => {
      const regex = defaultChapterRegex(locale);
      const script = "Chapter 1: Arrival\nFirst body\nEpisode 2 - Return\nSecond body";
      const matches = [...script.matchAll(regex)];

      expect(matches.map((match) => [match[1], match[2]])).toEqual([
        ["1", "Arrival"],
        ["2", "Return"],
      ]);
    },
  );

  it.each(["zh", "zh-CN", "zh-TW"])(
    "locale %s giữ regex Trung Quốc và nhận 章/回/节",
    (locale) => {
      const regex = defaultChapterRegex(locale);
      const script = "第一章 开始\n正文\n第2回 重逢\n正文\n第三节 结束\n正文";
      const matches = [...script.matchAll(regex)];

      expect(matches.map((match) => [match[1], match[2]])).toEqual([
        ["一", "开始"],
        ["2", "重逢"],
        ["三", "结束"],
      ]);
    },
  );

  it("vá default setting, fallback parser, ô nhập và reset để cùng chọn theo locale", () => {
    const { output, chapterRegexPatched } = patchBundle(wrap(BROKEN_FONT_CSS));

    expect(chapterRegexPatched).toBe(true);
    expect(output).toContain("function __toonflowDefaultChapterRegex");
    expect(output).toContain(
      '<script type="module" crossorigin>function __toonflowDefaultChapterRegex',
    );
    expect(output.indexOf("function __toonflowDefaultChapterRegex")).toBeLessThan(
      output.indexOf("chapterReg:__toonflowDefaultChapterRegex().toString()"),
    );
    expect(output).toContain("chapterReg:__toonflowDefaultChapterRegex().toString()");
    expect(output).toContain("r?n=UJo(r):n=__toonflowDefaultChapterRegex()");
    expect(output).toContain('f=ue(__toonflowDefaultChapterRegex().toString())');
    expect(output).toContain('f.value=__toonflowDefaultChapterRegex().toString()');
  });

  it("idempotent: chạy lần hai không thay đổi bundle", () => {
    const once = patchBundle(wrap(BROKEN_FONT_CSS));
    const twice = patchBundle(once.output);

    expect(twice.output).toBe(once.output);
    expect(twice.chapterRegexPatched).toBe(false);
  });

  it("nâng cấp bản vá cũ nếu helper nằm sau call site thay vì ở đầu module", () => {
    const correct = patchBundle(wrap(BROKEN_FONT_CSS)).output;
    const helperStart = correct.indexOf("function __toonflowDefaultChapterRegex");
    const helperEnd = correct.indexOf("const u=", helperStart);
    const helper = correct.slice(helperStart, helperEnd);
    const withoutHelper = correct.slice(0, helperStart) + correct.slice(helperEnd);
    const staleInsert = withoutHelper.indexOf("const RJo=");
    const stale = withoutHelper.slice(0, staleInsert) + helper + withoutHelper.slice(staleInsert);

    const upgraded = patchBundle(stale);

    expect(upgraded.chapterRegexPatched).toBe(true);
    expect(upgraded.output).toContain(
      '<script type="module" crossorigin>function __toonflowDefaultChapterRegex',
    );
  });

  it("báo lỗi rõ ràng nếu bundle không còn các neo batchAddScript", () => {
    const src = BROKEN_FONT_CSS + VALID_INTERCEPTOR + ONE_FT_CALL + VALID_MANUAL_TABS;
    expect(() => patchBundle(src)).toThrow(/chapterReg|batchAddScript/);
  });
});
