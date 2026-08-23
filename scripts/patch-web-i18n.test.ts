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

  it("không đụng vào khối menu tiếng Trung khác (about là CJK)", () => {
    const src = 'var Zzz={menu:{about:"關於我們",ui:"其他值"},other:1};';
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

  it("không đụng vào khối menu:{...} không có key about (menu điều hướng)", () => {
    const src = 'var Bbb={menu:{myProject:"My Projects",taskCenter:"Task Center"},other:1};';
    const { output, applied } = patchBundle(src);
    expect(output).toBe(src);
    expect(applied).toEqual([]);
  });
});
