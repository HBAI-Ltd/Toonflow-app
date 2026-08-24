import { canonicalSkillPath } from "@/i18n";

/**
 * Canonical (locale-suffix-stripped) relative paths, from modelPromptRoot, of every prompt file
 * this app ships under data/modelPrompt: the four video-mode originals plus their .en.md/.vi.md
 * translation sidecars. None of these — original or sidecar — may be deleted or silently
 * overwritten through the modelMap admin routes (deletePrompt/savePrompt/updatePrompt), or a
 * fresh install/update would lose content no user ever created.
 *
 * This is a fixed list of canonical filenames, not "everything under video/": a user who later
 * saves their own prompt under video/ (savePrompt writes into the same directory) gets a
 * different canonical name and is therefore never mistaken for a shipped file just because it
 * lives in the same directory. If image/ prompts ship in the future, add their canonical names
 * here too.
 */
const SHIPPED_MODEL_PROMPTS = new Set<string>([
  "video/seedance2Multi-parameterMode.md",
  "video/universalFirstAndLastFrameMode.md",
  "video/universalMulti-parameterMode.md",
  "video/wan2.6Single-imageFirstFrameMode.md",
]);

/** True when `relPath` (relative to modelPromptRoot) is the shipped original or a shipped translation sidecar of one. */
export function isShippedModelPrompt(relPath: string): boolean {
  const normalized = relPath.split("\\").join("/");
  return SHIPPED_MODEL_PROMPTS.has(canonicalSkillPath(normalized));
}
