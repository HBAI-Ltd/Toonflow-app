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
  "2D_healing_urban_women_vlog",
);
const directorManualRoot = path.join(
  projectRoot,
  "data",
  "skills",
  "story_skills",
  "Healing_urban_women_vlog",
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

function readDirector(relativePath) {
  return fs.readFileSync(path.join(directorManualRoot, relativePath), "utf8");
}

function assertContains(content, tokens, label) {
  for (const token of tokens) {
    assert.ok(content.includes(token), `${label}缺少：${token}`);
  }
}

test("治愈系都市女性手册包含 Toonflow 所需的 12 个字段文件", () => {
  for (const relativePath of requiredFiles) {
    const absolutePath = path.join(manualRoot, relativePath);
    assert.equal(fs.existsSync(absolutePath), true, `缺少文件：${relativePath}`);
    assert.ok(
      fs.statSync(absolutePath).size > 300,
      `文件内容过短：${relativePath}`,
    );
  }
});

test("README 第一行可作为视觉手册名称读取", () => {
  const firstLine = read("README.md").split(/\r?\n/, 1)[0];
  assert.equal(firstLine, "# 治愈系都市女性生活半写实二维动画风格说明");
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

test("全局前缀锁定画幅、时长、节拍、媒介和色彩", () => {
  const prefix = read("prefix.md");
  assertContains(
    prefix,
    [
      "3:4",
      "68—89 秒",
      "约 80 秒",
      "20—27",
      "半写实二维数字插画",
      "栗棕色长卷发",
      "#F0E2CE",
      "#27354D",
      "奶油暖光",
      "深蓝夜色",
    ],
    "全局前缀",
  );
});

test("角色手册区分女主角、闺蜜和三代家人", () => {
  const combined = [
    read("art_prompt/art_character.md"),
    read("art_prompt/art_character_derivative.md"),
  ].join("\n");

  assertContains(
    combined,
    [
      "小幸",
      "短发闺蜜",
      "母亲",
      "父亲",
      "外婆",
      "身份不变",
      "年龄层不变",
      "脸部结构不变",
      "身高关系不变",
      "服装可变层",
    ],
    "角色手册",
  );
});

test("企划和场景覆盖六类故事模型与四类空间", () => {
  const combined = [
    read("README.md"),
    read("art_prompt/art_scene.md"),
    read("driector_skills/director_planning_style.md"),
  ].join("\n");

  assertContains(
    combined,
    [
      "独居自愈",
      "通勤工作",
      "独自挑战",
      "女性友谊",
      "外婆与旧时光",
      "父母与双向照料",
      "现代公寓",
      "职场与商业空间",
      "自然旅行",
      "老街旧宅",
    ],
    "企划与场景手册",
  );
});

test("导演手册明确时间戳日记、共同行动、镜头和声音规则", () => {
  const combined = [
    read("art_prompt/art_storyboard_video.md"),
    read("driector_skills/director_storyboard.md"),
    read("driector_skills/director_storyboard_table_style.md"),
  ].join("\n");

  assertContains(
    combined,
    [
      "时间戳",
      "白字黑描边",
      "共同行动",
      "建立镜头",
      "动作镜头",
      "细节镜头",
      "慢推",
      "轻跟拍",
      "溶解",
      "立体声",
      "-16 LUFS",
      "-1 dBTP",
    ],
    "导演手册",
  );
});

test("整套手册明确排除六支参考视频中的风险和误读", () => {
  const combined = requiredFiles.map(read).join("\n");

  assertContains(
    combined,
    [
      "恋爱",
      "霸总",
      "暧昧",
      "同脸",
      "年龄漂移",
      "手指错误",
      "道具穿模",
      "时间戳倒退",
      "过度溶解",
      "水印",
      "9:16 黑边",
      "样板间",
      "死亡",
      "疾病",
    ],
    "负面约束",
  );
  assert.doesNotMatch(combined, /\b(?:TODO|TBD)\b|待补充|占位文本/);
});

test("独立导演手册包含 Toonflow 所需的三个字段和封面", () => {
  const directorFiles = [
    "README.md",
    "driector_skills/director_planning_narrative.md",
    "driector_skills/director_storyboard_table_narrative.md",
  ];

  for (const relativePath of directorFiles) {
    const absolutePath = path.join(directorManualRoot, relativePath);
    assert.equal(fs.existsSync(absolutePath), true, `导演手册缺少：${relativePath}`);
    assert.ok(
      fs.statSync(absolutePath).size > 300,
      `导演手册内容过短：${relativePath}`,
    );
  }

  const firstLine = readDirector("README.md").split(/\r?\n/, 1)[0];
  assert.equal(firstLine, "# 治愈系都市女性生活 · 导演叙事手法技能包");

  const coverPath = path.join(directorManualRoot, "images", "cover.png");
  assert.equal(fs.existsSync(coverPath), true, "独立导演手册缺少封面");
  const cover = fs.readFileSync(coverPath);
  assert.ok(cover.length > 100_000, "独立导演手册封面文件内容过短");
  assert.deepEqual(
    [...cover.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
    "独立导演手册封面不是有效的 PNG 文件",
  );
});

test("独立导演手册与视觉手册共享成片规格和叙事边界", () => {
  const combined = [
    readDirector("README.md"),
    readDirector("driector_skills/director_planning_narrative.md"),
    readDirector("driector_skills/director_storyboard_table_narrative.md"),
  ].join("\n");

  assertContains(
    combined,
    [
      "3:4",
      "68—89 秒",
      "约 80 秒",
      "20—27",
      "独居自愈",
      "通勤工作",
      "独自挑战",
      "女性友谊",
      "外婆与旧时光",
      "父母与双向照料",
      "时间戳",
      "共同行动",
      "-16 LUFS",
      "-1 dBTP",
      "恋爱",
      "霸总",
      "暧昧",
      "死亡",
      "疾病",
    ],
    "独立导演手册",
  );
  assert.doesNotMatch(combined, /\b(?:TODO|TBD)\b|待补充|占位文本/);
});
