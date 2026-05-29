/**
 * Toonflow AI供应商模板 - F5-TTS 本地语音
 * @version 2.0
 *
 * 说明：
 * 1) 连接本地 F5-TTS Gradio 服务，自然语音合成 + 声音克隆
 * 2) 默认地址 http://127.0.0.1:5050
 * 3) 通过 Gradio API /gradio_api/call/basic_tts 调用
 * 4) 仅支持TTS，不支持文本对话/图片/视频
 * 5) 参考音频路径为 F5-TTS 服务器本地路径
 *
 * F5-TTS basic_tts SSE 输出格式（已验证）：
 *   event: complete
 *   data: [
 *     { path, url, orig_name, meta },  // [0] 合成音频
 *     { path, url, orig_name },        // [1] 频谱图（忽略）
 *     "transcribed text",              // [2] 参考文本（忽略）
 *     277502916                        // [3] seed（忽略）
 *   ]
 */

// ============================================================
// 类型定义
// ============================================================

type VideoMode =
  | "singleImage"
  | "startEndRequired"
  | "endFrameOptional"
  | "startFrameOptional"
  | "text"
  | (`videoReference:${number}` | `imageReference:${number}` | `audioReference:${number}`)[];

interface TextModel {
  name: string;
  modelName: string;
  type: "text";
  think: boolean;
}

interface ImageModel {
  name: string;
  modelName: string;
  type: "image";
  mode: ("text" | "singleImage" | "multiReference")[];
  associationSkills?: string;
}

interface VideoModel {
  name: string;
  modelName: string;
  type: "video";
  mode: VideoMode[];
  associationSkills?: string;
  audio: "optional" | false | true;
  durationResolutionMap: { duration: number[]; resolution: string[] }[];
}

interface TTSModel {
  name: string;
  modelName: string;
  type: "tts";
  voices: { title: string; voice: string }[];
}

interface VendorConfig {
  id: string;
  version: string;
  name: string;
  author: string;
  description?: string;
  icon?: string;
  inputs: { key: string; label: string; type: "text" | "password" | "url"; required: boolean; placeholder?: string }[];
  inputValues: Record<string, string>;
  models: (TextModel | ImageModel | VideoModel | TTSModel)[];
}

type ReferenceList =
  | { type: "image"; sourceType: "base64"; base64: string }
  | { type: "audio"; sourceType: "base64"; base64: string }
  | { type: "video"; sourceType: "base64"; base64: string };

interface ImageConfig {
  prompt: string;
  referenceList?: Extract<ReferenceList, { type: "image" }>[];
  size: "1K" | "2K" | "4K";
  aspectRatio: `${number}:${number}`;
}

interface VideoConfig {
  duration: number;
  resolution: string;
  aspectRatio: "16:9" | "9:16";
  prompt: string;
  referenceList?: ReferenceList[];
  audio?: boolean;
  mode: VideoMode[];
}

interface TTSConfig {
  text: string;
  voice: string;
  speechRate: number;
  pitchRate: number;
  volume: number;
  referenceList?: Extract<ReferenceList, { type: "audio" }>[];
}

// ============================================================
// 全局声明
// ============================================================

declare const axios: any;
declare const logger: (msg: string) => void;
declare const urlToBase64: (url: string) => Promise<string>;
declare const pollTask: (
  fn: () => Promise<{ completed: boolean; data?: string; error?: string }>,
  interval?: number,
  timeout?: number,
) => Promise<{ completed: boolean; data?: string; error?: string }>;
declare const exports: {
  vendor: VendorConfig;
  textRequest: (m: TextModel, t: boolean, tl: 0 | 1 | 2 | 3) => any;
  imageRequest: (c: ImageConfig, m: ImageModel) => Promise<string>;
  videoRequest: (c: VideoConfig, m: VideoModel) => Promise<string>;
  ttsRequest: (c: TTSConfig, m: TTSModel) => Promise<string>;
  checkForUpdates?: () => Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }>;
  updateVendor?: () => Promise<string>;
};

// ============================================================
// 供应商配置
// ============================================================

const vendor: VendorConfig = {
  id: "f5tts",
  version: "2.0",
  author: "Local AI",
  name: "F5-TTS 本地语音",
  description:
    "连接本地 F5-TTS Gradio 服务，自然语音合成 + 声音克隆，无需联网。\n\n1. 安装：pip install f5-tts\n2. 启动：f5-tts_infer-gradio --port 5050\n3. 默认地址 http://127.0.0.1:5050\n4. API名称 basic_tts\n5. 准备参考音频（WAV/MP3，5-15秒）放在服务器上\n6. 在 refAudioPath 填入参考音频的服务器绝对路径\n7. Docker 部署需 mount 音频文件到容器内",
  inputs: [
    { key: "baseUrl", label: "服务地址", type: "url", required: true, placeholder: "http://127.0.0.1:5050" },
    { key: "apiName", label: "API名称", type: "text", required: true, placeholder: "basic_tts" },
    { key: "refAudioPath", label: "参考音频路径", type: "text", required: true, placeholder: "/app/ref_voice.wav" },
    { key: "refText", label: "参考音频文本", type: "text", required: false, placeholder: "留空则自动识别" },
    { key: "removeSilence", label: "去除静音", type: "text", required: false, placeholder: "false" },
    { key: "randomizeSeed", label: "随机种子", type: "text", required: false, placeholder: "true" },
    { key: "seed", label: "种子值", type: "text", required: false, placeholder: "0" },
    { key: "crossFade", label: "交叉淡化", type: "text", required: false, placeholder: "0.15" },
    { key: "nfeStep", label: "NFE步数", type: "text", required: false, placeholder: "32" },
    { key: "speed", label: "语速", type: "text", required: false, placeholder: "1.0" },
  ],
  inputValues: {
    baseUrl: "http://127.0.0.1:5050",
    apiName: "basic_tts",
    refAudioPath: "",
    refText: "",
    removeSilence: "false",
    randomizeSeed: "true",
    seed: "0",
    crossFade: "0.15",
    nfeStep: "32",
    speed: "1.0",
  },
  models: [
    {
      name: "F5-TTS v1 Base",
      modelName: "f5tts-v1-base",
      type: "tts",
      voices: [
        { title: "默认", voice: "default" },
      ],
    },
  ],
};

// ============================================================
// 辅助函数
// ============================================================

/** 解析 Gradio SSE 流，提取最终数据 */
const parseGradioSSE = (sseText: string): any => {
  const lines = sseText.split("\n");
  let lastData: any = null;
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      try {
        lastData = JSON.parse(line.substring(6));
      } catch {
        // 忽略解析失败的行
      }
    }
  }
  return lastData;
};

/** 从文件路径提取文件名（不使用 path 模块） */
const getFileName = (filePath: string): string => {
  const normalized = filePath.replace(/\\/g, "/");
  const segments = normalized.split("/");
  return segments[segments.length - 1] || "audio.wav";
};

/** 根据文件扩展名推断 MIME 类型 */
const getMimeType = (filePath: string): string => {
  const ext = (filePath.split(".").pop() || "wav").toLowerCase();
  const mimeMap: Record<string, string> = {
    wav: "audio/wav",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    flac: "audio/flac",
    ogg: "audio/ogg",
    aac: "audio/aac",
  };
  return mimeMap[ext] || "audio/wav";
};

/** 修正 MIME 类型：urlToBase64 可能返回 image/jpeg 如果服务器没设 content-type */
const fixAudioMime = (dataUri: string, ext: string = "wav"): string => {
  if (!dataUri.startsWith("data:")) return dataUri;
  const mimeMatch = dataUri.match(/^data:([^;]+);/);
  if (mimeMatch && mimeMatch[1].startsWith("audio/")) return dataUri;
  const e = ext.toLowerCase();
  const correctMime = e === "mp3" ? "audio/mpeg" : e === "ogg" ? "audio/ogg" : "audio/wav";
  return dataUri.replace(/^data:[^;]+;/, `data:${correctMime};`);
};

/**
 * 从 SSE 解析结果中提取音频 FileData，下载并转为 base64
 *
 * 已验证的 F5-TTS SSE output 格式：
 *   [0] = { path, url, orig_name, meta }  ← 合成音频
 *   [1] = { path, url, orig_name }         ← 频谱图（忽略）
 *   [2] = "transcribed text"               ← 参考文本（忽略）
 *   [3] = 277502916                        ← seed（忽略）
 *
 * 也兼容 Gradio 包装格式：
 *   { msg: "process_completed", output: { data: [...] } }
 */
const extractAndConvertAudio = async (rawOutput: any, baseUrl: string): Promise<string> => {
  let audioFileData: any = null;

  // 情况1: 直接数组（SSE data 行直接是数组）
  if (Array.isArray(rawOutput)) {
    audioFileData = rawOutput[0];
  }
  // 情况2: Gradio 包装 { output: { data: [...] } }
  else if (rawOutput && typeof rawOutput === "object" && rawOutput.output?.data) {
    const arr = rawOutput.output.data;
    audioFileData = Array.isArray(arr) ? arr[0] : arr;
  }
  // 情况3: { data: [...] }
  else if (rawOutput && typeof rawOutput === "object" && rawOutput.data) {
    const arr = rawOutput.data;
    audioFileData = Array.isArray(arr) ? arr[0] : arr;
  }

  if (!audioFileData) {
    throw new Error(`[f5tts] 无法提取音频数据，rawOutput: ${JSON.stringify(rawOutput).substring(0, 300)}`);
  }

  // 下载音频并转为 base64
  // 优先使用 url 字段（完整 URL，直接可下载）
  if (audioFileData.url) {
    const audioUrl = audioFileData.url;
    logger(`[f5tts] 下载音频(url): ${audioUrl.substring(0, 100)}`);
    const ext = (audioFileData.orig_name || "").split(".").pop() || "wav";
    return fixAudioMime(await urlToBase64(audioUrl), ext);
  }

  // 备用：从 path 构造 URL
  if (audioFileData.path) {
    const audioUrl = `${baseUrl.replace(/\/+$/, "")}/gradio_api/file=${audioFileData.path}`;
    logger(`[f5tts] 下载音频(path): ${audioUrl.substring(0, 100)}`);
    const ext = (audioFileData.orig_name || "").split(".").pop() || "wav";
    return fixAudioMime(await urlToBase64(audioUrl), ext);
  }

  throw new Error(`[f5tts] 音频 FileData 缺少 url 和 path: ${JSON.stringify(audioFileData).substring(0, 200)}`);
};

// ============================================================
// 适配器函数
// ============================================================

const textRequest = (_model: TextModel, _think: boolean, _thinkLevel: 0 | 1 | 2 | 3) => {
  throw new Error("F5-TTS 仅支持语音合成，不支持文本对话");
};

const imageRequest = async (_config: ImageConfig, _model: ImageModel): Promise<string> => {
  return "";
};

const videoRequest = async (_config: VideoConfig, _model: VideoModel): Promise<string> => {
  return "";
};

const ttsRequest = async (config: TTSConfig, _model: TTSModel): Promise<string> => {
  const baseUrl = vendor.inputValues.baseUrl.replace(/\/+$/, "");
  const apiName = vendor.inputValues.apiName || "basic_tts";
  const refAudioPath = vendor.inputValues.refAudioPath;
  const refText = vendor.inputValues.refText || "";
  const removeSilence = vendor.inputValues.removeSilence === "true";
  const randomizeSeed = vendor.inputValues.randomizeSeed !== "false";
  const seed = parseInt(vendor.inputValues.seed) || 0;
  const crossFade = parseFloat(vendor.inputValues.crossFade) || 0.15;
  const nfeStep = parseInt(vendor.inputValues.nfeStep) || 32;
  const speed = parseFloat(vendor.inputValues.speed) || 1.0;

  // 验证
  if (!config.text || !config.text.trim()) {
    throw new Error("[f5tts] 合成文本不能为空");
  }
  if (!refAudioPath) {
    throw new Error("[f5tts] 参考音频路径不能为空，请在供应商设置中填写 refAudioPath");
  }

  const genText = config.text;

  logger(`[f5tts] 开始语音合成 → ${baseUrl}/gradio_api/call/${apiName}`);
  logger(`[f5tts] text="${genText.substring(0, 60)}...", refAudio="${refAudioPath}", speed=${speed}, nfeStep=${nfeStep}`);

  // ===== 构建 Gradio Payload =====
  // F5-TTS basic_tts 参数顺序（来自 /gradio_api/info）：
  // 1. ref_audio_input:  FileData { path, orig_name, mime_type, meta }
  // 2. ref_text_input:   string (空=自动Whisper识别)
  // 3. gen_text_input:   string
  // 4. remove_silence:   boolean
  // 5. randomize_seed:   boolean
  // 6. seed_input:       number
  // 7. cross_fade_duration_slider: number
  // 8. nfe_slider:       number
  // 9. speed_slider:     number
  const refFileName = getFileName(refAudioPath);
  const refMimeType = getMimeType(refAudioPath);
  const refAudioInput = {
    path: refAudioPath,
    orig_name: refFileName,
    mime_type: refMimeType,
    meta: { _type: "gradio.FileData" },
  };
  logger(`[f5tts] refAudioInput: path="${refAudioPath}", orig_name="${refFileName}", mime_type="${refMimeType}"`);

  const gradioPayload = {
    data: [
      refAudioInput,
      refText,
      genText,
      removeSilence,
      randomizeSeed,
      seed,
      crossFade,
      nfeStep,
      speed,
    ],
  };

  // ===== Submit =====
  const submitResp = await axios.post(`${baseUrl}/gradio_api/call/${apiName}`, gradioPayload, {
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
  });

  logger(`[f5tts] Submit status: ${submitResp.status}`);

  const eventId = submitResp.data?.event_id;
  if (!eventId) {
    // 无 event_id，尝试同步响应
    const syncData = submitResp.data?.data || submitResp.data;
    if (syncData) {
      const audioBase64 = await extractAndConvertAudio(syncData, baseUrl);
      if (audioBase64.startsWith("data:audio/")) {
        logger(`[f5tts] 同步合成成功!`);
        return audioBase64;
      }
    }
    throw new Error(`[f5tts] 未收到 event_id，同步响应也无法解析。Response: ${JSON.stringify(submitResp.data).substring(0, 200)}`);
  }

  logger(`[f5tts] event_id: ${eventId}，开始轮询`);

  // ===== Poll =====
  const pollResult = await pollTask(async () => {
    try {
      const resultResp = await axios.get(`${baseUrl}/gradio_api/call/${apiName}/${eventId}`, {
        timeout: 300000,
      });

      const resultData = resultResp.data;
      logger(`[f5tts] Poll status: ${resultResp.status}, data preview: ${JSON.stringify(resultData).substring(0, 300)}`);

      // ===== SSE 文本格式 =====
      if (typeof resultData === "string") {
        // 检查 event: error 行
        if (resultData.includes("event: error")) {
          const errorData = parseGradioSSE(resultData);
          const errorMsg = typeof errorData === "string" ? errorData : (errorData?.error || JSON.stringify(errorData));
          return { completed: true, error: `[f5tts] Gradio event error: ${errorMsg}` };
        }

        const parsed = parseGradioSSE(resultData);

        // parsed 是错误字符串（如 "404: Not Found"）
        if (typeof parsed === "string") {
          return { completed: true, error: `[f5tts] Gradio 返回错误: ${parsed}` };
        }

        if (parsed) {
          const msg = parsed.msg || "";

          if (msg === "process_generating" || msg === "estimation" || msg === "heartbeat") {
            return { completed: false };
          }

          if (msg === "error") {
            return { completed: true, error: `[f5tts] Gradio msg=error: ${JSON.stringify(parsed).substring(0, 300)}` };
          }

          if (msg === "process_completed" || msg === "complete") {
            const output = parsed.output?.data || parsed.data;
            if (output) {
              return { completed: true, data: JSON.stringify(output) };
            }
            return { completed: false };
          }

          // 直接数组 — 即最终结果
          if (Array.isArray(parsed)) {
            return { completed: true, data: JSON.stringify(parsed) };
          }

          if (parsed.output?.data) {
            return { completed: true, data: JSON.stringify(parsed.output.data) };
          }
          if (parsed.data) {
            return { completed: true, data: JSON.stringify(parsed.data) };
          }

          return { completed: false };
        }
        return { completed: false };
      }

      // ===== JSON 格式响应 =====
      if (resultData?.msg === "process_completed" || resultData?.msg === "complete") {
        const output = resultData?.output?.data || resultData?.data;
        if (output) {
          return { completed: true, data: JSON.stringify(output) };
        }
        return { completed: false };
      }
      if (resultData?.msg === "process_generating" || resultData?.msg === "estimation" || resultData?.msg === "heartbeat") {
        return { completed: false };
      }
      if (resultData?.msg === "error") {
        return { completed: true, error: `[f5tts] Gradio msg=error: ${JSON.stringify(resultData).substring(0, 300)}` };
      }

      // 直接数组
      if (Array.isArray(resultData)) {
        return { completed: true, data: JSON.stringify(resultData) };
      }

      if (resultData?.data) {
        return { completed: true, data: JSON.stringify(resultData.data) };
      }

      return { completed: false };
    } catch (e: any) {
      // 404 = event_id 已过期/不存在，停止轮询
      if (e?.response?.status === 404) {
        return { completed: true, error: "[f5tts] Gradio event not found / expired (404)" };
      }
      logger(`[f5tts] 轮询出错: ${e.message}`);
      return { completed: false };
    }
  }, 3000, 300000);

  if (pollResult.error) {
    throw new Error(`[f5tts] Gradio 轮询失败: ${pollResult.error}`);
  }

  // ===== 提取音频 =====
  const rawResult = JSON.parse(pollResult.data!);
  const audioBase64 = await extractAndConvertAudio(rawResult, baseUrl);

  if (!audioBase64.startsWith("data:audio/")) {
    throw new Error("[f5tts] 音频结果格式错误，未获取到有效的 data:audio/*;base64,...");
  }

  logger(`[f5tts] 语音合成成功! 音频长度: ${audioBase64.length}`);
  return audioBase64;
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
  return { hasUpdate: false, latestVersion: "2.0", notice: "" };
};

const updateVendor = async (): Promise<string> => {
  return "";
};

// ============================================================
// 导出
// ============================================================

exports.vendor = vendor;
exports.textRequest = textRequest;
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
exports.ttsRequest = ttsRequest;
exports.checkForUpdates = checkForUpdates;
exports.updateVendor = updateVendor;

export {};
