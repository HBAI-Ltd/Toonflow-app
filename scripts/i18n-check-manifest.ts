import fs from "fs";
import path from "path";
import crypto from "crypto";
import fg from "fast-glob";

export interface ManifestEntry {
  sourceHash: string;
  translated: string[];
}

export type Manifest = Record<string, ManifestEntry>;

export interface StaleEntry {
  file: string;
  recordedHash: string;
  currentHash: string;
}

export interface CheckResult {
  stale: StaleEntry[];
  missing: string[];
  total: number;
}

export function sha256(content: string): string {
  return crypto.createHash("sha256").update(content, "utf-8").digest("hex");
}

/**
 * Đối chiếu manifest với các bản gốc README.md thực tế trên đĩa (dưới skillsDir).
 * - `stale`: bản gốc đã thay đổi kể từ khi manifest ghi lại sourceHash (bản dịch có thể
 *   đã cũ so với bản gốc mới).
 * - `missing`: có README.md tồn tại nhưng manifest chưa có entry cho nó — không rõ nó đã
 *   được dịch từ trạng thái nào, cần bổ sung vào manifest.
 */
export function checkManifest(skillsDir: string, manifest: Manifest, originalFiles: string[]): CheckResult {
  const stale: StaleEntry[] = [];
  const missing: string[] = [];
  const seen = new Set<string>();

  for (const relFile of originalFiles) {
    const normalized = relFile.split(path.sep).join("/");
    seen.add(normalized);
    const entry = manifest[normalized];
    if (!entry) {
      missing.push(normalized);
      continue;
    }
    const absPath = path.join(skillsDir, relFile);
    const currentHash = sha256(fs.readFileSync(absPath, "utf-8"));
    if (currentHash !== entry.sourceHash) {
      stale.push({ file: normalized, recordedHash: entry.sourceHash, currentHash });
    }
  }

  return { stale, missing, total: Object.keys(manifest).length };
}

const SKILLS_DIR = path.join(__dirname, "..", "data", "skills");
const MANIFEST_PATH = path.join(SKILLS_DIR, ".i18n-manifest.json");

async function main() {
  const manifest: Manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  const originalFiles = (await fg("**/README.md", { cwd: SKILLS_DIR, dot: false })).sort();

  const { stale, missing, total } = checkManifest(SKILLS_DIR, manifest, originalFiles);

  if (stale.length === 0 && missing.length === 0) {
    console.log(`Sạch: tất cả ${total} entry trong manifest đều khớp bản gốc hiện tại.`);
    process.exit(0);
  }

  if (stale.length > 0) {
    console.log(`Có ${stale.length} bản dịch có thể đã lỗi thời (bản gốc đã đổi kể từ lần dịch):`);
    for (const s of stale) {
      console.log(`  ${s.file}`);
      console.log(`    manifest sourceHash: ${s.recordedHash}`);
      console.log(`    hash hiện tại:       ${s.currentHash}`);
    }
  }

  if (missing.length > 0) {
    console.log(`Có ${missing.length} bản gốc chưa có entry trong manifest:`);
    for (const m of missing) console.log(`  ${m}`);
  }

  console.log(`\n(Tổng ${total} entry trong manifest.)`);
  process.exit(1);
}

if (require.main === module) main();
