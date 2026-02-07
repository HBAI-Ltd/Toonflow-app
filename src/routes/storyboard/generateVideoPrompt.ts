import express from "express";
import u from "@/utils";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import path from "path";

const router = express.Router();

// 手动构建 JSON Schema，确保兼容 OpenAI strict 模式（含 additionalProperties: false）
const cellsResultJsonSchema = {
  type: "object" as const,
  properties: {
    time: { type: "number" as const, description: "时长,镜头时长 1-15" },
    content: { type: "string" as const, description: "提示词内容" },
    name: { type: "string" as const, description: "分镜名称" },
  },
  required: ["time", "content", "name"] as const,
  additionalProperties: false,
};

const prompt = `
你是一名资深动画导演，擅长将静态分镜转化为简洁、专业、详尽的 Motion Prompt（视频生成动作提示）。你理解镜头语言、情绪节奏，能补充丰富但不重复静态元素，只突出变化与动态。

## 任务
你将接收用户输入的：  
- **分镜图片**（单张）  
- **分镜提示词**（对应该镜头）  
- **剧本内容**  

你需输出**规范的 Motion Prompt JSON 对象**。

---

## 核心要求

### 1. 画面类型描述（必需，开头一句）
- 明确本分镜属于：**前景/近景/中景/远景/全景**
- 表述格式："中景。" / "近景。" / "远景。" / "全景。"

### 3. 细致动作叙述
清晰分别描述以下要素：
- **镜头运动**（1种，5-20字）：推拉摇移、跟随、固定等
- **角色核心动作**（1-2种，20-60字）：主体动作+情绪细节
- **环境动态**（0-1种，10-30字）：光影、物体、自然元素变化
- **速度节奏**（5-15字）：缓慢、急促、平稳等
- **氛围风格**（可选，10-20字）：情绪渲染、视觉基调

用"，" "并且" "同时"等词串联，使句子流畅连贯。

### 4. 长度优化
- **content 必须在 80-150 字之间**
- 若不足 80 字，补充：
  - 角色细微神态（眼神、呼吸、肌肉紧张度）
  - 动作过渡细节（转身、停顿、重心转移）
  - 环境反应（光影变化、物体晃动）
- **禁止引入图片中已有的静态描述**

---

## 结构推荐

**标准结构：**  
画面类型。镜头运动，角色主动作+情绪表现+微动作细节，环境动态（如有），速度节奏，氛围渲染。

**参考示例：**  
- 中景。镜头缓慢推进，角色身体微微紧绷，神情凝重，缓缓转头注视门口，眉头微皱、唇角轻颤，光影在脸上拉出一缕阴影，衣角随动作轻晃，气氛变得紧张。
- 远景。镜头稳定，角色站立不动，但指尖不停地敲打桌面，目光游移不定，窗外树影摇曳，光线逐渐变暗，整体节奏平稳，渲染出迟疑与不安。

---

## 禁忌

❌ 不重复任何静态画面元素（外观、场景、服装、道具等）  
❌ 不使用否定句、抽象形容词  
❌ 不超过 2 种主体动作、1 种镜头运动、1 种环境动态  
❌ 不分多场景，单个 content 不超过 200 字

---

## 输出格式

返回 **JSON 对象**，包含：

{
  "time": 数字（1-15，镜头时长秒数）,
  "name": "字符串（2-6字，概括镜头动态/情绪）",
  "content": "字符串（80-150字，首句为画面类型，充分描述动态细节）"
}

### 字段说明
- **time**：根据动作复杂度合理分配，简单动作 2-5 秒，复杂动作 6-10 秒
- **name**：精炼概括本镜头核心动态或情绪转折
- **content**：首句必须是画面类型，后续流畅衔接动态描述

---

## 处理流程

1. **分析输入的单张图片**
2. **生成对应的 JSON 对象**
3. **检查 content 字段：**
   - 首句是否为画面类型
   - 字数是否在 80-150 之间
   - 是否避免了静态描述

---

现在请根据我提供的分镜内容，严格按照以上规则输出 Motion Prompt JSON 对象。

`;

// 生成单个分镜提示
async function generateSingleVideoPrompt({
  scriptText,
  storyboardPrompt,
  ossPath,
}: {
  scriptText: string;
  storyboardPrompt: string;
  ossPath: string;
}): Promise<{ content: string; time: number; name: string }> {
  let rootDir: string;
  if (typeof process.versions?.electron !== "undefined") {
    const { app } = require("electron");
    const userDataDir: string = app.getPath("userData");
    rootDir = path.join(userDataDir, "uploads");
  } else {
    rootDir = path.join(process.cwd(), "uploads");
  }

  let imagePath = ossPath;
  if (ossPath.includes("http")) {
    imagePath = new URL(ossPath).pathname;
  }

  const model = await u.ai.text({});
  if (!model) {
    throw new Error("无法获取语言模型，请检查语言模型配置");
  }

  const messages: any[] = [
    {
      role: "system",
      content: prompt,
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `剧本内容:${scriptText}\n分镜提示词:${storyboardPrompt}`,
        },
        {
          type: "local",
          path: path.join(rootDir, imagePath),
        },
      ],
    },
  ];

  try {
    const result = await model.invoke({
      messages,
      responseFormat: {
        type: "json_schema",
        jsonSchema: {
          name: "json",
          strict: true,
          schema: cellsResultJsonSchema,
        },
      },
    });

    if (!result || !result.json) {
      console.error("AI 返回结果为空:", result);
      throw new Error("AI 返回结果为空");
    }

    const json = result.json as { content: string; time: number; name: string };
    if (!json.content || json.time === undefined || !json.name) {
      console.error("AI 返回格式错误:", result.json);
      throw new Error("AI 返回格式错误");
    }

    return json;
  } catch (err: any) {
    console.error("generateSingleVideoPrompt 调用失败:", err?.message || err);
    throw new Error(`生成视频提示词失败: ${err?.message || "未知错误"}`);
  }
}
// 主路由 - 单张图片处理
export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    scriptId: z.number().nullable(),
    id: z.string(),
    prompt: z.string().optional(),
    src: z.string(),
  }),
  async (req, res) => {
    const { projectId, scriptId, id, prompt: imagePrompt, src } = req.body;

    try {
      const scriptData = await u.db("t_script").where("id", scriptId).select("content").first();
      if (!scriptData) return res.status(500).send(error("剧本不存在"));

      const projectData = await u.db("t_project").where({ id: +projectId }).select("artStyle", "videoRatio").first();
      if (!projectData) return res.status(500).send(error("项目不存在"));

      const result = await generateSingleVideoPrompt({
        scriptText: scriptData.content!,
        storyboardPrompt: imagePrompt || "",
        ossPath: src,
      });

      res.status(200).send(
        success({
          id,
          videoPrompt: result.content || "",
          prompt: imagePrompt,
          duration: String(result.time || ""),
          projectId,
          type: "分镜",
          name: result.name || "",
          scriptId,
          src,
        }),
      );
    } catch (err: any) {
      console.error("生成视频提示词失败:", err?.message || err);
      res.status(500).send(error(err?.message || "生成视频提示词失败"));
    }
  },
);
