export type TerrainSurfaceBrush = "grass" | "forest" | "desert" | "gobi" | "ice" | "concrete" | "mud" | "dirt" | "clay" | "sand" | "gravel" | "rock" | "asphalt" | "paving" | "brick" | "snow" | "moss" | "dryGrass" | "humus" | "fallenLeaves" | "pebbles" | "marsh" | "chalk" | "sandstone" | "cobblestone" | "woodPlanks" | "tiles" | "terrazzo" | "rubber" | "rammedEarth" | "saltFlat" | "crackedEarth" | "volcanic" | "ash" | "tundra" | "permafrost" | "mirror" | "mercury" | "energy" | "hologram" | "metalGrid" | "carbonFiber" | "luminousGrid" | "alienSoil" | "armorPlates" | "solarPanels" | "ceramicArmor" | "rustedMetal" | "lavaEnergy" | "obsidianCrystal" | "plasmaFissures" | "alienMycelium" | "nanoHoneycomb" | "dataTraces" | "meteoricIron" | "stardustSand";
export type TerrainSurfaceOption = {
  id: number;
  brush?: TerrainSurfaceBrush;
  name: string;
  group?: "natural" | "built" | "biome" | "scifi";
  color: string;
  roughness: number;
  wetness: number;
  metalness?: number;
  emission?: number;
};

// ACT: 0–6沿用旧存档编号；新材质只追加，不复用森林、水体等已有编号。
export const terrainSurfaceOptions: TerrainSurfaceOption[] = [
  { id: 0, brush: "grass", name: "草地", group: "natural", color: "#98ad7c", roughness: 0.98, wetness: 0.5 },
  { id: 1, name: "山石", color: "#8d9084", roughness: 0.92, wetness: 0.35 },
  { id: 2, name: "水体", color: "#718d86", roughness: 0.22, wetness: 0.3 },
  { id: 3, name: "森林", color: "#687f51", roughness: 1, wetness: 0.6 },
  { id: 4, brush: "desert", name: "沙漠", group: "biome", color: "#d6b777", roughness: 1, wetness: 0.2 },
  { id: 5, brush: "gobi", name: "戈壁", group: "biome", color: "#b5a28b", roughness: 0.98, wetness: 0.35 },
  { id: 6, brush: "ice", name: "冰原", group: "biome", color: "#dcebf0", roughness: 0.28, wetness: 0.25 },
  { id: 7, brush: "concrete", name: "水泥地", group: "built", color: "#a9aba7", roughness: 0.82, wetness: 0.55 },
  { id: 8, brush: "mud", name: "泥地", group: "natural", color: "#625043", roughness: 0.94, wetness: 1 },
  { id: 9, brush: "dirt", name: "土路", group: "natural", color: "#a48561", roughness: 0.98, wetness: 0.65 },
  { id: 10, brush: "clay", name: "红土", group: "natural", color: "#b9714d", roughness: 0.95, wetness: 0.7 },
  { id: 11, brush: "sand", name: "沙地", group: "natural", color: "#dcc89b", roughness: 0.99, wetness: 0.25 },
  { id: 12, brush: "gravel", name: "碎石地", group: "natural", color: "#aaa59a", roughness: 0.98, wetness: 0.35 },
  { id: 13, brush: "rock", name: "岩石地", group: "natural", color: "#858a88", roughness: 0.86, wetness: 0.4 },
  { id: 14, brush: "asphalt", name: "沥青", group: "built", color: "#45494b", roughness: 0.94, wetness: 0.8 },
  { id: 15, brush: "paving", name: "石板", group: "built", color: "#9aa39f", roughness: 0.8, wetness: 0.5 },
  { id: 16, brush: "brick", name: "砖地", group: "built", color: "#aa7258", roughness: 0.9, wetness: 0.55 },
  { id: 17, brush: "snow", name: "雪地", group: "biome", color: "#eff2ed", roughness: 0.9, wetness: 0.1 },
  { id: 18, brush: "moss", name: "苔藓", group: "natural", color: "#657953", roughness: 1, wetness: 0.65 },
  { id: 19, brush: "dryGrass", name: "枯草地", group: "natural", color: "#b8ad76", roughness: 1, wetness: 0.4 },
  { id: 20, brush: "humus", name: "腐殖土", group: "natural", color: "#4c4034", roughness: 0.98, wetness: 0.85 },
  { id: 21, brush: "fallenLeaves", name: "落叶地", group: "natural", color: "#967149", roughness: 0.98, wetness: 0.75 },
  { id: 22, brush: "pebbles", name: "卵石滩", group: "natural", color: "#8e9791", roughness: 0.72, wetness: 0.7 },
  { id: 23, brush: "marsh", name: "沼泽泥地", group: "natural", color: "#465440", roughness: 0.9, wetness: 1 },
  { id: 24, brush: "chalk", name: "白垩地", group: "natural", color: "#d7d4bd", roughness: 0.98, wetness: 0.35 },
  { id: 25, brush: "sandstone", name: "砂岩地", group: "natural", color: "#b39473", roughness: 0.92, wetness: 0.45 },
  { id: 26, brush: "cobblestone", name: "圆石路", group: "built", color: "#8c8e89", roughness: 0.9, wetness: 0.55 },
  { id: 27, brush: "woodPlanks", name: "木栈道", group: "built", color: "#9c7954", roughness: 0.8, wetness: 0.85 },
  { id: 28, brush: "tiles", name: "瓷砖地", group: "built", color: "#c7cbc7", roughness: 0.28, wetness: 0.7 },
  { id: 29, brush: "terrazzo", name: "水磨石", group: "built", color: "#b5b3a8", roughness: 0.4, wetness: 0.65 },
  { id: 30, brush: "rubber", name: "橡胶地", group: "built", color: "#655e5a", roughness: 0.98, wetness: 0.3 },
  { id: 31, brush: "rammedEarth", name: "夯土地", group: "built", color: "#b5966e", roughness: 0.96, wetness: 0.6 },
  { id: 32, brush: "saltFlat", name: "盐碱地", group: "biome", color: "#e0ded0", roughness: 0.94, wetness: 0.25 },
  { id: 33, brush: "crackedEarth", name: "龟裂地", group: "biome", color: "#a99476", roughness: 0.99, wetness: 0.5 },
  { id: 34, brush: "volcanic", name: "火山岩", group: "biome", color: "#4a4a45", roughness: 0.98, wetness: 0.6 },
  { id: 35, brush: "ash", name: "火山灰", group: "biome", color: "#93908a", roughness: 1, wetness: 0.65 },
  { id: 36, brush: "tundra", name: "苔原", group: "biome", color: "#8b8f70", roughness: 0.98, wetness: 0.55 },
  { id: 37, brush: "permafrost", name: "冻土", group: "biome", color: "#a6b4b4", roughness: 0.78, wetness: 0.35 },
  { id: 38, name: "原始地面", color: "#f2f4f8", roughness: 0.95, wetness: 0.15 },
  { id: 39, brush: "mirror", name: "镜面合金", group: "scifi", color: "#cbd7df", roughness: 0.04, wetness: 0.15, metalness: 1 },
  { id: 40, brush: "mercury", name: "液态水银", group: "scifi", color: "#adbccb", roughness: 0.08, wetness: 0.1, metalness: 1 },
  { id: 41, brush: "energy", name: "能量回路", group: "scifi", color: "#46d9ed", roughness: 0.35, wetness: 0.2, metalness: 0.6, emission: 1.5 },
  { id: 42, brush: "hologram", name: "全息网格", group: "scifi", color: "#8cafff", roughness: 0.28, wetness: 0.1, metalness: 0.2, emission: 1.2 },
  { id: 43, brush: "metalGrid", name: "金属格栅", group: "scifi", color: "#7a8991", roughness: 0.5, wetness: 0.55, metalness: 0.9 },
  { id: 44, brush: "carbonFiber", name: "碳纤维", group: "scifi", color: "#343c48", roughness: 0.42, wetness: 0.5, metalness: 0.35 },
  { id: 45, brush: "luminousGrid", name: "荧光晶格", group: "scifi", color: "#98f0c0", roughness: 0.3, wetness: 0.2, metalness: 0.15, emission: 1.8 },
  { id: 46, brush: "alienSoil", name: "异星土壤", group: "scifi", color: "#9d76a8", roughness: 0.94, wetness: 0.65, metalness: 0.1, emission: 0.12 },
  { id: 47, brush: "armorPlates", name: "装甲板", group: "scifi", color: "#6f7c87", roughness: 0.42, wetness: 0.4, metalness: 0.85 },
  { id: 48, brush: "solarPanels", name: "太阳能板", group: "scifi", color: "#345b9c", roughness: 0.18, wetness: 0.2, metalness: 0.7 },
  { id: 49, brush: "ceramicArmor", name: "陶瓷装甲", group: "scifi", color: "#dce0d6", roughness: 0.28, wetness: 0.25, metalness: 0.04 },
  { id: 50, brush: "rustedMetal", name: "锈蚀金属", group: "scifi", color: "#96745c", roughness: 0.84, wetness: 0.7, metalness: 0.45 },
  { id: 51, brush: "lavaEnergy", name: "熔岩能量", group: "scifi", color: "#ff642f", roughness: 0.8, wetness: 0.15, metalness: 0.15, emission: 2.3 },
  { id: 52, brush: "obsidianCrystal", name: "黑曜晶面", group: "scifi", color: "#48415f", roughness: 0.12, wetness: 0.25, metalness: 0.35 },
  { id: 53, brush: "plasmaFissures", name: "等离子裂隙", group: "scifi", color: "#bc78ff", roughness: 0.36, wetness: 0.15, metalness: 0.3, emission: 2.8 },
  { id: 54, brush: "alienMycelium", name: "外星菌毯", group: "scifi", color: "#76b899", roughness: 0.76, wetness: 0.85, metalness: 0.02, emission: 0.35 },
  { id: 55, brush: "nanoHoneycomb", name: "纳米蜂巢", group: "scifi", color: "#4ebcb7", roughness: 0.32, wetness: 0.3, metalness: 0.85, emission: 0.25 },
  { id: 56, brush: "dataTraces", name: "数据光路", group: "scifi", color: "#66c8ff", roughness: 0.4, wetness: 0.2, metalness: 0.65, emission: 1.8 },
  { id: 57, brush: "meteoricIron", name: "陨铁岩", group: "scifi", color: "#686b72", roughness: 0.82, wetness: 0.55, metalness: 0.6 },
  { id: 58, brush: "stardustSand", name: "星尘沙", group: "scifi", color: "#b7a3bc", roughness: 0.91, wetness: 0.3, metalness: 0.15, emission: 0.3 },
];

export const terrainSurfaceMaxId = terrainSurfaceOptions.length - 1;
const surfaceIds = new Map<string, number>(terrainSurfaceOptions.flatMap(surface => surface.brush ? [[surface.brush, surface.id] as const] : []));
surfaceIds.set("forest", 3);

export function getTerrainSurfaceId(brush: string): number | undefined {
  return surfaceIds.get(brush);
}
