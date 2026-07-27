import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDir, "..");
const manualRoot = path.join(
  projectRoot,
  "data",
  "skills",
  "story_skills",
  "Northeast_90s_anthropomorphic_cat",
);

const requiredFiles = [
  "README.md",
  "driector_skills/director_planning_narrative.md",
  "driector_skills/director_storyboard_table_narrative.md",
];

function read(relativePath) {
  return fs.readFileSync(path.join(manualRoot, relativePath), "utf8");
}

test("东北90年代拟人猫导演手册包含 Toonflow 所需的 3 个字段文件", () => {
  for (const relativePath of requiredFiles) {
    const absolutePath = path.join(manualRoot, relativePath);
    assert.equal(fs.existsSync(absolutePath), true, `缺少文件：${relativePath}`);
    assert.ok(
      fs.statSync(absolutePath).size > 500,
      `文件内容过短：${relativePath}`,
    );
  }
});

test("README 第一行可作为导演手册名称读取", () => {
  const firstLine = read("README.md").split(/\r?\n/, 1)[0];
  assert.equal(firstLine, "# 东北90年代拟人猫 · 导演叙事手法技能包");
});

test("导演手册复用配套视觉手册的 PNG 封面", () => {
  const coverPath = path.join(manualRoot, "images", "title.png");
  assert.equal(fs.existsSync(coverPath), true, "缺少 images/title.png");
  const cover = fs.readFileSync(coverPath);
  assert.ok(cover.length > 100_000, "封面文件内容过短");
  assert.deepEqual(
    [...cover.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
    "封面不是有效的 PNG 文件",
  );
});

test("导演规划锁定系列定位、时长、画幅和情绪比例", () => {
  const planning = read(
    "driector_skills/director_planning_narrative.md",
  );

  for (const token of [
    "1988—1990",
    "北安市红星机械厂家属院",
    "60 秒",
    "9:16",
    "50%",
    "30%",
    "20%",
    "生活化笑点",
    "不强行煽情",
  ]) {
    assert.match(planning, new RegExp(token), `导演规划缺少：${token}`);
  }
});

test("导演手册完整锁定五名角色和固定喜剧关系链", () => {
  const combined = requiredFiles.map(read).join("\n");

  for (const token of ["小橘", "橘爸", "花妈", "猫奶奶", "大勇"]) {
    assert.match(combined, new RegExp(token), `导演手册缺少角色：${token}`);
  }

  assert.match(
    combined,
    /小橘[^。\n]*办法[^。\n]*大勇[^。\n]*加入[^。\n]*橘爸[^。\n]*配合[^。\n]*花妈[^。\n]*识破[^。\n]*猫奶奶[^。\n]*善后/,
    "缺少固定喜剧关系链",
  );
});

test("分镜表覆盖核心地点、60 秒节奏和竖屏调度", () => {
  const storyboard = read(
    "driector_skills/director_storyboard_table_narrative.md",
  );

  for (const token of [
    "小橘家",
    "家属院",
    "红星机械厂",
    "红星小学",
    "供销社",
    "露天市场",
    "大勇家",
    "60 秒",
    "9:16",
    "抓包",
    "反应镜头",
    "一镜到底",
  ]) {
    assert.match(storyboard, new RegExp(token), `分镜表缺少：${token}`);
  }
});

test("声音、道具和动作规则服务人物而不是年代展览", () => {
  const combined = requiredFiles.map(read).join("\n");

  for (const token of [
    "自行车铃",
    "锅炉",
    "广播",
    "搪瓷",
    "铁暖气",
    "物件展览",
    "微表情",
    "猫爪",
  ]) {
    assert.match(combined, new RegExp(token), `生活叙事规则缺少：${token}`);
  }
});

test("导演手册明确禁止时代和表演穿帮", () => {
  const combined = requiredFiles.map(read).join("\n");

  for (const token of [
    "智能手机",
    "网络",
    "现代羽绒服",
    "外卖盒",
    "液晶电视",
    "电磁炉",
    "微波炉",
    "夸张动画鬼脸",
    "现代网络用语",
  ]) {
    assert.match(combined, new RegExp(token), `缺少禁止项：${token}`);
  }
});
