import fs from "node:fs/promises";
import path from "node:path";
import u from "@/utils";
import { db as knexDb } from "@/utils/db";

const PROJECT_ID = 1781118846784;
const SCRIPT_ID = 1781118846785;
const TRACK_ID = 1781122908334;
const VIDEO_ID = 1781122908335;
const now = Date.now();

async function copyDemoVideo(relPath: string) {
  const source = u.getPath(["assets", "ending.mp4"]);
  const target = u.getPath(["oss", ...relPath.replace(/^\/+/, "").split("/")]);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(source, target);
}

async function upsert(table: string, id: number, data: Record<string, unknown>) {
  const existing = await u.db(table as any).where({ id }).first();
  if (existing) {
    await u.db(table as any).where({ id }).update(data);
    return;
  }
  await u.db(table as any).insert({ id, ...data });
}

async function main() {
  const videoPath = `/${PROJECT_ID}/video/compose-demo-ending.mp4`;
  await copyDemoVideo(videoPath);

  await upsert("o_project", PROJECT_ID, {
    projectType: "短剧",
    name: "视频合成演示项目",
    intro: "用于验证剪辑台合成任务、成片合成与导出能力的本地演示数据。",
    type: "古风短剧",
    artStyle: "cinematic fantasy drama",
    videoRatio: "16:9",
    directorManual: "镜头简洁，人物动作和台词清晰。",
    userId: 1,
    imageModel: "demo:image",
    videoModel: "demo:video",
    imageQuality: "standard",
    mode: "text",
    createTime: now,
  });

  await upsert("o_script", SCRIPT_ID, {
    name: "第1集 合成演示",
    content: "沈辞站在城楼上，苏锦走近并说：你又一个人在这里。",
    projectId: PROJECT_ID,
    extractState: 1,
    createTime: now,
  });

  await upsert("o_videoTrack", TRACK_ID, {
    videoId: VIDEO_ID,
    projectId: PROJECT_ID,
    scriptId: SCRIPT_ID,
    state: "已完成",
    prompt: "A short cinematic clip for compose workflow validation.",
    duration: 5,
  });

  await upsert("o_video", VIDEO_ID, {
    filePath: videoPath,
    state: "生成成功",
    time: 5,
    scriptId: SCRIPT_ID,
    projectId: PROJECT_ID,
    videoTrackId: TRACK_ID,
  });

  await upsert("o_storyboard", 1781122908336, {
    scriptId: SCRIPT_ID,
    prompt: "城楼黄昏，人物回望。",
    filePath: "",
    duration: "5",
    state: "已完成",
    trackId: TRACK_ID,
    track: "主轨道",
    videoDesc: "（苏锦登上城楼走向沈辞、城楼、苏锦/沈辞/城楼、5s、中景、跟踪、苏锦拾级而上走向沈辞、担忧、黄昏余晖渐暗、苏锦说：你又一个人在这里、脚步声风声、A001/A002/A003）",
    dialogue: "你又一个人在这里。",
    soundEffect: "脚步声风声",
    shotType: "中景",
    cameraMovement: "跟踪",
    shouldGenerateImage: 0,
    projectId: PROJECT_ID,
    index: 1,
    createTime: now,
  });

  console.log(
    JSON.stringify(
      {
        message: "compose demo seed ready",
        projectId: PROJECT_ID,
        scriptId: SCRIPT_ID,
        trackId: TRACK_ID,
        videoId: VIDEO_ID,
        videoPath,
      },
      null,
      2,
    ),
  );
  await knexDb.destroy();
}

main().catch(async (error) => {
  console.error(error);
  await knexDb.destroy().catch(() => {});
  process.exit(1);
});
