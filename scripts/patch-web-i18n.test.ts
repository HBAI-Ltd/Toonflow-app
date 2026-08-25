import { describe, it, expect } from "vitest";
import { patchBundle } from "./patch-web-i18n";

// Một cặp khối en/vi đã vá đầy đủ (đúng cả 4 key từ ADDITIONS+FIXES) — dùng
// để "lót nền" cho các test chỉ muốn xét một khối duy nhất (Trung/không có
// about), sao cho bất biến "phải thấy cả en lẫn vi" được thoả mà không ảnh
// hưởng tới assertion output/applied của khối đang được test.
const ALREADY_PATCHED_EN_VI =
  'var Enn={menu:{ui:"Interface Settings",modelMap:"Model Mapping",devConfig:"Developer Options",about:"Check for Updates",skillsSkillsManagement:"Skills Management"},other:1};' +
  'var Vii={menu:{ui:"Cài đặt giao diện",modelMap:"Ánh xạ mô hình",devConfig:"Tuỳ chọn nhà phát triển",about:"Kiểm tra cập nhật",skillsSkillsManagement:"Quản lý Skills"},other:1};';

const FAKE = [
  'var Aaa={menu:{about:"关于",skillsSkillsManagement:"Skills技能管理",ui:"界面设置",modelMap:"模型映射",devConfig:"开发者选项"},other:1};',
  'var Bbb={menu:{about:"About",skillsSkillsManagement:"SkillsSkills Management"},other:1};',
  'var Ccc={menu:{about:"Giới thiệu",skillsSkillsManagement:"Quản lý Skills"},other:1};',
].join("");

const VENDOR_TEST_FAKE = [
  'var Zh={settings:{menu:{about:"检查更新"},vendor:{test:{videoTitle:"视频生成测试"},addVendor:"添加供应商"}}};',
  'var En={settings:{menu:{about:"Check for Updates",ui:"Interface Settings",modelMap:"Model Mapping",devConfig:"Developer Options",skillsSkillsManagement:"Skills Management"},vendor:{addVendor:"Add Provider",test:"Test",edit:"Edit"}}};',
  'var Vi={settings:{menu:{about:"Kiểm tra cập nhật",ui:"Cài đặt giao diện",modelMap:"Ánh xạ mô hình",devConfig:"Tuỳ chọn nhà phát triển",skillsSkillsManagement:"Quản lý Skills"},vendor:{addVendor:"Thêm nhà cung cấp",test:"Kiểm tra",edit:"Chỉnh sửa"}}};',
  'render($t("settings.vendor.test.videoTitle"),$t("settings.vendor.test.startTest"));',
].join("");

const VENDOR_TEST_KEYS = [
  "textTitle", "imageTitle", "videoTitle", "textEmptyHint", "you", "assistant",
  "textInputPlaceholder", "send", "clearHistory", "prompt", "promptPlaceholder",
  "videoPromptPlaceholder", "uploadImage", "uploadVideo", "uploadAudio", "supportFormat",
  "textToImage", "imageToImage", "multiRef", "textToVideo", "singleImageMode", "selectMode",
  "result", "startTest", "cancel", "referenceImage", "startFrame", "endFrame",
  "startFrameOptional", "endFrameOptional", "optional", "image", "video", "audio",
  "multiRefDesc", "textToVideoDesc", "singleImageDesc", "startEndRequiredDesc",
  "endFrameOptionalDesc", "startFrameOptionalDesc",
] as const;

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

  // Ghi chú: từ khi thêm bất biến "phải thấy cả en lẫn vi trong lượt quét"
  // (xem test báo lỗi bên dưới), input cho patchBundle phải mô phỏng một
  // bundle thật — tức có kèm một khối en và một khối vi đã vá sẵn — nếu
  // không patchBundle sẽ (đúng như thiết kế) coi input chỉ-có-khối-Trung là
  // dấu hiệu detector hỏng. Phần khối Trung và các assertion vẫn giữ nguyên.
  it("không đụng vào khối menu tiếng Trung khác (about là CJK)", () => {
    const src =
      'var Zzz={menu:{about:"關於我們",ui:"其他值"},other:1};' + ALREADY_PATCHED_EN_VI;
    const { output, applied } = patchBundle(src);
    expect(output).toBe(src);
    expect(applied).toEqual([]);
  });

  it("vá bundle đã vá trước đó cho ra output y hệt (idempotent trên input đã vá)", () => {
    const patchedOnce = patchBundle(FAKE).output;
    const { output: patchedTwice, applied } = patchBundle(patchedOnce);
    expect(patchedTwice).toBe(patchedOnce);
    expect(applied).toEqual([]);
  });

  // Trong bundle thật, key `about` mang giá trị "Check for Updates" / "Kiểm tra
  // cập nhật" (không phải "About"/"Giới thiệu"), và có những khối menu:{...}
  // khác hoàn toàn (menu điều hướng, menu Monaco editor) không có key `about`.
  // Các test dưới đây khoá lại hành vi cho đúng hình dạng thật này.
  const REAL_SHAPE = [
    'var Aaa={menu:{ui:"界面设置",modelMap:"模型映射",devConfig:"开发者选项",about:"检查更新",skillsSkillsManagement:"Skills技能管理"},other:1};',
    'var Bbb={menu:{myProject:"我的项目",taskCenter:"任务中心"},other:1};',
    'var Ccc={menu:{about:"Check for Updates",skillsSkillsManagement:"SkillsSkills Management"},other:1};',
    'var Ddd={menu:{myProject:"My Projects",taskCenter:"Task Center"},other:1};',
    'var Eee={menu:{about:"Kiểm tra cập nhật",skillsSkillsManagement:"Kỹ năngQuản lý kỹ năng"},other:1};',
  ].join("");

  it("nhận diện đúng locale khi about mang nghĩa 'kiểm tra cập nhật' thay vì 'giới thiệu'", () => {
    const { output } = patchBundle(REAL_SHAPE);
    expect(output).toContain('ui:"Interface Settings"');
    expect(output).toContain('modelMap:"Model Mapping"');
    expect(output).toContain('devConfig:"Developer Options"');
    expect(output).toContain('skillsSkillsManagement:"Skills Management"');
  });

  it("nhận diện đúng vi khi about mang nghĩa 'kiểm tra cập nhật'", () => {
    const { output } = patchBundle(REAL_SHAPE);
    expect(output).toContain('ui:"Cài đặt giao diện"');
    expect(output).toContain('modelMap:"Ánh xạ mô hình"');
    expect(output).toContain('devConfig:"Tuỳ chọn nhà phát triển"');
    expect(output).toContain('skillsSkillsManagement:"Quản lý Skills"');
  });

  // Ghi chú: cùng lý do như test CJK ở trên — cần kèm một khối en và một
  // khối vi đã vá sẵn để thoả bất biến mới, phần khối menu điều hướng và
  // assertion gốc vẫn giữ nguyên.
  it("không đụng vào khối menu:{...} không có key about (menu điều hướng)", () => {
    const src =
      'var Bbb={menu:{myProject:"My Projects",taskCenter:"Task Center"},other:1};' +
      ALREADY_PATCHED_EN_VI;
    const { output, applied } = patchBundle(src);
    expect(output).toBe(src);
    expect(applied).toEqual([]);
  });

  // Tái hiện lỗi mà task này được viết ra để ngăn: có neo `menu:{…}` nhưng
  // không khối nào nhận diện được là en/vi (detectLocale hỏng, hoặc bundle
  // đổi cấu trúc) — phải báo lỗi rõ ràng thay vì lặng lẽ trả về applied: [].
  it("báo lỗi khi có neo menu:{...} nhưng không khối nào nhận diện được en/vi", () => {
    const src = 'var A={menu:{about:"检查更新",ui:"x"},other:1};var B={menu:{about:"檢查更新",ui:"y"}};';
    expect(() => patchBundle(src)).toThrow(/en.*vi|vi.*en/i);
  });

  it("báo lỗi khi nhận diện được en nhưng không nhận diện được vi, và nêu rõ vi bị thiếu", () => {
    const src = 'var A={menu:{about:"Check for Updates",ui:"x"},other:1};var B={menu:{about:"检查更新",ui:"y"}};';
    expect(() => patchBundle(src)).toThrow(/vi/i);
  });

  // Bundle đã vá thật sự: cả hai locale đều nhận diện được, cả bốn key đều
  // đã đúng từ trước — không được báo lỗi, và không có gì để áp dụng.
  it("bundle thật đã vá trước đó: nhận diện được cả en lẫn vi, không báo lỗi, không có gì để vá", () => {
    const src = [
      'var Aaa={menu:{ui:"Interface Settings",modelMap:"Model Mapping",devConfig:"Developer Options",about:"Check for Updates",skillsSkillsManagement:"Skills Management"},other:1};',
      'var Bbb={menu:{myProject:"My Projects",taskCenter:"Task Center"},other:1};',
      'var Ccc={menu:{ui:"Cài đặt giao diện",modelMap:"Ánh xạ mô hình",devConfig:"Tuỳ chọn nhà phát triển",about:"Kiểm tra cập nhật",skillsSkillsManagement:"Quản lý Skills"},other:1};',
    ].join("");
    expect(() => patchBundle(src)).not.toThrow();
    const { output, applied } = patchBundle(src);
    expect(output).toBe(src);
    expect(applied).toEqual([]);
  });

  it.each([
    ["en", 'videoTitle:"Video Generation Test"', 'startTest:"Start Test"'],
    ["vi", 'videoTitle:"Kiểm tra tạo video"', 'startTest:"Bắt đầu kiểm tra"'],
  ])("vá đủ catalog settings.vendor.test cho %s", (locale, videoTitle, startTest) => {
    const { output, applied } = patchBundle(VENDOR_TEST_FAKE);
    const marker = `test:{textTitle:`;
    const localeStart = output.indexOf(locale === "en" ? "var En=" : "var Vi=");
    const localeEnd = output.indexOf("};", localeStart) + 2;
    const block = output.slice(localeStart, localeEnd);

    expect(block).toContain(marker);
    expect(block).toContain(videoTitle);
    expect(block).toContain(startTest);
    for (const key of VENDOR_TEST_KEYS) expect(block).toMatch(new RegExp(`(?:^|[,\\{])${key}:`));
    expect(applied).toContain(`${locale}.vendor.test (thêm)`);
  });

  it("vá vendor.test theo kiểu idempotent và không đụng catalog tiếng Trung", () => {
    const once = patchBundle(VENDOR_TEST_FAKE);
    const twice = patchBundle(once.output);
    expect(twice.output).toBe(once.output);
    expect(twice.applied).toEqual([]);
    expect(once.output).toContain('var Zh={settings:{menu:{about:"检查更新"},vendor:{test:{videoTitle:"视频生成测试"}');
  });

  it("báo lỗi thay vì ghép menu locale với một vendor object nằm ngoài catalog đó", () => {
    const source = [
      'var En={settings:{menu:{about:"Check for Updates"}}};',
      'var Unrelated={vendor:{test:"UNRELATED"}};',
      'var Vi={settings:{menu:{about:"Kiểm tra cập nhật"},vendor:{test:"Kiểm tra"}}};',
      'render($t("settings.vendor.test.videoTitle"));',
    ].join("");

    expect(() => patchBundle(source)).toThrow(/settings\.vendor.*en|en.*settings\.vendor/i);
  });

  it("báo lỗi và giữ key upstream lạ thay vì thay toàn bộ test object", () => {
    const source = VENDOR_TEST_FAKE.replace('test:"Test"', 'test:{future:"keep"}');
    expect(() => patchBundle(source)).toThrow(/vendor\.test.*en|en.*vendor\.test/i);
    expect(source).toContain('test:{future:"keep"}');
  });

  it("báo lỗi khi usage anchor settings.vendor.test.* biến mất nhưng catalog cũ vẫn còn", () => {
    const source = VENDOR_TEST_FAKE.replace('render($t("settings.vendor.test.videoTitle"),$t("settings.vendor.test.startTest"));', "");
    expect(() => patchBundle(source)).toThrow(/settings\.vendor\.test/i);
  });

  it.each([
    ['test:"Test"', 'test:"Test"+suffix'],
    ['test:"Test"', 'test:"Test" /* changed shape */ + suffix'],
  ])("báo lỗi khi giá trị legacy chỉ là prefix của biểu thức khác (%s)", (legacy, changed) => {
    const source = VENDOR_TEST_FAKE.replace(legacy, changed);
    expect(() => patchBundle(source)).toThrow(/vendor\.test.*en|en.*vendor\.test/i);
  });
});
