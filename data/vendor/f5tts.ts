/**
 * Toonflow AI供应商模板 - F5-TTS 本地语音
 * @version 2.1
 *
 * 说明：
 * 1) 通过本地 F5-TTS Wrapper 服务调用语音合成
 * 2) Wrapper 地址默认 http://127.0.0.1:5052
 * 3) Wrapper 使用 gradio_client 调用 F5-TTS Gradio（自动处理文件上传）
 * 4) 仅支持TTS，不支持文本对话/图片/视频
 * 5) 参考音频路径为 F5-TTS 服务器本地路径（Wrapper 机器上的路径）
 *
 * 架构：
 *   Toonflow → f5tts.ts → Wrapper(:5052) → gradio_client → F5-TTS Gradio(:5050)
 *
 * Wrapper 启动方式：
 *   cd mini-services/f5tts-wrapper
 *   python tts_server.py --port 5052 --gradio-url http://127.0.0.1:5050
 *   或使用 start.bat (Windows)
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
  version: "2.1",
  author: "Local AI",
  name: "F5-TTS 本地语音",
  description:
    "通过本地 F5-TTS Wrapper 服务调用语音合成 + 声音克隆，无需联网。\n\n架构：Toonflow → Wrapper(:5052) → gradio_client → F5-TTS Gradio(:5050)\n\n1. 先启动 F5-TTS Gradio：f5-tts_infer-gradio --port 5050\n2. 再启动 Wrapper：cd mini-services/f5tts-wrapper && start.bat\n3. Wrapper 默认地址 http://127.0.0.1:5052\n4. 准备参考音频（WAV/MP3，5-15秒）放在服务器上\n5. 在 refAudioPath 填入参考音频的服务器绝对路径\n6. Docker 部署需 mount 音频文件到容器内",
  inputs: [
    { key: "wrapperUrl", label: "Wrapper地址", type: "url", required: true, placeholder: "http://127.0.0.1:5052" },
    { key: "refAudioPath", label: "参考音频路径", type: "text", required: true, placeholder: "C:\\AI\\F5-TTS\\voices\\ref_clean.wav" },
    { key: "refText", label: "参考音频文本", type: "text", required: false, placeholder: "留空则自动识别" },
    { key: "removeSilence", label: "去除静音", type: "text", required: false, placeholder: "false" },
    { key: "randomizeSeed", label: "随机种子", type: "text", required: false, placeholder: "true" },
    { key: "seed", label: "种子值", type: "text", required: false, placeholder: "0" },
    { key: "crossFade", label: "交叉淡化", type: "text", required: false, placeholder: "0.15" },
    { key: "nfeStep", label: "NFE步数", type: "text", required: false, placeholder: "32" },
    { key: "speed", label: "语速", type: "text", required: false, placeholder: "1.0" },
  ],
  inputValues: {
    wrapperUrl: "http://127.0.0.1:5052",
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
  const wrapperUrl = vendor.inputValues.wrapperUrl.replace(/\/+$/, "");
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

  logger(`[f5tts] 开始语音合成 → ${wrapperUrl}/tts`);
  logger(`[f5tts] text="${genText.substring(0, 60)}...", refAudio="${refAudioPath}", speed=${speed}, nfeStep=${nfeStep}`);

  // ===== 构建 Wrapper Payload =====
  const payload = {
    refAudioPath,
    refText,
    genText,
    removeSilence,
    randomizeSeed,
    seed,
    crossFade,
    nfeStep,
    speed,
  };

  // ===== Call Wrapper =====
  let resp: any;
  try {
    resp = await axios.post(`${wrapperUrl}/tts`, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 300000,
    });
  } catch (e: any) {
    const status = e?.response?.status;
    const detail = e?.response?.data?.detail || e.message;
    if (status === 400) {
      throw new Error(`[f5tts] Wrapper 请求错误: ${detail}`);
    }
    if (status === 502) {
      throw new Error(`[f5tts] Wrapper 无法连接 F5-TTS Gradio: ${detail}`);
    }
    if (status === 404) {
      throw new Error(`[f5tts] Wrapper endpoint not found (${wrapperUrl}/tts). Pastikan wrapper sudah jalan di port 5052.`);
    }
    throw new Error(`[f5tts] Wrapper 请求失败: ${detail}`);
  }

  // ===== Parse Response =====
  const data = resp.data;

  if (!data?.success) {
    throw new Error(`[f5tts] Wrapper 返回错误: ${data?.error || "unknown error"}`);
  }

  const audioBase64 = data.audioBase64;
  if (!audioBase64 || !audioBase64.startsWith("data:audio/")) {
    throw new Error("[f5tts] Wrapper 返回音频格式无效，未获取到有效的 data:audio/*;base64,...");
  }

  logger(`[f5tts] 语音合成成功! 音频长度: ${audioBase64.length}`);
  return audioBase64;
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
  return { hasUpdate: false, latestVersion: "2.1", notice: "" };
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
