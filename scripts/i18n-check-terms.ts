/**
 * i18n:check-terms — verifies docs/i18n/prompt-terms.json against the tree.
 *
 * The registry is the machine-matched contract between the two layers of the AI pipeline:
 *   emitter  — data/skills/**            (writes the pipe/顿号-delimited `videoDesc`)
 *   parser   — data/modelPrompt/video/** + src/lib/prompts/videoPromptGeneration.ts
 * plus the runtime labels src/i18n/locales/*.json prepends to the parser's input.
 *
 * Run `tsx scripts/i18n-check-terms.ts --update` to recompute the recorded counts after an
 * intentional change; run it with no flags (the default `yarn i18n:check-terms`) to verify.
 *
 * What it CANNOT detect is documented in `LIMITS` below and printed with `--limits`.
 */
import fs from "node:fs";
import path from "node:path";
import { videoPromptGeneration } from "../src/lib/prompts/videoPromptGeneration";
import { resolveSeedText } from "../src/lib/prompts/types";
import type { Locale } from "../src/i18n/types";

export const REGISTRY_PATH = "docs/i18n/prompt-terms.json";
const GLOSSARY_PATH = "docs/i18n/glossary.json";

export const LIMITS = [
  "Counts are raw substring counts. A term that is also ordinary prose (场景, 情绪, 特写, 固定) is over-counted, and no count here proves the occurrence was the matched token.", // i18n-ignore — Chinese examples naming the very tokens this checker guards
  "It cannot tell a matched token from its homograph. 已完成 is a frozen state value in src/** and ordinary prose in data/skills/**; the checker sees one string.", // i18n-ignore — Chinese examples naming the very tokens this checker guards
  "It only reads the four data/modelPrompt/video zh files and the three locale strings of videoPromptGeneration.ts. Skill-manual sidecars (data/skills/**/README.{en,vi}.md) are NOT compared, so a boundary token translated away inside a skill sidecar goes unseen.",
  "It cannot find a boundary term that is missing from the registry. Nothing derives the term set; a new field added to videoDesc upstream will not be noticed until someone adds it here.",
  "The label and literal checks compare counts over the whole prompt layer joined together, not file by file. Losing a term in one file while another file gains an occurrence of it nets out to zero and passes.",
  "The label check is a case-insensitive substring count. It proves the registry's en/vi form occurs often enough, not that it occurs in the right place or that no second rendering also occurs alongside it.",
  "It says nothing about whether the two layers agree semantically — e.g. it does not notice that the skills emit 运镜 values (推/拉/摇/移/俯拍/仰拍) that no mapping table in the prompt layer lists.", // i18n-ignore — Chinese examples naming the very tokens this checker guards
];

type Counts = Record<string, number>;
type Term = {
  id: string;
  kind: string;
  zh: string;
  en: string;
  vi: string;
  policy: string;
  boundary: string;
  counts: Counts;
  literalCounts: { zh: number; en: number; vi: number };
  /** Occurrences of the en / vi form itself in the translated prompt files. Only for translated policies. */
  labelCounts?: { en: number; vi: number };
  note: string;
  catalogKey?: string;
  glossaryDivergence?: string;
};
type Registry = { terms: Term[]; policies: Record<string, string>; boundaries: Record<string, string> };

const walk = (dir: string, out: string[] = []): string[] => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    entry.isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
};
const isSidecar = (f: string) => /\.(en|vi)\.(md|json)$/.test(f);
const joinFiles = (files: string[]) => files.map((f) => fs.readFileSync(f, "utf8")).join("\n");
const occurrences = (needle: string, haystack: string) => (needle ? haystack.split(needle).length - 1 : 0);
/** The videoPromptGeneration seed prompt in one locale; it is the code half of the prompt layer. */
const seed = (locale: Locale) => resolveSeedText(videoPromptGeneration, locale);

/** The five text corpora the registry records counts against. */
export function buildLayers(root: string): Record<string, string> {
  const modelPromptDir = path.join(root, "data/modelPrompt/video");
  return {
    skills: joinFiles(walk(path.join(root, "data/skills")).filter((f) => f.endsWith(".md") && !isSidecar(f))),
    modelPrompt: joinFiles(walk(modelPromptDir).filter((f) => f.endsWith(".md") && !isSidecar(f))),
    srcPrompt: seed("zh"),
    catalog: fs.readFileSync(path.join(root, "src/i18n/locales/zh.json"), "utf8"),
    srcCode: joinFiles(
      walk(path.join(root, "src")).filter(
        (f) =>
          f.endsWith(".ts") &&
          !f.includes(`${path.sep}i18n${path.sep}locales${path.sep}`) &&
          !f.endsWith("promptSeedSync.ts") &&
          !f.endsWith("videoPromptGeneration.ts"),
      ),
    ),
  };
}

/** The prompt layer in all three locales, for the literal-preservation and label checks. */
export function buildTriple(root: string): { zh: string; en: string; vi: string } {
  const dir = path.join(root, "data/modelPrompt/video");
  const originals = fs.readdirSync(dir).filter((f) => f.endsWith(".md") && !isSidecar(f));
  const side = (locale: "en" | "vi") =>
    joinFiles(originals.map((f) => path.join(dir, f.replace(/\.md$/, `.${locale}.md`))));
  return {
    zh: `${joinFiles(originals.map((f) => path.join(dir, f)))}\n${seed("zh")}`,
    en: `${side("en")}\n${seed("en")}`,
    vi: `${side("vi")}\n${seed("vi")}`,
  };
}

/** Minimum evidence each boundary kind requires; a term failing this is no longer where the registry says it is. */
const PRESENCE: Record<string, (c: Counts) => boolean> = {
  "skills->prompts": (c) => c.skills > 0 && c.modelPrompt + c.srcPrompt > 0,
  "prompts->model": (c) => c.modelPrompt + c.srcPrompt > 0,
  "catalog->prompts": (c) => c.catalog > 0 && c.modelPrompt + c.srcPrompt > 0,
  "skills-internal": (c) => c.skills > 0,
  "persisted-enum": (c) => c.srcCode > 0,
  "schema-enum": (c) => c.srcCode > 0,
  "model-identifier": (c) => c.modelPrompt + c.srcPrompt > 0,
  "reference-syntax": (c) => c.skills + c.modelPrompt + c.srcPrompt > 0,
  "field-key": (c) => c.skills + c.modelPrompt + c.srcPrompt > 0,
  "tool-name": (c) => c.skills > 0,
};

export type Problem = { term: string; check: string; detail: string };
export type Context = {
  layers: Record<string, string>;
  triple: { zh: string; en: string; vi: string };
  glossary: Record<string, { en: string; vi: string }>;
  catalogs: { zh: Record<string, string>; en: Record<string, string>; vi: Record<string, string> };
};

export function loadContext(root: string): Context {
  const layers = buildLayers(root);
  return {
    layers,
    triple: buildTriple(root),
    glossary: JSON.parse(fs.readFileSync(path.join(root, GLOSSARY_PATH), "utf8")),
    catalogs: {
      zh: JSON.parse(layers.catalog),
      en: JSON.parse(fs.readFileSync(path.join(root, "src/i18n/locales/en.json"), "utf8")),
      vi: JSON.parse(fs.readFileSync(path.join(root, "src/i18n/locales/vi.json"), "utf8")),
    },
  };
}

export function checkRegistry(registry: Registry, ctx: Context): Problem[] {
  const problems: Problem[] = [];
  const fail = (term: string, check: string, detail: string) => problems.push({ term, check, detail });
  const { layers, triple, glossary, catalogs } = ctx;

  const seen = new Set<string>();
  for (const term of registry.terms) {
    // C1 — shape.
    if (seen.has(term.id)) fail(term.id, "shape", "duplicate id");
    seen.add(term.id);
    for (const field of ["kind", "zh", "en", "vi", "policy", "boundary", "note"] as const) {
      if (!term[field]) fail(term.id, "shape", `missing or empty field \`${field}\``);
    }
    if (!registry.policies[term.policy]) fail(term.id, "shape", `unknown policy \`${term.policy}\``);
    if (!registry.boundaries[term.boundary]) fail(term.id, "shape", `unknown boundary \`${term.boundary}\``);
    if (term.policy === "never-translate" && (term.en !== term.zh || term.vi !== term.zh)) {
      fail(term.id, "shape", "policy never-translate requires en === vi === zh");
    }
    if (term.policy === "translate-in-lockstep" && !term.catalogKey) {
      fail(term.id, "shape", "policy translate-in-lockstep requires a catalogKey");
    }
    if (!term.zh) continue;

    // C2 — the zh form is still where the registry says it is.
    const counts: Counts = {};
    for (const [name, text] of Object.entries(layers)) counts[name] = occurrences(term.zh, text);
    const presence = PRESENCE[term.boundary];
    if (presence && !presence(counts)) {
      fail(
        term.id,
        "presence",
        `\`${term.zh}\` no longer satisfies boundary \`${term.boundary}\` — counts ${JSON.stringify(counts)}`,
      );
    }

    // C3 — a token that survived translation before must still survive it.
    const recorded = term.literalCounts;
    if (recorded && recorded.zh > 0) {
      for (const locale of ["en", "vi"] as const) {
        const now = occurrences(term.zh, triple[locale]);
        if (now < recorded[locale]) {
          fail(
            term.id,
            "literal-preservation",
            `\`${term.zh}\` occurs ${now}× in the ${locale} prompt files, was ${recorded[locale]}× — a matched token was translated away`,
          );
        }
      }
    }

    // C4 — the translated form the registry lists is the one actually in the tree.
    if (term.policy === "translate-label") {
      for (const locale of ["en", "vi"] as const) {
        const now = occurrences(term[locale].toLowerCase(), triple[locale].toLowerCase());
        const want = Math.max(1, term.labelCounts?.[locale] ?? 1);
        if (now < want) {
          fail(
            term.id,
            "label",
            `the ${locale} form "${term[locale]}" occurs ${now}× in the ${locale} prompt files, expected at least ${want}× — the tree uses a form the registry does not list`,
          );
        }
      }
    }

    // C5 — runtime label and prompt spec move together.
    if (term.policy === "translate-in-lockstep" && term.catalogKey) {
      for (const locale of ["zh", "en", "vi"] as const) {
        const value = catalogs[locale][term.catalogKey];
        const want = locale === "zh" ? term.zh : term[locale];
        if (value === undefined) {
          fail(term.id, "lockstep", `catalog key \`${term.catalogKey}\` missing from ${locale}.json`);
        } else if (!value.toLowerCase().includes(want.toLowerCase())) {
          fail(term.id, "lockstep", `${locale}.json[${term.catalogKey}] = ${JSON.stringify(value)} does not contain "${want}"`);
        }
        if (!triple[locale].toLowerCase().includes(want.toLowerCase())) {
          fail(term.id, "lockstep", `the ${locale} prompt files never mention "${want}" — spec and runtime label have drifted apart`);
        }
      }
    }

    // C6 — no silent contradiction with the prose glossary.
    const g = glossary[term.zh];
    if (g) {
      const agrees = g.en.toLowerCase() === term.en.toLowerCase() && g.vi.toLowerCase() === term.vi.toLowerCase();
      if (!agrees && !term.glossaryDivergence) {
        fail(
          term.id,
          "glossary",
          `contradicts ${GLOSSARY_PATH} (glossary: ${g.en} / ${g.vi}; registry: ${term.en} / ${term.vi}) without a glossaryDivergence note`,
        );
      }
      if (agrees && term.glossaryDivergence) {
        fail(term.id, "glossary", "declares a glossaryDivergence but now agrees with the glossary — drop the note");
      }
    }
  }
  return problems;
}

export function updateCounts(registry: Registry, ctx: Context): Registry {
  const { layers, triple } = ctx;
  for (const term of registry.terms) {
    const counts: Counts = {};
    for (const [name, text] of Object.entries(layers)) counts[name] = occurrences(term.zh, text);
    term.counts = counts;
    term.literalCounts = {
      zh: occurrences(term.zh, triple.zh),
      en: occurrences(term.zh, triple.en),
      vi: occurrences(term.zh, triple.vi),
    };
    if (term.policy === "translate-label") {
      term.labelCounts = {
        en: occurrences(term.en.toLowerCase(), triple.en.toLowerCase()),
        vi: occurrences(term.vi.toLowerCase(), triple.vi.toLowerCase()),
      };
    } else {
      delete term.labelCounts;
    }
  }
  return registry;
}

function main(): void {
  const root = process.cwd();
  const registryFile = path.join(root, REGISTRY_PATH);
  const registry: Registry = JSON.parse(fs.readFileSync(registryFile, "utf8"));

  if (process.argv.includes("--limits")) {
    console.log("i18n:check-terms cannot detect:");
    for (const l of LIMITS) console.log(`  - ${l}`);
    return;
  }
  if (process.argv.includes("--update")) {
    fs.writeFileSync(registryFile, `${JSON.stringify(updateCounts(registry, loadContext(root)), null, 2)}\n`);
    console.log(`[i18n:check-terms] counts refreshed for ${registry.terms.length} terms in ${REGISTRY_PATH}`);
    return;
  }

  const problems = checkRegistry(registry, loadContext(root));
  if (problems.length === 0) {
    console.log(`[i18n:check-terms] OK — ${registry.terms.length} terms in ${REGISTRY_PATH} agree with the tree.`);
    console.log("[i18n:check-terms] This check is narrow. What it cannot detect:");
    for (const l of LIMITS) console.log(`  - ${l}`);
    return;
  }
  console.error(`[i18n:check-terms] FAILED — ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  ✗ [${p.check}] ${p.term}: ${p.detail}`);
  console.error("\nFix the tree, or update docs/i18n/prompt-terms.json deliberately and rerun with --update.");
  process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith(path.join("scripts", "i18n-check-terms.ts"))) {
  main();
}
