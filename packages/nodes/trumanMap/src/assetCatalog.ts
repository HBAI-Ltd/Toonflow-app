import { sourceAssets, sourceAssetsById } from "./assetCatalogSources";
import { getAssetItemType } from "./assetMetadata";
import { assetStates, type AssetCategory, type AssetItemType, type AssetState, type AssetTheme, type SceneAsset } from "./sceneDocument";
import { localAssets, getLocalAssetDerivatives } from "./localAssetCatalog";

const stateSuffixes: Record<AssetState, string> = { 原始: "", 老旧: "Aged", 破损: "Damaged", 废弃: "Abandoned" };

const registered = Array.from({ length: Math.max(sourceAssets.length, localAssets.length) }, (_, index) => [sourceAssets[index], localAssets[index]].filter((asset): asset is SceneAsset => !!asset)).flat();
if (new Set(registered.map(asset => asset.id)).size !== registered.length) throw new Error("内置主素材 ID 重复");
export const catalogAssets: SceneAsset[] = [];
const namedParents = new Map<string, SceneAsset>();
const duplicateAssets = new Map<string, SceneAsset[]>();
const parentIds = new Map<string, string>();
const searchAliases = new Map<string, string>();
const themeAliases = new Map<string, Set<AssetTheme>>();
const itemTypeAliases = new Map<string, Set<AssetItemType>>();
const categoryAliases = new Map<string, Set<AssetCategory>>();
const commonSearchNames: [RegExp, string][] = [
  [/椅(?:[\s·（(]|$)/, "椅子"], [/(?:桌|茶几|琴案|书案|案几)(?:[\s·（(]|$)/, "桌子"],
  [/[柜橱](?:[\s·（(]|$)/, "柜子"], [/凳(?:[\s·（(]|$)/, "凳子"],
  [/杯(?:[\s·（(]|$)/, "杯子"], [/瓶(?:[\s·（(]|$)/, "瓶子"],
  [/盆(?:[\s·（(]|$)/, "盆子"], [/自行车|协力脚踏车/, "单车"],
  [/篷顶人力车/, "黄包车 手拉人力车"], [/古典马车车厢/, "驿站马车 四轮载客马车"],
  [/茶楼|茶肆/, "茶馆"], [/酒肆/, "酒楼 酒馆"], [/铁匠铺/, "打铁铺"],
  [/县衙|衙署/, "衙门"], [/民宅|土坯宅|土坯排房|窄宅/, "普通民居 民居"], [/常平仓/, "官仓 粮仓"],
  [/军机值所/, "军机处"], [/御药炮制/, "御药房 太医院"], [/帐幕.*整营/, "军营 兵营"],
  [/公主别院/, "公主府 绣楼"], [/相府议客/, "宰相府"], [/分监大牢/, "监牢 监狱"], [/悬闸跨渠/, "水门 闸楼"],
  [/胡姬馆/, "胡姬酒肆 宴饮"], [/驻驼.*胡商院/, "商队货院 胡商货院"], [/礼宾.*译馆/, "使节馆 外交驿馆"],
  [/燧堡戍屋/, "烽火台 烽燧"], [/跨壕落桥/, "吊桥 城壕"], [/马面敌台/, "敌楼 城防"],
  [/髹漆作坊/, "漆器坊 漆器作坊 推光漆坊"], [/煎卤盐坊/, "盐场 煮盐坊"], [/多碓.*谷粮房/, "碓房 水碓 舂米坊"],
  [/(?:^|\s)手持钻(?:\s|$)/, "电钻 手电钻"],
  [/书写桌(?:[\s·（(]|$)/, "书桌 写字桌"], [/餐台(?:[\s·（(]|$)/, "餐桌 饭桌"],
  [/打印设备(?:[\s·（(]|$)/, "打印机"], [/扫描设备(?:[\s·（(]|$)/, "扫描仪 扫描机"],
  [/横轴翻面移动书写板/, "白板 移动白板"], [/临时安全警示围带架/, "排队栏柱 伸缩隔离带栏柱"],
  [/^(?!.*(?:马车|马拉|骡马|畜力|人力)).*(?:轿车|跑车|房车|皮卡|卡车|公交车|消防救援车|厢式配送车|平台货车|清障车|面包车|面包客车)/, "汽车"],
  [/神像|佛像|菩萨像|罗汉像|泥塑|金身坐像|无常泥塑|阎罗王|钟馗|夜叉/, "神像 佛像 雕塑 雕像 塑像 神佛"], [/纸扎/, "纸人 纸扎 冥器 祭品 白事"], [/寿棺/, "棺材 灵柩 丧葬"], [/遗像供桌|招魂白幡/, "灵堂 丧葬 白事 灵异"], [/法坛/, "道士 做法 法事 灵异 符咒"],
  [/神龛|牌位架/, "祠堂 宗祠 供奉 祭祖 牌位"], [/稻草人/, "田野 乡村 诡异"], [/石狮子|镇墓兽|翁仲/, "石像 石雕 守护兽 镇墓"], [/门神/, "门板 秦琼 尉迟恭 年画"],
];
// 语义相同的旧原型也归入同一父项；换名称、涂装或扩展同一工作机构不增加主素材数量。
const equivalentNames = new Map([
  ["厢式配送货车", "厢式配送车"], ["城市出租车", "城市四门轿车"],
  ["四门五座独立后备厢家用轿车", "城市四门轿车"],
  ["四旋翼配送无人机", "货运无人机"], ["多旋翼货机", "货运无人机"],
  ["举高云梯消防车", "消防救援车"],
  ["非洲猴面包树", "猴面包树"],
  ["海岛椰子树", "椰子树"], ["旱地龙舌兰", "龙舌兰"], ["草原金合欢树", "伞金合欢"],
  ["海枣", "绿洲枣椰树"],
  ["樱桃树", "庭院樱花树"],
  ["高粱植株", "高粱穗"], ["鸿雁", "鹅"],
  ["红叶枫树", "枫树"], ["庭院老松", "松树"], ["黑松盆栽", "松树"], ["盆栽龟背竹", "龟背竹"],
  ["庭院竹丛", "竹子"], ["池塘荷叶", "荷叶"],
  ["沙漠柱状仙人掌", "巨人柱仙人掌"], ["耐旱仙人掌", "巨人柱仙人掌"], ["烛柱仙人掌", "巨人柱仙人掌"],
  ["桶形仙人掌", "金琥"], ["掌片仙人掌", "掌状仙人掌"],
  ["扇枝珊瑚", "海扇"], ["桌形珊瑚", "桌面珊瑚"], ["脑纹珊瑚", "脑珊瑚"],
  ["巨型林地蘑菇", "伞菌"], ["灵光蕨丛", "凤尾蕨"],
  ["离心重力睡眠环站", "旋转环形太空栖居舱"],
  ["转轮活字排字盘", "活字排字盘"], ["机车地坑旋转转盘", "机车回转转车台"],
  ["机场可伸缩旋转登机桥", "机场伸缩登机廊桥"], ["中央墩水平回转桥", "中心平转铁路桥"],
  ["双塔配重竖升桥", "垂直升降航道桥"], ["高架悬篮运输桥", "高架吊运渡桥"],
  ["轴销配重仰开桥", "双叶开启公路桥"],
  ["双握环鞍马训练台", "体操鞍马"], ["弹性助跑跳马台", "体操跳马台"],
  ["卧式主轴通用车床", "车削机床"], ["配重式投石机", "投石机"], ["多层攻城塔车", "攻城塔"],
  ["机械差速器示教台", "锥齿差速器"], ["锥齿开放差速器", "锥齿差速器"],
  ["行星齿轮演示器", "行星齿轮机构"], ["行星齿轮分流传动架", "行星齿轮机构"],
  ["往复式黄油搅打桶", "木桶奶油搅乳器"],
  ["竹帘卷寿司器", "寿司卷帘"], ["阀顶负压拔罐", "手动拔罐抽气器"],
  ["披萨烤炉", "穹顶蓄热烤炉"], ["村落共用烤面包炉", "穹顶蓄热烤炉"],
  ["铜架沙漏", "沙漏"], ["沙漏计时器", "沙漏"], ["黄铜机械打字机", "机械打字机"],
  ["五轮升降办公椅", "五星脚办公转椅"], ["木制衣帽架", "衣帽架"], ["落地衣帽挂架", "衣帽架"],
  ["四杆缩放描图仪", "平行四杆仿形架"], ["平行四边形比例仿形架", "平行四杆仿形架"],
  ["古典庭园日晷", "日晷"], ["便携折叠日晷", "日晷"], ["手摇石磨轮", "手摇磨刀砂轮"],
  ["热气转影灯亭", "热流走马灯"], ["磨削机", "直轴端面磨削机"],
  ["颈腔共鸣吸声单元墙", "赫尔姆霍兹共鸣球架"],
  ["回旋电子微波振荡管", "回旋电子微波振荡器"],
  ["对置声阵无容器装配台", "声波悬浮珠链操纵台"],
  ["农用牵引车", "农业拖拉机"], ["后大轮农业牵引拖拉机", "农业拖拉机"],
  ["深潜器", "有人潜水器"], ["玻璃舷窗观光潜艇", "有人潜水器"],
  ["海岛竹藤吊床", "吊床"], ["野营吊床", "吊床"], ["双端悬吊布床", "吊床"],
  ["村落饮畜石槽", "牲畜饮水槽"], ["浮阀自补牲畜饮水槽", "牲畜饮水槽"],
  ["声学探空反射墙", "聚焦声镜"], ["双镜抛物传声站", "聚焦声镜"],
  ["旋转填料超重力接触器", "旋转填充床反应器"],
  ["穿斗通柱承重榀架", "穿斗式木构排架"], ["双螺旋交错礼梯", "螺旋疏散楼梯"],
  ["楔钉锁固贯通榫节点", "透榫穿梁木柱节点"],
  ["多腔直线束速调管", "速调管微波功率放大柱"], ["低温共振质量引力探测架", "低温谐振杆引力信号舱"],
  ["单线岩壁叠瀑", "岩壁叠瀑"], ["双线岩壁叠瀑", "岩壁叠瀑"], ["三线岩壁叠瀑", "岩壁叠瀑"],
  ["挂珠燃香时计", "悬重燃香报时器"], ["悬重燃绳报时台", "悬重燃香报时器"],
  ["手摇孔盘警笛", "手摇机械警报器"],
  ["收屑烛花剪", "集屑剪烛器"],
  ["压缩活塞生火器", "压缩点火活塞"], ["长腔线性切割吻合器", "内镜线形切割吻合器"],
  ["指节动态伸展支具", "分指动态手功能矫形器"], ["交错叠木抽块塔", "抽块叠叠塔"],
  ["壁挂抽拉晾衣绳盒", "壁挂卷轴衣绳"], ["机械支票防改写压印机", "支票压印机"],
  ["浮水救援抛绳袋", "救生绳袋"],
  ["双齿木底人字带木屐", "一双木屐"],
  ["鼓肚柜体落板写字柜", "翻门承托秘书书写柜"], ["交叠曲肋萨沃纳罗拉椅", "交错弧肋折叠椅"],
  ["菌褶环廊蘑菇旅舍", "蘑菇小屋"],
  ["桌面绳驱夹爪抓取玩具台", "夹爪取物机"],
  ["龙池凤沼七弦古琴", "七弦古琴"],
  ["带贯通柄孔的双角lucet编绳叉", "双叉编绳器"],
  ["折脚反光三角警示架", "折叠安全警示三角架"],
  ["长杆夹持挂毯陈列架", "波斯织毯挂架"],
  ["棒球自动发球机", "双轮棒球投球机"],
  ["悬臂电磁封盖输送机", "瓶口铝箔感应封口桥"],
  ["独立数字落水幕墙装置", "数字阀列雨滴显示幕"],
  ["高踏池低收槽长梁酿酒坊", "葡萄踏汁池房"],
  ["北窗锯齿三跨织布厂", "双跨北光加工车间"],
  ["凹门低翼灯笼顶拳击健身会馆", "前庭双侧配套街区照相馆"],
  ["田头收货分级装车厅", "前厅侧卸双坡物流库"],
  ["静音柴油发电机", "内燃机发电机组"], ["柴油发电机", "内燃机发电机组"], ["发电机组", "内燃机发电机组"],
]);
const canonicalAssets = new Map<string, SceneAsset>();
for (const asset of registered) {
  const name = asset.name.normalize("NFKC").trim().toLocaleLowerCase();
  if (!canonicalAssets.has(name)) canonicalAssets.set(name, asset);
}
for (const asset of registered) {
  const name = asset.name.normalize("NFKC").trim().toLocaleLowerCase();
  const key = equivalentNames.get(name) ?? name;
  // 显式归父采用目标原名的编号，避免交错登记时先遇到别名而换掉原父项。
  const canonical = canonicalAssets.get(key);
  if (!namedParents.has(key) && canonical && canonical.id !== asset.id) {
    namedParents.set(key, canonical); catalogAssets.push(canonical);
  }
  const parent = namedParents.get(key);
  if (parent?.id === asset.id) continue;
  if (parent) {
    const values = duplicateAssets.get(parent.id) ?? []; values.push(asset); duplicateAssets.set(parent.id, values); parentIds.set(asset.id, parent.id);
    searchAliases.set(parent.id, `${searchAliases.get(parent.id) ?? ""} ${asset.name !== parent.name ? asset.name : ""} ${asset.id}`);
    if (asset.theme && asset.theme !== parent.theme) { const themes = themeAliases.get(parent.id) ?? new Set<AssetTheme>(); themes.add(asset.theme); themeAliases.set(parent.id, themes); }
    const itemType = getAssetItemType(asset);
    if (itemType !== getAssetItemType(parent)) { const types = itemTypeAliases.get(parent.id) ?? new Set<AssetItemType>(); types.add(itemType); itemTypeAliases.set(parent.id, types); }
    if (asset.category !== parent.category) { const categories = categoryAliases.get(parent.id) ?? new Set<AssetCategory>(); categories.add(asset.category); categoryAliases.set(parent.id, categories); }
  } else {
    const main = key === name ? asset : { ...asset, name: key };
    if (main.name !== asset.name) searchAliases.set(main.id, asset.name);
    namedParents.set(key, main); catalogAssets.push(main);
  }
}
canonicalAssets.clear();
const derivatives = new Map<string, SceneAsset[]>();

// ACT: 口语里的年代、风格词对到题材名：古代/古装/武侠→中式，西式→欧式，未来→科幻……（界面素材库和Agent检索共用）。
const searchSynonyms: [RegExp, string][] = [
  [/^(古代|古装|古风|武侠|仙侠|中国|中国风|古典|宫廷)$/, "中式"], [/^(西式|欧洲|西方|西洋)$/, "欧式"], [/^(日本|和风)$/, "日式"],
  [/^(未来|太空|星际)$/, "科幻"], [/^(末日|末世|废墟)$/, "废土"], [/^(魔幻|魔法|神话)$/, "奇幻"], [/^(都市|当代|城市)$/, "现代"],
];
/** 搜索词是否命中：原词命中，或它对应的题材名命中。text 用 getAssetSearchText 的结果。 */
export function matchesSearchToken(text: string, token: string) {
  if (text.includes(token)) return true;
  const alias = searchSynonyms.find(([pattern]) => pattern.test(token))?.[1];
  return !!alias && text.includes(alias.toLocaleLowerCase());
}

export function getAssetSearchText(asset: SceneAsset, includeAliases = true) {
  const aliases = includeAliases ? searchAliases.get(asset.id) ?? "" : "";
  const names = `${asset.name} ${aliases}`;
  const common = commonSearchNames.filter(([pattern]) => pattern.test(names)).map(([, value]) => value).join(" ");
  const familyMetadata = includeAliases ? [...(themeAliases.get(asset.id) ?? []), ...(itemTypeAliases.get(asset.id) ?? []), ...(categoryAliases.get(asset.id) ?? [])].join(" ") : "";
  return `${asset.name} ${asset.id} ${asset.category} ${asset.theme ?? ""} ${getAssetItemType(asset)} ${(asset.tags ?? []).join(" ")} ${aliases} ${familyMetadata} ${common}`.toLocaleLowerCase();
}

export function matchesAssetTheme(asset: SceneAsset, theme: AssetTheme) { return asset.theme === theme || !!themeAliases.get(asset.id)?.has(theme); }
export function matchesAssetFilters(asset: SceneAsset, filters: { category?: AssetCategory; theme?: AssetTheme | ""; itemType?: AssetItemType | "" }) {
  const matches = (candidate: SceneAsset) => (!filters.category || filters.category === "全部" || candidate.category === filters.category) && (!filters.theme || candidate.theme === filters.theme) && (!filters.itemType || getAssetItemType(candidate) === filters.itemType);
  if (matches(asset) || getLocalAssetDerivatives(asset).some(matches)) return true;
  return (duplicateAssets.get(asset.id) ?? []).some(candidate => matches(candidate) || getLocalAssetDerivatives(candidate).some(matches));
}

export function getAssetDerivatives(main: SceneAsset): SceneAsset[] {
  if (isCatalogDerivative(main)) return [];
  const extra = (duplicateAssets.get(main.id) ?? []).flatMap(asset => [asset, ...getOwnDerivatives(asset)].map(child => ({ ...child, variantOf: main.id })));
  return [...getOwnDerivatives(main), ...extra];
}

export function hasAssetDerivatives(main: SceneAsset) {
  return !isCatalogDerivative(main) && (!!main.model || getLocalAssetDerivatives(main).length > 0 || duplicateAssets.has(main.id));
}

export function isCatalogDerivative(asset: SceneAsset) { return !!asset.variantOf || parentIds.has(asset.id); }

// 旧配方衍生：4种状态×27款，去掉原始原版即主项本身。
const recipeDerivativeCount = assetStates.length * 27 - 1;
/** 与 getAssetDerivatives 同口径的衍生数量，不建立衍生对象；match 只看分类、题材、类型等元数据。 */
export function countAssetDerivatives(main: SceneAsset, match?: (asset: SceneAsset) => boolean): number {
  if (isCatalogDerivative(main)) return 0;
  const own = (asset: SceneAsset) => {
    if (asset.blueprint) { const values = getLocalAssetDerivatives(asset); return match ? values.filter(match).length : values.length; }
    const source = sourceAssetsById.get(asset.id);
    // 旧配方衍生沿用源素材的分类、题材与类型，源素材通过筛选即整组通过。
    return !source || asset.variantOf || (match && !match(source)) ? 0 : recipeDerivativeCount;
  };
  return own(main) + (duplicateAssets.get(main.id) ?? []).reduce((sum, asset) => sum + (!match || match(asset) ? 1 : 0) + own(asset), 0);
}

function getOwnDerivatives(main: SceneAsset): SceneAsset[] {
  if (main.blueprint) return getLocalAssetDerivatives(main);
  const source = sourceAssetsById.get(main.id);
  if (!source || main.variantOf) return [];
  const cached = derivatives.get(source.id);
  if (cached) return cached;
  const { model: _model, ...metadata } = source;
  const values: SceneAsset[] = [];
  for (const state of assetStates) for (let variant = 0; variant < 27; variant++) {
    if (variant === 0 && state === "原始") continue;
    const variantName = variant ? `${source.name}·款式${String(variant).padStart(2, "0")}` : source.name;
    values.push({ ...metadata, id: `${source.id}${variant ? `Variant${variant}` : ""}${stateSuffixes[state]}`, name: state === "原始" ? variantName : `${state}·${variantName}`, state, itemType: getAssetItemType(source), variantOf: source.id, recipe: { sourceId: source.id, variant, state, revision: 1 } });
  }
  // 衍生只在父项展开时建立，始终不进入主素材数量；最多缓存最近16个父项。
  derivatives.set(source.id, values);
  if (derivatives.size > 16) derivatives.delete(derivatives.keys().next().value!);
  return values;
}
