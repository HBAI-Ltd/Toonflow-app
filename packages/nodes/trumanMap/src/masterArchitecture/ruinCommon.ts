import type { ModelPart } from "../assetModelParts";
import type { AssetState, AssetTheme } from "../sceneDocument";
import { design, type ArchitecturePrototype } from "./structures";
import { ruinHouse, type HouseCfg, type HouseCtx } from "./ruinHouse";
import { mergeMeshes, Rng, ruinBuilder, type Pal, type RuinBuilder } from "./ruinKit";

// 破败建筑各批共用：素材登记、配色、把合成的房子和零散构件拼在一起的小工具。
/** 破败建筑登记为 raw（自带全部细节，不再走通用屋面墙面细化），并按破败程度标老旧、破损或废弃。 */
export const ruin = (name: string, purpose: string, theme: AssetTheme, state: AssetState, build: () => ModelPart[], tags: string[] = []): ArchitecturePrototype => ({ ...design(name, purpose, build, "建筑", theme), raw: true, state, tags: ["废墟", "破败", "残破", "荒废", "破屋", "影视外景", state, ...tags] });

/** 一座配置出来的破败房子，extra 在其上再叠自己的特殊构件。 */
export const house = (cfg: HouseCfg, extra?: (b: RuinBuilder, rng: Rng, ctx: HouseCtx) => void) => () => ruinHouse(cfg, extra);

/** 单独造一批零散构件（院墙、台阶、碑、树）。 */
export function scene(seed: string, pal: Pal, fn: (b: RuinBuilder, rng: Rng) => void): ModelPart[] {
  const b = ruinBuilder(pal), rng = new Rng(seed);
  fn(b, rng);
  return b.parts();
}
/** 把零散构件并进已造好的房子部件，同名同色的 mesh 合并，控制部件总数。 */
export const withProps = (base: ModelPart[], pal: Pal, seed: string, fn: (b: RuinBuilder, rng: Rng) => void) => mergeMeshes([...base, ...scene(seed, pal, fn)]);

export const CN: Pal = { wall: "#b5a88f", brick: "#8a6a56", stone: "#8f8c82", wood: "#6b5340", woodD: "#2d2823", tile: "#5c615e", thatch: "#a38b5a", metal: "#6f6e68" };
export const CN_RED: Pal = { ...CN, wall: "#9c5a47", brick: "#7a4a3c" };
export const LOESS: Pal = { ...CN, wall: "#b89a6a", brick: "#9a7a52", stone: "#a09070", tile: "#6a6258" };
export const BRICK: Pal = { wall: "#a3705f", brick: "#7e4a3b", stone: "#8a867c", wood: "#5c4a3a", woodD: "#2b2622", tile: "#55595a", thatch: "#a38b5a", metal: "#706c66" };
export const PLASTER: Pal = { wall: "#c9bda3", brick: "#9a6a52", stone: "#9a968a", wood: "#5c4a3a", woodD: "#2b2622", tile: "#6a4f45", thatch: "#a38b5a", metal: "#706c66" };
export const CONCRETE: Pal = { wall: "#b8b7ae", brick: "#8d8b82", stone: "#9a9890", wood: "#6a5a48", woodD: "#2d2926", tile: "#5b6062", thatch: "#a38b5a", metal: "#767b7f" };
export const EURO: Pal = { wall: "#a9a79d", brick: "#7d7568", stone: "#8f8d85", wood: "#5a4a3a", woodD: "#262320", tile: "#4e5456", thatch: "#a38b5a", metal: "#6f726f" };
export const WASTE: Pal = { wall: "#a89a82", brick: "#7a5d48", stone: "#8c8574", wood: "#5f4d3a", woodD: "#2a2521", tile: "#6a6055", thatch: "#a38b5a", metal: "#7d7468" };
export const SAND: Pal = { wall: "#c9ad7a", brick: "#a8854f", stone: "#b09a70", wood: "#6f5a40", woodD: "#2f2822", tile: "#8a7a5c", thatch: "#b09a68", metal: "#8a7a62" };

/** 影视置景素材（内景三壁布景、背撑立面）：自带全部细节，状态按脏旧程度标；标签是“置景”而不是“废墟”。 */
export const film = (name: string, purpose: string, theme: AssetTheme, state: AssetState, build: () => ModelPart[], tags: string[] = []): ArchitecturePrototype => ({ ...design(name, purpose, build, "建筑", theme), raw: true, state, tags: ["影视置景", "置景", "布景", state, ...tags] });
