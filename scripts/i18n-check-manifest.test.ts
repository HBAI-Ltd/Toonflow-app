import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { checkManifest, sha256, type Manifest } from "./i18n-check-manifest";

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-check-manifest-"));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

function write(relPath: string, content: string) {
  const abs = path.join(dir, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf-8");
}

describe("checkManifest", () => {
  it("báo sạch khi hash khớp và không có bản gốc nào thiếu entry", () => {
    write("skillA/README.md", "nội dung gốc");
    const manifest: Manifest = {
      "skillA/README.md": { sourceHash: sha256("nội dung gốc"), translated: ["en", "vi"] },
    };
    const result = checkManifest(dir, manifest, ["skillA/README.md"]);
    expect(result.stale).toEqual([]);
    expect(result.missing).toEqual([]);
    expect(result.total).toBe(1);
  });

  it("báo lỗi thời khi nội dung gốc đã đổi so với sourceHash đã ghi", () => {
    write("skillA/README.md", "nội dung đã sửa");
    const manifest: Manifest = {
      "skillA/README.md": { sourceHash: sha256("nội dung gốc cũ"), translated: ["en", "vi"] },
    };
    const result = checkManifest(dir, manifest, ["skillA/README.md"]);
    expect(result.stale).toHaveLength(1);
    expect(result.stale[0].file).toBe("skillA/README.md");
    expect(result.missing).toEqual([]);
  });

  it("báo bản gốc thiếu entry trong manifest", () => {
    write("skillB/README.md", "chưa có trong manifest");
    const result = checkManifest(dir, {}, ["skillB/README.md"]);
    expect(result.missing).toEqual(["skillB/README.md"]);
    expect(result.stale).toEqual([]);
  });
});
