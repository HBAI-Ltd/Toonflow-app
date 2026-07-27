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
  "art_skills",
  "3D_90s_northeast_anthropomorphic_cat",
);

const requiredFiles = [
  "README.md",
  "prefix.md",
  "art_prompt/art_character.md",
  "art_prompt/art_character_derivative.md",
  "art_prompt/art_prop.md",
  "art_prompt/art_prop_derivative.md",
  "art_prompt/art_scene.md",
  "art_prompt/art_scene_derivative.md",
  "art_prompt/art_storyboard_video.md",
  "driector_skills/director_planning_style.md",
  "driector_skills/director_storyboard.md",
  "driector_skills/director_storyboard_table_style.md",
];

function read(relativePath) {
  return fs.readFileSync(path.join(manualRoot, relativePath), "utf8");
}

test("东北90年代视觉手册包含 Toonflow 所需的 12 个字段文件", () => {
  for (const relativePath of requiredFiles) {
    const absolutePath = path.join(manualRoot, relativePath);
    assert.equal(fs.existsSync(absolutePath), true, `缺少文件：${relativePath}`);
    assert.ok(
      fs.statSync(absolutePath).size > 100,
      `文件内容过短：${relativePath}`,
    );
  }
});

test("README 第一行可作为视觉手册名称读取", () => {
  const firstLine = read("README.md").split(/\r?\n/, 1)[0];
  assert.equal(firstLine, "# 东北90年代拟人猫电影动画风格说明");
});

test("视觉手册包含可供列表加载的 PNG 封面", () => {
  const coverPath = path.join(manualRoot, "images", "cover.png");
  assert.equal(fs.existsSync(coverPath), true, "缺少 images/cover.png");
  const cover = fs.readFileSync(coverPath);
  assert.ok(cover.length > 100_000, "封面文件内容过短");
  assert.deepEqual(
    [...cover.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
    "封面不是有效的 PNG 文件",
  );
});

test("全局前缀锁定年代、片长、画幅、人物和色彩", () => {
  const prefix = read("prefix.md");

  for (const token of [
    "1988—1990",
    "60 秒",
    "9:16",
    "小橘",
    "橘爸",
    "花妈",
    "猫奶奶",
    "大勇",
    "橘棕色",
    "墨绿色",
    "蓝灰色",
    "暗红色",
    "米黄色",
  ]) {
    assert.match(prefix, new RegExp(token), `全局前缀缺少：${token}`);
  }
});

test("角色手册完整锁定五名固定角色", () => {
  const character = read("art_prompt/art_character.md");
  const derivative = read("art_prompt/art_character_derivative.md");

  for (const token of ["小橘", "橘爸", "花妈", "猫奶奶", "大勇"]) {
    assert.match(character, new RegExp(token), `角色手册缺少：${token}`);
  }

  for (const token of ["身份不变", "毛色不变", "脸部标记不变", "头身比例不变"]) {
    assert.match(derivative, new RegExp(token), `角色衍生规则缺少：${token}`);
  }
});

test("场景手册覆盖固定地点和东北老工业生活痕迹", () => {
  const scene = read("art_prompt/art_scene.md");

  for (const token of [
    "小橘家",
    "家属院",
    "红星机械厂",
    "红星小学",
    "供销社",
    "露天市场",
    "大勇家",
    "红砖",
    "铁暖气",
    "积雪",
    "蒸汽",
    "使用痕迹",
  ]) {
    assert.match(scene, new RegExp(token), `场景手册缺少：${token}`);
  }
});

test("视频和分镜规则按 60 秒竖屏生活喜剧设计", () => {
  const video = read("art_prompt/art_storyboard_video.md");
  const storyboard = read("driector_skills/director_storyboard.md");
  const tableStyle = read(
    "driector_skills/director_storyboard_table_style.md",
  );
  const combined = `${video}\n${storyboard}\n${tableStyle}`;

  for (const token of [
    "60 秒",
    "9:16",
    "生活化笑点",
    "50%",
    "30%",
    "20%",
    "不强行煽情",
  ]) {
    assert.match(combined, new RegExp(token), `分镜与视频规则缺少：${token}`);
  }
});

test("全局与专项规则明确禁止时代和风格穿帮", () => {
  const combined = requiredFiles.map(read).join("\n");

  for (const token of [
    "智能手机",
    "液晶电视",
    "现代羽绒服",
    "外卖盒",
    "精装修",
    "真人猫耳",
    "四足宠物猫",
    "高饱和糖果色",
    "现代纯白",
  ]) {
    assert.match(combined, new RegExp(token), `缺少禁止项：${token}`);
  }
});
