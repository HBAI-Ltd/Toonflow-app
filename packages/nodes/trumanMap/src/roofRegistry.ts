import type { ModelPart } from "./assetModelParts";

// ACT: 屋面与墙体生成函数在这里登记尺寸，建筑生成后由 masterArchitecture/chineseDetailing 统一升级。
// 无运行时导入，避免与 assetModelParts 等基础模块形成循环依赖。

/** tiledRoof 生成的占位屋面（width ≤ depth，脊线沿 z）。 */
export const roofSpecs = new WeakMap<ModelPart, { width: number; depth: number }>();
/** pitchedRoof 生成的挤出双坡屋面；尺寸取自 profile 与 depth，调用方事后改过的坡高也会被读到。 */
export const pitchedRoofs = new WeakSet<ModelPart>();
/** gableCover 生成的左右两块坡板；两块共享同一个 spec 对象。 */
export type SlopeRoofSpec = { width: number; length: number; eave: number; rise: number; centerX: number; centerZ: number; color: string };
export const slopeRoofs = new WeakMap<ModelPart, SlopeRoofSpec>();
/** profileBody 生成的剖面拉伸体（mesh）：profile 为 (x, y) 剖面，沿 z 居中拉伸 depth；屋面类名称的会被识别为单坡/双坡屋面。 */
export const profileBodies = new WeakMap<ModelPart, { profile: [number, number][]; depth: number }>();
/** openingWall 生成的带洞口墙板；holes 为墙局部坐标（x 相对墙中心，y 自墙底）。 */
export type WallSpec = { width: number; height: number; depth: number; holes: [number, number][][] };
export const wallSpecs = new WeakMap<ModelPart, WallSpec>();
/** 墙板被 combineMeshes 合并成整块 mesh 后，原来的洞口信息按世界坐标包围盒保存在合并结果上。 */
export type MergedWall = { spec: WallSpec; min: [number, number, number]; max: [number, number, number]; dirX: [number, number, number] };
export const mergedWalls = new WeakMap<ModelPart, MergedWall[]>();
