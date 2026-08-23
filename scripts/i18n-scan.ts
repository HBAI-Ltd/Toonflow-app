import fs from "fs";
import fg from "fast-glob";

export interface CjkHit {
  file?: string;
  line: number;
  text: string;
}

export interface ScanOptions {
  stripComments: boolean;
}

const CJK = /[一-鿿]+/g;
const IGNORE_PRAGMA = "i18n-ignore";

/** Thay comment bằng khoảng trắng, giữ nguyên độ dài để số dòng không đổi. */
export function stripComments(source: string): string {
  let out = "";
  let i = 0;
  let quote: string | null = null;

  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];

    if (quote) {
      if (c === "\\") { out += source.slice(i, i + 2); i += 2; continue; }
      if (c === quote) quote = null;
      out += c; i++; continue;
    }

    if (c === '"' || c === "'" || c === "`") { quote = c; out += c; i++; continue; }

    if (c === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") { out += " "; i++; }
      continue;
    }

    if (c === "/" && next === "*") {
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) {
        out += source[i] === "\n" ? "\n" : " ";
        i++;
      }
      out += "  "; i += 2; continue;
    }

    out += c; i++;
  }
  return out;
}

interface ScanResult {
  hits: CjkHit[];
  suppressed: number;
}

/**
 * Quét CJK, tách riêng các hit bị pragma i18n-ignore chặn.
 * Pragma luôn được kiểm tra trên dòng RAW (chưa strip comment), vì stripComments
 * xoá chính chữ "i18n-ignore" nếu nó nằm trong comment — kiểm tra trên text đã
 * strip sẽ khiến pragma không bao giờ có tác dụng với comment thật.
 */
function scanLines(source: string, opts: ScanOptions): ScanResult {
  const text = opts.stripComments ? stripComments(source) : source;
  const rawLines = source.split("\n");
  const lines = text.split("\n");
  const hits: CjkHit[] = [];
  let suppressed = 0;

  lines.forEach((line, idx) => {
    const lineHasPragma = rawLines[idx].includes(IGNORE_PRAGMA);
    const prevLineHasPragma = idx > 0 && rawLines[idx - 1].includes(IGNORE_PRAGMA);
    const ignored = lineHasPragma || prevLineHasPragma;

    for (const m of line.matchAll(CJK)) {
      if (ignored) {
        suppressed++;
      } else {
        hits.push({ line: idx + 1, text: m[0] });
      }
    }
  });

  return { hits, suppressed };
}

export function scanText(source: string, opts: ScanOptions): CjkHit[] {
  return scanLines(source, opts).hits;
}

const TARGETS: { glob: string; stripComments: boolean }[] = [
  { glob: "src/**/*.ts", stripComments: true },
  { glob: "data/vendor/*.ts", stripComments: true },
  { glob: "scripts/*.ts", stripComments: true },
  { glob: "README.md", stripComments: false },
  { glob: "docs/README.en.md", stripComments: false },
  { glob: "docs/README.vi.md", stripComments: false },
];

const IGNORE = ["src/i18n/locales/zh.json", "src/lib/vendor.json", "src/router.ts", "**/*.test.ts"];

async function main() {
  let total = 0;
  let totalSuppressed = 0;
  for (const target of TARGETS) {
    const files = await fg(target.glob, { ignore: IGNORE, dot: false });
    for (const file of files) {
      const { hits, suppressed } = scanLines(fs.readFileSync(file, "utf-8"), { stripComments: target.stripComments });
      totalSuppressed += suppressed;
      for (const hit of hits) {
        console.log(`${file}:${hit.line}  ${hit.text}`);
        total++;
      }
    }
  }
  console.log(total === 0 ? "\nSạch: không còn CJK ngoài vùng cho phép." : `\nCòn ${total} chuỗi CJK.`);
  console.log(`Đã bỏ qua ${totalSuppressed} chuỗi có pragma i18n-ignore.`);
  process.exit(total === 0 ? 0 : 1);
}

if (require.main === module) main();
