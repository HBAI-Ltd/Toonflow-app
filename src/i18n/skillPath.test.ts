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
