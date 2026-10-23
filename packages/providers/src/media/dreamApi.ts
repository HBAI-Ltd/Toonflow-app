type DreamInput = ProviderMediaInputDefinition & {
  field: string;
  array?: boolean;
  fallback?: "images" | "videos" | "audios" | "firstFrame" | "lastFrame";
};

type DreamParameter = ProviderMediaParameterDefinition & {
  field?: string;
  path?: string[];
  includeDefault?: boolean;
  omitFalse?: boolean;
};

type DreamOperation = {
  id: string;
  label: string;
  type: "image" | "video" | "audio";
  endpoint: string;
  apiModel?: string;
  promptRequired?: boolean;
  promptSupported?: boolean;
  promptMaxLength?: number;
  promptField?: string;
  mode?: ProviderModel["mode"];
  inputs?: DreamInput[];
  parameters?: DreamParameter[];
  special?: "tryOn" | "seedance" | "videoComposite";
};

type DreamInputOptions = Partial<Pick<DreamInput, "required" | "minItems" | "maxItems" | "accept" | "array" | "fallback" | "fallbackIndex">>;
type DreamParameterOptions = Partial<Pick<DreamParameter,
  "required" | "allowCustom" | "options" | "min" | "max" | "step" | "defaultValue" | "field" | "path" | "includeDefault" | "omitFalse">>;

const acceptedMediaTypes: Record<DreamInput["mediaType"], string[]> = {
  image: ["image/png", "image/jpeg", "image/bmp", "image/webp", "image/gif"],
  video: ["video/mp4", "video/x-msvideo", "video/quicktime", "video/x-matroska", "video/webm"],
  audio: ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/aac", "audio/flac"],
};
const videoTranslateSourceLanguages = ["zh", "en", "ja", "id", "es", "pt", "de", "fr", "ko", "fil", "ms", "th", "ar", "it", "bn", "el", "nl", "ru", "tr", "vi", "pl", "ro", "ne", "uk", "yue"];
const videoTranslateTargetLanguages = ["zh", "en", "ja", "ko", "de", "fr", "it", "ru", "es", "pt", "pl", "nl", "hi", "id", "th", "vi", "ms", "ar", "el"];

function input(id: string, label: string, mediaType: DreamInput["mediaType"], field: string, options: DreamInputOptions = {}): DreamInput {
  return { id, label, mediaType, field, accept: acceptedMediaTypes[mediaType], ...options };
}

function parameter(id: string, label: string, type: DreamParameter["type"], options: DreamParameterOptions = {}): DreamParameter {
  return { id, label, type, ...options };
}

const operations: DreamOperation[] = [
  {
    id: "fluxTextToImage", label: "Flux 文生图", type: "image", endpoint: "/api/async/flux_text2image",
    mode: ["text"], promptRequired: true,
    parameters: [
      parameter("width", "宽度", "number", { min: 16, max: 1600, step: 16, defaultValue: 1024, includeDefault: true }),
      parameter("height", "高度", "number", { min: 16, max: 1600, step: 16, defaultValue: 1024, includeDefault: true }),
      parameter("num", "生成数量", "number", { min: 1, max: 10, step: 1 }),
      parameter("seed", "随机种子", "number", { step: 1 }),
    ],
  },
  {
    id: "fluxImageToImage", label: "Flux 图生图", type: "image", endpoint: "/api/async/flux_image2image",
    mode: ["singleImage"], promptRequired: true,
    inputs: [input("image", "参考图片", "image", "imageUrl", { required: true, minItems: 1, maxItems: 1, fallback: "images" })],
    parameters: [
      parameter("width", "宽度", "number", { min: 16, max: 1600, step: 16, defaultValue: 1024, includeDefault: true }),
      parameter("height", "高度", "number", { min: 16, max: 1600, step: 16, defaultValue: 1024, includeDefault: true }),
      parameter("num", "生成数量", "number", { min: 1, max: 10, step: 1 }),
      parameter("seed", "随机种子", "number", { step: 1 }),
    ],
  },
  {
    id: "dreamImage20", label: "DreamImage 2.0", type: "image", endpoint: "/api/async/dreamimage_2.0",
    mode: ["singleImage"], promptRequired: true,
    inputs: [input("sourceImage", "待编辑图片", "image", "image", { required: true, minItems: 1, maxItems: 1 })],
  },
  { id: "colorize", label: "黑白照片上色", type: "image", endpoint: "/api/async/colorize", mode: ["singleImage"], promptRequired: false, promptSupported: false,
    inputs: [input("sourceImage", "待上色图片", "image", "url", { required: true, minItems: 1, maxItems: 1 })] },
  { id: "enhanceImage", label: "图片增强", type: "image", endpoint: "/api/async/enhance", mode: ["singleImage"], promptRequired: false, promptSupported: false,
    inputs: [input("sourceImage", "待增强图片", "image", "imageUrl", { required: true, minItems: 1, maxItems: 1 })] },
  { id: "outpainting", label: "图片扩图", type: "image", endpoint: "/api/async/outpainting", mode: ["singleImage"], promptRequired: false, promptSupported: false,
    inputs: [input("sourceImage", "原始图片", "image", "url", { required: true, minItems: 1, maxItems: 1 })],
    parameters: [
      parameter("left", "向左扩展像素", "number", { min: 0, step: 1, defaultValue: 0, includeDefault: true, path: ["outPaintSize", "left"] }),
      parameter("right", "向右扩展像素", "number", { min: 0, step: 1, defaultValue: 0, includeDefault: true, path: ["outPaintSize", "right"] }),
      parameter("top", "向上扩展像素", "number", { min: 0, step: 1, defaultValue: 0, includeDefault: true, path: ["outPaintSize", "top"] }),
      parameter("bottom", "向下扩展像素", "number", { min: 0, step: 1, defaultValue: 0, includeDefault: true, path: ["outPaintSize", "bottom"] }),
    ] },
  { id: "swapFaceImage", label: "图片换脸", type: "image", endpoint: "/api/async/swap_face", mode: ["multiReference"], promptRequired: false, promptSupported: false,
    inputs: [
      input("targetImage", "目标图片", "image", "url", { required: true, minItems: 1, maxItems: 1 }),
      input("faceImage", "人脸图片", "image", "faceImgUrl", { required: true, minItems: 1, maxItems: 1 }),
    ] },
  { id: "removeBackground", label: "图片抠像", type: "image", endpoint: "/api/async/remove_background", mode: ["singleImage"], promptRequired: false, promptSupported: false,
    inputs: [input("sourceImage", "待抠像图片", "image", "url", { required: true, minItems: 1, maxItems: 1 })] },
  { id: "virtualTryOn", label: "虚拟试衣", type: "image", endpoint: "/api/async/tryon_clothes", mode: ["multiReference"], promptRequired: false,
    inputs: [
      input("modelImage", "人物图片", "image", "modelImage", { required: true, minItems: 1, maxItems: 1 }),
      input("upperGarment", "上装图片", "image", "upperClothes", { maxItems: 1 }),
      input("lowerGarment", "下装图片", "image", "lowerClothes", { maxItems: 1 }),
      input("onePieceGarment", "连衣裙/连体装图片", "image", "overallClothes", { maxItems: 1 }),
    ],
    parameters: [
      parameter("enableShoes", "生成鞋子", "boolean", { defaultValue: false, omitFalse: true }),
      parameter("width", "输出宽度", "number", { min: 1, step: 1 }),
      parameter("height", "输出高度", "number", { min: 1, step: 1 }),
    ], special: "tryOn" },
  ...[
    { id: "seedream40", label: "Seedream 4.0", apiModel: "seedream-4.0", sizes: ["1K", "2K", "4K"] },
    { id: "seedream45", label: "Seedream 4.5", apiModel: "seedream-4.5", sizes: ["2K", "4K"] },
    { id: "seedream50Lite", label: "Seedream 5.0 Lite", apiModel: "seedream-5.0-lite", sizes: ["2K", "3K", "4K"] },
    { id: "seedream50Pro", label: "Seedream 5.0 Pro", apiModel: "seedream-5.0-pro", sizes: ["1K", "1.5K", "2K"] },
  ].map(({ id, label, apiModel, sizes }): DreamOperation => ({
    id, label, type: "image", endpoint: "/api/async/seedream", apiModel, mode: ["text", "multiReference"], promptRequired: true,
    inputs: [input("images", "参考图片（可选）", "image", "image", { array: true, maxItems: 10, fallback: "images" })],
    parameters: [parameter("size", "输出尺寸", "string", { options: sizes, allowCustom: true }), parameter("seed", "随机种子", "number", { step: 1 })],
  })),
  ...[
    { id: "nanoBanana2", label: "Nano Banana 2", apiModel: "gemini-3.1-flash-image-preview", imageSizes: ["512", "1K", "2K", "4K"] },
    { id: "nanoBananaPro", label: "Nano Banana Pro", apiModel: "gemini-3-pro-image-preview", imageSizes: ["1K", "2K"] },
  ].map(({ id, label, apiModel, imageSizes }): DreamOperation => ({
    id, label, type: "image", endpoint: "/api/async/google_gemini_image", apiModel, mode: ["text", "multiReference"], promptRequired: true,
    promptField: "text", inputs: [input("images", "参考图片（可选）", "image", "images", { array: true, fallback: "images" })],
    parameters: [parameter("imageSize", "输出尺寸", "string", { options: imageSizes }), parameter("aspectRatio", "画面比例", "string")],
  })),
  { id: "gptImage2", label: "GPT Image 2", type: "image", endpoint: "/api/async/gpt_image", mode: ["text", "multiReference"], promptRequired: true, promptMaxLength: 4000,
    inputs: [input("images", "参考图片（可选）", "image", "images", { array: true, maxItems: 4, fallback: "images" })],
    parameters: [
      parameter("width", "宽度", "number", { min: 16, max: 3840, step: 16, defaultValue: 1024, includeDefault: true }),
      parameter("height", "高度", "number", { min: 16, max: 3840, step: 16, defaultValue: 1024, includeDefault: true }),
      parameter("quality", "画质", "string", { options: ["low", "medium", "high"], defaultValue: "low", includeDefault: true }),
      parameter("n", "生成数量", "number", { min: 1, max: 10, step: 1, defaultValue: 1, includeDefault: true }),
    ] },
  ...[
    { id: "gptImage25FlareTextToImage", label: "GPT Image 2.5 Flare 文生图", route: "flare/text_to_image", withImages: false },
    { id: "gptImage25FlareImageToImage", label: "GPT Image 2.5 Flare 图生图", route: "flare/image_to_image", withImages: true },
    { id: "gptImage25SunburstTextToImage", label: "GPT Image 2.5 Sunburst 文生图", route: "sunburst/text_to_image", withImages: false },
    { id: "gptImage25SunburstImageToImage", label: "GPT Image 2.5 Sunburst 图生图", route: "sunburst/image_to_image", withImages: true },
  ].map(({ id, label, route, withImages }): DreamOperation => ({
    id, label, type: "image", endpoint: `/api/async/gpt_image_2.5/${route}`, mode: withImages ? ["singleImage"] : ["text"], promptRequired: true, promptMaxLength: 4000,
    ...(withImages ? { inputs: [input("images", "参考图片", "image", "images", { required: true, minItems: 1, maxItems: 4, array: true, fallback: "images" })] } : {}),
    parameters: [
      parameter("width", "宽度", "number", { min: 16, max: 3840, step: 16, defaultValue: 1024, includeDefault: true }),
      parameter("height", "高度", "number", { min: 16, max: 3840, step: 16, defaultValue: 1024, includeDefault: true }),
      parameter("quality", "画质", "string", { options: ["low", "medium", "high", "xhigh", "max"], defaultValue: "low", includeDefault: true }),
      parameter("n", "生成数量", "number", { min: 1, max: 10, step: 1, defaultValue: 1, includeDefault: true }),
    ],
  })),
  { id: "wan21TextToVideo", label: "Wan 2.1 文生视频", type: "video", endpoint: "/api/async/wan/text_to_video/2.1", mode: ["text"], promptRequired: true, promptMaxLength: 1500,
    parameters: [parameter("resolution", "分辨率", "string", { options: ["480p", "720p"] })] },
  { id: "wan21ImageToVideo", label: "Wan 2.1 图生视频", type: "video", endpoint: "/api/async/wan/image_to_video/2.1", mode: ["singleImage"], promptRequired: true, promptMaxLength: 1500,
    inputs: [input("sourceImage", "首帧图片", "image", "image", { required: true, minItems: 1, maxItems: 1, fallback: "images" })],
    parameters: [parameter("resolution", "分辨率", "string", { options: ["480p", "720p"] })] },
  { id: "wan21HeadTailToVideo", label: "Wan 2.1 首尾帧视频", type: "video", endpoint: "/api/async/wan/head_tail_to_video/2.1", mode: ["startEndRequired"], promptRequired: true, promptMaxLength: 1500,
    inputs: [
      input("firstFrame", "首帧图片", "image", "firstImage", { required: true, minItems: 1, maxItems: 1, fallback: "images", fallbackIndex: 0 }),
      input("lastFrame", "尾帧图片", "image", "lastImage", { required: true, minItems: 1, maxItems: 1, fallback: "images", fallbackIndex: 1 }),
    ] },
  { id: "dreamVideo30TextToVideo", label: "DreamVideo 3.0 文生视频", type: "video", endpoint: "/api/async/dreamvideo_3.0/text_to_video", mode: ["text"], promptRequired: true,
    parameters: [
      parameter("duration", "时长（秒）", "number", { min: 3, max: 15, step: 1 }),
      parameter("resolution", "分辨率", "string", { options: ["480P", "720P"] }),
      parameter("aspectRatio", "画面比例", "string", { options: ["auto", "9:16", "3:4", "1:1", "4:3", "16:9"] }),
      parameter("seed", "随机种子", "number", { step: 1 }),
    ] },
  { id: "dreamVideo30ImageToVideo", label: "DreamVideo 3.0 图生视频", type: "video", endpoint: "/api/async/dreamvideo_3.0/image_to_video", mode: ["singleImage"], promptRequired: true,
    inputs: [input("images", "首帧/尾帧图片", "image", "images", { required: true, minItems: 1, maxItems: 2, array: true, fallback: "images" })],
    parameters: [
      parameter("duration", "时长（秒）", "number", { min: 3, max: 15, step: 1 }),
      parameter("resolution", "分辨率", "string", { options: ["480P", "720P"] }),
      parameter("aspectRatio", "画面比例", "string", { options: ["auto", "9:16", "3:4", "1:1", "4:3", "16:9"] }),
      parameter("seed", "随机种子", "number", { step: 1 }),
    ] },
  {
    id: "seedance25", label: "Seedance 2.5", type: "video", endpoint: "/api/async/seedance_2.5", apiModel: "seedance-2.5",
    mode: ["text", "singleImage", "startEndRequired", "endFrameOptional", ["imageReference:9", "videoReference:10", "audioReference:3"]], promptRequired: true, promptMaxLength: 1500, special: "seedance",
    inputs: [
      input("images", "参考图片", "image", "images", { array: true, maxItems: 9, fallback: "images" }),
      input("firstFrame", "首帧图片", "image", "imageUrl", { maxItems: 1, fallback: "firstFrame" }),
      input("lastFrame", "尾帧图片", "image", "endImageUrl", { maxItems: 1, fallback: "lastFrame" }),
      input("videos", "参考视频", "video", "videos", { array: true, maxItems: 10, fallback: "videos" }),
      input("audios", "参考音频", "audio", "audios", { array: true, maxItems: 3, fallback: "audios" }),
    ],
    parameters: [
      parameter("resolution", "分辨率", "string", { required: true, options: ["480p", "720p", "1080p"] }),
      parameter("duration", "时长（秒）", "number", { required: true, min: 4, max: 30, step: 1 }),
      parameter("ratio", "画面比例", "string", { defaultValue: "adaptive", includeDefault: true }),
      parameter("seed", "随机种子", "number", { step: 1 }),
      parameter("generateAudio", "生成视频声音", "boolean", { defaultValue: false, omitFalse: true }),
      parameter("omniReferenceTaskType", "参考视频任务模式", "string", { options: ["reference", "edit", "extend"] }),
    ],
  },
  ...[
    { id: "seedance20", label: "Seedance 2.0", apiModel: "seedance-2.0", resolution: ["480p", "720p", "1080p", "4k"], durationMax: 15, videoMax: 3 },
    { id: "seedance20Mini", label: "Seedance 2.0 Mini", apiModel: "seedance-2.0-mini", resolution: ["480p", "720p"], durationMax: 15, videoMax: 3 },
  ].map(({ id, label, apiModel, resolution, durationMax, videoMax }): DreamOperation => ({
    id, label, type: "video", endpoint: "/api/async/seedance_2.0", apiModel,
    mode: ["text", "singleImage", "startEndRequired", "endFrameOptional", ["imageReference:9", `videoReference:${videoMax}`, "audioReference:3"]], promptRequired: true, promptMaxLength: 1500, special: "seedance",
    inputs: [
      input("images", "参考图片", "image", "images", { array: true, maxItems: 9, fallback: "images" }),
      input("firstFrame", "首帧图片", "image", "imageUrl", { maxItems: 1, fallback: "firstFrame" }),
      input("lastFrame", "尾帧图片", "image", "endImageUrl", { maxItems: 1, fallback: "lastFrame" }),
      input("videos", "参考视频", "video", "videos", { array: true, maxItems: videoMax, fallback: "videos" }),
      input("audios", "参考音频", "audio", "audios", { array: true, maxItems: 3, fallback: "audios" }),
    ],
    parameters: [
      parameter("resolution", "分辨率", "string", { required: true, options: resolution }),
      parameter("duration", "时长（秒）", "number", { required: true, min: 4, max: durationMax, step: 1 }),
      parameter("ratio", "画面比例", "string", { defaultValue: "adaptive", includeDefault: true }),
      parameter("seed", "随机种子", "number", { step: 1 }),
      parameter("generateAudio", "生成视频声音", "boolean", { defaultValue: false, omitFalse: true }),
    ],
  })),
  {
    id: "lipSync", label: "LipSync", type: "video", endpoint: "/api/async/lipsync", mode: ["multiReference"], promptRequired: false, promptSupported: false,
    inputs: [
      input("sourceVideo", "源视频", "video", "srcVideoUrl", { required: true, minItems: 1, maxItems: 1, fallback: "videos" }),
      input("audio", "驱动音频", "audio", "audioUrl", { required: true, minItems: 1, maxItems: 1, fallback: "audios" }),
    ],
    parameters: [
      parameter("videoWidth", "输出宽度（0 保持原尺寸）", "number", { min: 0, step: 1, defaultValue: 0, includeDefault: true, path: ["videoParams", "video_width"] }),
      parameter("videoHeight", "输出高度（0 保持原尺寸）", "number", { min: 0, step: 1, defaultValue: 0, includeDefault: true, path: ["videoParams", "video_height"] }),
      parameter("videoEnhance", "画质增强", "boolean", { defaultValue: false, includeDefault: true, path: ["videoParams", "video_enhance"] }),
    ],
  },
  {
    id: "lipSync20", label: "LipSync 2.0", type: "video", endpoint: "/api/async/lipsync/2.0", mode: ["multiReference"], promptRequired: false, promptSupported: false,
    inputs: [
      input("sourceVideo", "源视频", "video", "srcVideoUrl", { required: true, minItems: 1, maxItems: 1, fallback: "videos" }),
      input("audio", "原始音频", "audio", "audioUrl", { required: true, minItems: 1, maxItems: 1, fallback: "audios" }),
      input("vocalAudio", "人声分离音频（可选）", "audio", "vocalAudioUrl", { maxItems: 1 }),
    ],
    parameters: [
      parameter("videoWidth", "输出宽度（0 保持原尺寸）", "number", { min: 0, step: 1, defaultValue: 0, includeDefault: true, path: ["videoParams", "video_width"] }),
      parameter("videoHeight", "输出高度（0 保持原尺寸）", "number", { min: 0, step: 1, defaultValue: 0, includeDefault: true, path: ["videoParams", "video_height"] }),
      parameter("videoEnhanceLevel", "增强等级", "number", { min: 0, max: 1, step: 1, defaultValue: 1, path: ["videoParams", "video_enhance"] }),
      parameter("fps", "帧率", "string", { options: ["25", "original"] }),
    ],
  },
  {
    id: "dreamAvatar30Fast", label: "DreamAvatar 3.0 Fast", type: "video", endpoint: "/api/async/dreamavatar/image_to_video/3.0fast", mode: ["multiReference"], promptRequired: true,
    inputs: [
      input("portrait", "人物肖像图片", "image", "image", { required: true, minItems: 1, maxItems: 1, fallback: "images" }),
      input("audio", "驱动音频", "audio", "audio", { required: true, minItems: 1, maxItems: 1, fallback: "audios" }),
    ],
    parameters: [parameter("resolution", "分辨率", "string", { options: ["480p", "720p"] })],
  },
  {
    id: "dreamact", label: "Dreamact 动作迁移", type: "video", endpoint: "/api/async/wan/dreamact/2.1", mode: ["multiReference"], promptRequired: false, promptSupported: false,
    inputs: [
      input("drivingVideo", "动作驱动视频", "video", "video", { required: true, minItems: 1, maxItems: 1, fallback: "videos", fallbackIndex: 0 }),
      input("referenceImages", "角色参考图片", "image", "images", { required: true, minItems: 1, array: true, fallback: "images" }),
    ],
    parameters: [
      parameter("seed", "随机种子", "number", { step: 1 }),
      parameter("resolution", "分辨率", "string", { options: ["480P", "720P"] }),
      parameter("taskMode", "动作模式", "string", { options: ["replace_body", "pose2v"] }),
      parameter("qualityMode", "质量模式", "string", { options: ["high", "base"] }),
    ],
  },
  { id: "swapFaceVideo", label: "视频换脸", type: "video", endpoint: "/api/async/swap_face_for_video", mode: ["multiReference"], promptRequired: false, promptSupported: false,
    inputs: [
      input("sourceVideo", "源视频", "video", "srcVideoUrl", { required: true, minItems: 1, maxItems: 1, fallback: "videos", fallbackIndex: 0 }),
      input("faceImage", "人脸图片", "image", "srcImgUrl", { required: true, minItems: 1, maxItems: 1, fallback: "images", fallbackIndex: 0 }),
    ] },
  { id: "videoMatting", label: "视频抠像", type: "video", endpoint: "/api/async/image_matting_process_video", mode: ["singleImage"], promptRequired: false, promptSupported: false,
    inputs: [input("sourceVideo", "源视频", "video", "srcFileUrl", { required: true, minItems: 1, maxItems: 1, fallback: "videos", fallbackIndex: 0, accept: ["video/mp4"] })],
    parameters: [parameter("bitRate", "目标码率", "string"), parameter("removeColorSpill", "去除边缘色溢", "boolean", { omitFalse: true })] },
  {
    id: "compositeAfterMatting", label: "视频抠像背景合成", type: "video", endpoint: "/api/async/image_matting_composite_video", mode: ["multiReference"], promptRequired: false, promptSupported: false, special: "videoComposite",
    inputs: [
      input("sourceVideo", "原始视频（节点连线第 1 个视频）", "video", "srcFileUrl", { required: true, minItems: 1, maxItems: 1, fallback: "videos", fallbackIndex: 0 }),
      input("alphaVideo", "Alpha 抠像视频（节点连线第 2 个视频）", "video", "mattingAlphaFileUrl", { required: true, minItems: 1, maxItems: 1, fallback: "videos", fallbackIndex: 1 }),
      input("backgroundImage", "背景图片（背景类型为 image 时）", "image", "backgroundFileUrl", { maxItems: 1, fallback: "images", fallbackIndex: 0 }),
      input("backgroundVideo", "背景视频（背景类型为 video 时）", "video", "backgroundFileUrl", { maxItems: 1, fallback: "videos", fallbackIndex: 2 }),
    ],
    parameters: [parameter("backgroundType", "背景类型", "string", { required: true, options: ["color", "image", "video"] }), parameter("backgroundColor", "背景颜色（十六进制）", "string")],
  },
  { id: "videoWatermarkRemover", label: "视频去水印", type: "video", endpoint: "/api/async/video_watermark_remover", mode: ["singleImage"], promptRequired: false,
    inputs: [input("sourceVideo", "待处理视频", "video", "video", { required: true, minItems: 1, maxItems: 1, fallback: "videos", fallbackIndex: 0 })],
    parameters: [parameter("seed", "随机种子", "number", { step: 1 })] },
  { id: "videoEnhance", label: "视频增强", type: "video", endpoint: "/api/async/video_super_resolution", mode: ["singleImage"], promptRequired: false, promptSupported: false,
    inputs: [input("sourceVideo", "待增强视频", "video", "srcVideoUrl", { required: true, minItems: 1, maxItems: 1, fallback: "videos", fallbackIndex: 0 })] },
  { id: "videoTranslate20", label: "Video Translate 2.0", type: "video", endpoint: "/api/async/video_translate/2.0", mode: ["singleImage"], promptRequired: false, promptSupported: false,
    inputs: [input("sourceVideo", "待翻译视频", "video", "videoUrl", { required: true, minItems: 1, maxItems: 1, fallback: "videos", fallbackIndex: 0 })],
    parameters: [
      parameter("sourceLanguage", "原语言", "string", { required: true, options: videoTranslateSourceLanguages }),
      parameter("targetLanguage", "目标语言", "string", { required: true, options: videoTranslateTargetLanguages }),
      parameter("enableLipSync", "启用口型同步", "boolean", { defaultValue: true, includeDefault: true }),
    ] },
  { id: "ttsClone", label: "TTS Clone", type: "audio", endpoint: "/api/async/do_tts_clone", promptRequired: true, promptField: "text",
    parameters: [parameter("cloneId", "已创建的音色 cloneId", "string", { required: true }), parameter("language", "语种代码", "string", { required: true, field: "lan" })] },
  { id: "ttsCommon", label: "TTS Common", type: "audio", endpoint: "/api/async/do_tts_common", promptRequired: true, promptField: "text",
    parameters: [parameter("audioId", "有效的 Common 音色 ID", "string", { required: true }), parameter("language", "语种代码", "string", { required: true, field: "lan" })] },
  { id: "ttsPro", label: "TTS Pro", type: "audio", endpoint: "/api/async/do_tts_pro", promptRequired: true, promptField: "text",
    parameters: [parameter("audioId", "有效的 Pro 音色 ID", "string", { required: true }), parameter("language", "语种代码", "string", { required: true, field: "lan" })] },
];

const rules = [
  {
    type: "input",
    field: "apiKey" as const,
    title: "DreamAPI API Key",
    value: "",
    props: { type: "password", showPassword: true, autocomplete: "off" },
  },
] as const;

const apiBaseUrl = "https://api.newportai.com";
const pollEndpoint = "/api/getAsyncResult";
const uploadExtensions: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/bmp": "bmp", "image/webp": "webp", "image/gif": "gif",
  "audio/mpeg": "mp3", "audio/wav": "wav", "audio/mp4": "m4a", "audio/aac": "aac", "audio/flac": "flac",
  "video/mp4": "mp4", "video/x-msvideo": "avi", "video/quicktime": "mov", "video/x-matroska": "mkv", "video/webm": "webm",
};

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("DreamAPI 响应格式错误");
  return value as Record<string, unknown>;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function getApiKey(context: ProviderContext) {
  const value = typeof context.config.apiKey === "string" ? context.config.apiKey.trim().replace(/^Bearer\s+/i, "").trim() : "";
  if (!value) throw new Error("请先在媒体模型设置中配置 DreamAPI API Key");
  return value;
}

async function postJson(context: ProviderContext, path: string, body: Record<string, unknown>, apiKey: string, signal: AbortSignal) {
  let response: Response;
  try {
    response = await context.tool.fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (cause) {
    throw Object.assign(new Error("DreamAPI 网络请求失败"), { cause, transport: true });
  }
  let payload: Record<string, unknown>;
  try { payload = object(await response.json()); }
  catch { throw Object.assign(new Error(`DreamAPI 响应无法解析（HTTP ${response.status}）`), { status: response.status }); }
  if (!response.ok) {
    const detail = context.tool.errorMessage(payload);
    throw Object.assign(new Error(`DreamAPI 请求失败（HTTP ${response.status}）${detail ? `：${detail}` : ""}`), { status: response.status });
  }
  if (payload.code !== 0) {
    const code = typeof payload.code === "number" || typeof payload.code === "string" ? String(payload.code) : "unknown";
    const detail = context.tool.errorMessage(payload) || "请求未成功";
    throw new Error(`DreamAPI 错误 ${code}：${detail}`);
  }
  return object(payload.data);
}

function makeMultipart(fields: [string, string][], fileName: string, mimeType: string, fileBytes: Uint8Array) {
  const boundary = `----toonflowDreamApi${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  for (const [name, value] of fields) {
    chunks.push(encoder.encode(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
  }
  chunks.push(encoder.encode(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`));
  chunks.push(new Uint8Array(fileBytes));
  chunks.push(encoder.encode(`\r\n--${boundary}--\r\n`));
  const size = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { boundary, body: new Blob([bytes.buffer]) };
}

async function uploadInput(context: ProviderContext, source: MediaInput, apiKey: string, signal: AbortSignal): Promise<string> {
  if (source.type === "url") {
    let url: URL;
    try { url = new URL(source.url); }
    catch { throw new Error("参考素材地址无效"); }
    if (url.protocol !== "https:") throw new Error("参考素材地址必须使用 HTTPS");
    return url.href;
  }
  const mimeType = source.mimeType.split(";")[0]!.trim().toLowerCase();
  const extension = uploadExtensions[mimeType];
  if (!extension) throw new Error(`DreamAPI 上传不支持此素材格式（${mimeType || "未知"}）`);
  const fileBytes = source.type === "binary" ? new Uint8Array(source.data) : Buffer.from(source.data.replace(/^data:[^;,]+;base64,/i, ""), "base64");
  if (!fileBytes.byteLength) throw new Error("参考素材为空");
  const fileName = `toonflow-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const policy = await postJson(context, "/api/file/v1/get_policy", { scene: "Dream-CN" }, apiKey, signal);
  const hostValue = typeof policy.host === "string" ? policy.host : "";
  let host: URL;
  try { host = new URL(hostValue); }
  catch { throw new Error("DreamAPI 上传策略未返回有效地址"); }
  if (host.protocol !== "https:" || host.username || host.password || !host.hostname.toLowerCase().endsWith(".aliyuncs.com")) throw new Error("DreamAPI 上传策略地址不安全");
  const accessId = typeof policy.accessId === "string" ? policy.accessId : typeof policy.OSSAccessKeyId === "string" ? policy.OSSAccessKeyId : "";
  const fullKey = typeof policy.key === "string" ? policy.key : "";
  const directory = typeof policy.dir === "string" ? policy.dir : "";
  const key = fullKey || (directory ? `${directory}${fileName}` : "");
  const uploadPolicy = typeof policy.policy === "string" ? policy.policy : "";
  const signature = typeof policy.signature === "string" ? policy.signature : "";
  const callback = typeof policy.callback === "string" ? policy.callback : "";
  const policyRequestId = typeof policy.reqId === "string" ? policy.reqId : "";
  if (!key || !accessId || !uploadPolicy || !signature) throw new Error("DreamAPI 上传策略字段不完整");
  const multipart = makeMultipart([
    ["key", key], ["policy", uploadPolicy], ["OSSAccessKeyId", accessId], ["signature", signature],
    ["callback", callback], ["success_action_status", "200"],
  ], fileName, mimeType, fileBytes);
  const uploaded = await context.tool.fetch(host.href, {
    method: "POST",
    headers: { "Content-Type": `multipart/form-data; boundary=${multipart.boundary}` },
    body: multipart.body,
    signal,
    redirect: "error",
  });
  if (!uploaded.ok) throw new Error(`DreamAPI 素材上传失败（HTTP ${uploaded.status}）`);
  let uploadPayload: Record<string, unknown>;
  try { uploadPayload = object(await uploaded.json()); }
  catch { throw new Error("DreamAPI 素材上传确认失败"); }
  const uploadData = record(uploadPayload.data);
  const reqId = typeof uploadData.reqId === "string" ? uploadData.reqId : policyRequestId;
  if (!reqId) throw new Error("DreamAPI 上传确认缺少请求 ID");
  const finished = await postJson(context, "/api/file/v1/policy_upload_finish", { reqId }, apiKey, signal);
  const url = typeof finished.url === "string" ? finished.url : "";
  if (!/^https:\/\//i.test(url)) throw new Error("DreamAPI 上传完成后未返回有效素材地址");
  return url;
}

function pause(signal: AbortSignal, milliseconds: number) {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
    };
    const abort = () => {
      finish();
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      finish();
      resolve();
    }, milliseconds);
    signal.addEventListener("abort", abort, { once: true });
  });
}

async function pollTask(context: ProviderContext, taskId: string, apiKey: string, signal: AbortSignal) {
  const deadline = Date.now() + 30 * 60_000;
  let retryDelay = 1000;
  while (Date.now() < deadline) {
    await pause(signal, 5000);
    let result: Record<string, unknown>;
    try { result = await postJson(context, pollEndpoint, { taskId }, apiKey, signal); }
    catch (error) {
      const status = Number((error as { status?: unknown })?.status);
      const transient = (error as { transport?: unknown })?.transport === true || status === 429 || status >= 500;
      if (!transient) throw error;
      await pause(signal, Math.min(retryDelay, Math.max(1, deadline - Date.now())));
      retryDelay = Math.min(retryDelay * 2, 15000);
      continue;
    }
    retryDelay = 1000;
    const task = record(result.task);
    const status = Number(task.status);
    if (status === 3) return result;
    if (status === 4) {
      const errorCode = task.errorCode === undefined ? "unknown" : String(task.errorCode);
      const reason = typeof task.reason === "string" ? context.tool.errorMessage(task.reason) : "任务失败";
      throw new Error(`DreamAPI 任务失败（${errorCode}，taskId ${taskId}）：${reason || "请检查输入素材或参数"}`);
    }
  }
  throw new Error(`DreamAPI 任务等待超过 30 分钟，状态可能仍未结束；请先确认此任务状态，直接重试可能重复计费（taskId ${taskId}）`);
}

function mediaAssets(result: Record<string, unknown>, operation: DreamOperation): MediaAsset[] {
  const mediaType = operation.type;
  const field = mediaType === "image" ? "images" : mediaType === "video" ? "videos" : "audios";
  const urlField = mediaType === "image" ? "imageUrl" : mediaType === "video" ? "videoUrl" : "audioUrl";
  const assets: MediaAsset[] = [];
  const seen = new Set<string>();
  const add = (value: unknown) => {
    const url = typeof value === "string" ? value : "";
    if (/^https:\/\//i.test(url) && !seen.has(url)) {
      seen.add(url);
      assets.push({ type: "url", url, mediaType });
    }
  };
  const matting = record(result.mattingResult);
  if (operation.id === "videoMatting") {
    add(matting.mattingFileUrl);
    add(matting.mattingAlphaFileUrl);
    return assets;
  }
  if (operation.id === "compositeAfterMatting") add(matting.compositeFileUrl);
  const items = Array.isArray(result[field]) ? result[field] : [];
  for (const item of items) add(record(item)[urlField]);
  if (mediaType === "video") {
    add(matting.mattingFileUrl);
    add(matting.compositeFileUrl);
  }
  return assets;
}

function findOperation(id: string, type: DreamOperation["type"]) {
  const operation = operations.find(item => item.id === id && item.type === type);
  if (!operation) throw new Error("所选 DreamAPI 模型不存在或类型不匹配");
  return operation;
}

function legacyInput(request: ImageRequest & VideoRequest & AudioRequest, definition: DreamInput): MediaInput[] | undefined {
  if (definition.fallback === "firstFrame") return request.firstFrame ? [request.firstFrame] : undefined;
  if (definition.fallback === "lastFrame") return request.lastFrame ? [request.lastFrame] : undefined;
  const value = definition.fallback ? request[definition.fallback] : undefined;
  if (!Array.isArray(value)) return undefined;
  if (definition.fallbackIndex !== undefined) return value[definition.fallbackIndex] ? [value[definition.fallbackIndex]!] : undefined;
  return value;
}

function selectedInputs(operation: DreamOperation, request: ImageRequest | VideoRequest | AudioRequest) {
  const supplied = record(request.inputs);
  const typedRequest = request as ImageRequest & VideoRequest & AudioRequest;
  for (const key of Object.keys(supplied)) {
    if (!operation.inputs?.some(item => item.id === key)) throw new Error(`DreamAPI 模型不接受输入角色 ${key}`);
    if (!Array.isArray(supplied[key])) throw new Error(`DreamAPI 输入角色 ${key} 必须是素材数组`);
  }
  const result = new Map<string, MediaInput[]>();
  for (const definition of operation.inputs ?? []) {
    const values = Object.hasOwn(supplied, definition.id)
      ? supplied[definition.id] as MediaInput[]
      : legacyInput(typedRequest, definition) ?? [];
    const minimum = definition.minItems ?? (definition.required ? 1 : 0);
    if (values.length < minimum) throw new Error(`请为“${definition.label}”提供至少 ${minimum} 个素材`);
    if (definition.maxItems !== undefined && values.length > definition.maxItems) throw new Error(`“${definition.label}”最多接受 ${definition.maxItems} 个素材`);
    for (const value of values) {
      if (!value || !["url", "base64", "binary"].includes(value.type) || value.mimeType && !value.mimeType.toLowerCase().startsWith(`${definition.mediaType}/`)) {
        throw new Error(`“${definition.label}”的素材类型不正确`);
      }
      if (definition.accept?.length && (!value.mimeType || !definition.accept.some(accepted => accepted.endsWith("/*")
        ? value.mimeType!.toLowerCase().startsWith(accepted.slice(0, -1).toLowerCase())
        : value.mimeType!.split(";")[0]!.trim().toLowerCase() === accepted.toLowerCase()))) {
        throw new Error(`“${definition.label}”仅支持 ${definition.accept.join("、")}`);
      }
    }
    result.set(definition.id, values);
  }
  return result;
}

function requestParameter(request: ImageRequest | VideoRequest | AudioRequest, item: DreamParameter) {
  const other = record(request.other);
  if (Object.hasOwn(other, item.id)) return other[item.id];
  const typedRequest = request as ImageRequest & VideoRequest & AudioRequest;
  const legacyField: Record<string, keyof (ImageRequest & VideoRequest & AudioRequest)> = {
    ratio: "ratio", resolution: "resolution", duration: "duration", generateAudio: "generateAudio",
    size: "size", quality: "quality", language: "language",
  };
  const legacy = legacyField[item.id] ? typedRequest[legacyField[item.id]!] : undefined;
  if (legacy !== undefined) return legacy;
  return item.defaultValue;
}

function validateParameter(item: DreamParameter, value: unknown) {
  if (value === undefined || value === null || value === "") {
    if (item.required) throw new Error(`DreamAPI 参数“${item.label}”为必填项`);
    return;
  }
  if (item.type === "string" && typeof value !== "string" || item.type === "number" && (typeof value !== "number" || !Number.isFinite(value)) || item.type === "boolean" && typeof value !== "boolean") {
    throw new Error(`DreamAPI 参数“${item.label}”的值类型不正确`);
  }
  if (typeof value === "number") {
    const stepOffset = value - (item.min ?? 0);
    if (item.min !== undefined && value < item.min || item.max !== undefined && value > item.max
      || item.step && Math.abs(stepOffset / item.step - Math.round(stepOffset / item.step)) > 1e-8) {
      throw new Error(`DreamAPI 参数“${item.label}”超出允许范围`);
    }
  }
  if (item.options?.length && !item.allowCustom && !item.options.includes(value as string | number)) throw new Error(`DreamAPI 参数“${item.label}”不在允许选项中`);
}

function validateOperation(operation: DreamOperation, request: ImageRequest | VideoRequest | AudioRequest, selected: Map<string, MediaInput[]>) {
  const prompt = typeof request.prompt === "string" ? request.prompt.trim() : "";
  if (operation.promptRequired !== false && !prompt) throw new Error("请输入生成提示词或待朗读文本");
  if (operation.promptMaxLength && prompt.length > operation.promptMaxLength) throw new Error(`提示词不能超过 ${operation.promptMaxLength} 个字符`);
  const other = record(request.other);
  const knownParameters = new Set((operation.parameters ?? []).map(item => item.id));
  for (const key of Object.keys(other)) if (!knownParameters.has(key)) throw new Error(`DreamAPI 模型不接受参数 ${key}`);
  const values = new Map<string, unknown>();
  for (const item of operation.parameters ?? []) {
    const value = requestParameter(request, item);
    validateParameter(item, value);
    if (value !== undefined && value !== null && value !== "") values.set(item.id, value);
  }
  if (operation.special === "tryOn") {
    const upper = selected.get("upperGarment")?.length ?? 0;
    const lower = selected.get("lowerGarment")?.length ?? 0;
    const onePiece = selected.get("onePieceGarment")?.length ?? 0;
    if (!upper && !lower && !onePiece) throw new Error("虚拟试衣至少需要一件上装、下装或连体服图片");
    if (onePiece && (upper || lower) || upper + lower > 2) throw new Error("连体服不能与上装或下装同时使用");
  }
  if (operation.special === "seedance") {
    if ((selected.get("lastFrame")?.length ?? 0) && !(selected.get("firstFrame")?.length ?? 0)) throw new Error("提供尾帧时必须同时提供首帧");
    const taskType = values.get("omniReferenceTaskType");
    if ((taskType === "edit" || taskType === "extend") && !(selected.get("videos")?.length ?? 0)) throw new Error("Seedance edit/extend 模式必须提供参考视频");
    if (taskType === "edit" || taskType === "extend") {
      const ratio = values.get("ratio") ?? "adaptive";
      if (ratio !== "adaptive") throw new Error("Seedance edit/extend 模式仅支持 adaptive 比例");
    }
  }
  if (operation.special === "videoComposite") {
    const backgroundType = values.get("backgroundType");
    const hasImage = (selected.get("backgroundImage")?.length ?? 0) > 0;
    const hasVideo = (selected.get("backgroundVideo")?.length ?? 0) > 0;
    if (backgroundType === "color" && (!values.get("backgroundColor") || hasImage || hasVideo)) throw new Error("纯色背景需要 backgroundColor，且不能同时提供图片或视频背景");
    if (backgroundType === "image" && (!hasImage || hasVideo)) throw new Error("图片背景类型必须且只能提供一张背景图片");
    if (backgroundType === "video" && (!hasVideo || hasImage)) throw new Error("视频背景类型必须且只能提供一个背景视频");
  }
  if (operation.id.startsWith("gptImage25")) {
    const width = values.get("width");
    const height = values.get("height");
    if (typeof width === "number" && typeof height === "number") {
      const pixels = width * height;
      if (pixels < 655360 || pixels > 8294400 || Math.max(width / height, height / width) > 3) {
        throw new Error("GPT Image 2.5 宽高需满足 655,360–8,294,400 像素且长宽比不超过 3:1");
      }
    }
  }
  if (operation.apiModel?.startsWith("seedream-")) {
    const size = values.get("size");
    if (typeof size === "string") validateSeedreamSize(operation.apiModel, size);
  }
  return values;
}

function validateSeedreamSize(model: string, value: string) {
  const normalized = value.trim().toUpperCase().replace(/\s/g, "");
  const tiers: Record<string, string[]> = {
    "seedream-5.0-pro": ["1K", "1.5K", "2K"], "seedream-5.0-lite": ["2K", "3K", "4K"],
    "seedream-4.5": ["2K", "4K"], "seedream-4.0": ["1K", "2K", "4K"],
  };
  if (tiers[model]?.includes(normalized)) return;
  const match = /^(\d{2,5})[X*×](\d{2,5})$/.exec(normalized);
  if (!match) throw new Error(`Seedream ${model} 不支持尺寸 ${value}`);
  const width = Number(match[1]);
  const height = Number(match[2]);
  const pixels = width * height;
  const minimum = model === "seedream-4.5" || model === "seedream-5.0-lite" ? 3686400 : 921600;
  const maximum = model === "seedream-5.0-pro" ? 4624220 : 16777216;
  if (pixels < minimum || pixels > maximum || width > height * 16 || height > width * 16) throw new Error(`Seedream ${model} 尺寸超出允许像素数或宽高比范围`);
}

function parameterBody(body: Record<string, unknown>, item: DreamParameter, value: unknown) {
  if (value === undefined || value === null || value === "" || item.omitFalse && value === false) return;
  const path = item.path ?? [item.field ?? item.id];
  let target = body;
  for (const part of path.slice(0, -1)) target = (target[part] ??= {}) as Record<string, unknown>;
  target[path.at(-1)!] = value;
}

async function buildBody(context: ProviderContext, operation: DreamOperation, request: ImageRequest | VideoRequest | AudioRequest,
  selected: Map<string, MediaInput[]>, values: Map<string, unknown>, apiKey: string, signal: AbortSignal) {
  const body: Record<string, unknown> = {};
  if (operation.apiModel) body.model = operation.apiModel;
  const prompt = typeof request.prompt === "string" ? request.prompt.trim() : "";
  const promptField = operation.promptField ?? "prompt";
  if (operation.promptSupported !== false && (prompt || operation.promptRequired !== false)) body[promptField] = prompt;
  for (const definition of operation.inputs ?? []) {
    const inputs = selected.get(definition.id) ?? [];
    if (!inputs.length) continue;
    const urls: string[] = [];
    for (const source of inputs) urls.push(await uploadInput(context, source, apiKey, signal));
    body[definition.field] = definition.array ? urls : urls[0];
  }
  for (const item of operation.parameters ?? []) parameterBody(body, item, values.get(item.id));
  if (operation.special === "seedance" && values.get("omniReferenceTaskType") !== undefined) body.omniReferenceTaskType = values.get("omniReferenceTaskType");
  return body;
}

async function generate(context: ProviderContext, mediaType: DreamOperation["type"], request: ImageRequest | VideoRequest | AudioRequest): Promise<MediaAsset[]> {
  const operation = findOperation(request.model, mediaType);
  const inputMap = selectedInputs(operation, request);
  const values = validateOperation(operation, request, inputMap);
  const apiKey = getApiKey(context);
  const signal = AbortSignal.any([AbortSignal.timeout(30 * 60_000), ...(context.signal ? [context.signal] : [])]);
  const body = await buildBody(context, operation, request, inputMap, values, apiKey, signal);
  signal.throwIfAborted();
  // ACT: only a single paid submission is made; transient failures retry the same task ID during polling.
  const submitted = await postJson(context, operation.endpoint, body, apiKey, signal);
  const taskId = typeof submitted.taskId === "string" ? submitted.taskId : "";
  if (!taskId) throw new Error("DreamAPI 提交成功响应中没有任务 ID");
  const result = await pollTask(context, taskId, apiKey, signal);
  const assets = mediaAssets(result, operation);
  if (!assets.length) throw new Error(`DreamAPI 任务 ${taskId} 成功，但没有返回${mediaType === "image" ? "图片" : mediaType === "video" ? "视频" : "音频"}文件`);
  return assets;
}

export default {
  id: "dreamApi",
  label: "DreamAPI",
  icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%232563eb'/%3E%3Cstop offset='1' stop-color='%237c3aed'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='16' fill='url(%23g)'/%3E%3Cpath d='M16 17h14c11 0 18 7 18 15s-7 15-18 15H16zm12 22c6 0 9-3 9-7s-3-7-9-7h-4v14z' fill='%23fff'/%3E%3Ccircle cx='47' cy='17' r='5' fill='%23a7f3d0'/%3E%3C/svg%3E",
  version: "1.0.0",
  rules,
  models: [
    {
      "id": "fluxTextToImage",
      "label": "Flux 文生图",
      "type": "image",
      "generation": {
        "promptRequired": true,
        "inputs": [],
        "parameters": [
          {
            "id": "width",
            "label": "宽度",
            "type": "number",
            "min": 16,
            "max": 1600,
            "step": 16,
            "defaultValue": 1024
          },
          {
            "id": "height",
            "label": "高度",
            "type": "number",
            "min": 16,
            "max": 1600,
            "step": 16,
            "defaultValue": 1024
          },
          {
            "id": "num",
            "label": "生成数量",
            "type": "number",
            "min": 1,
            "max": 10,
            "step": 1
          },
          {
            "id": "seed",
            "label": "随机种子",
            "type": "number",
            "step": 1
          }
        ]
      }
    },
    {
      "id": "fluxImageToImage",
      "label": "Flux 图生图",
      "type": "image",
      "generation": {
        "promptRequired": true,
        "inputs": [
          {
            "id": "image",
            "label": "参考图片",
            "mediaType": "image",
            "fallback": "images",
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": [
          {
            "id": "width",
            "label": "宽度",
            "type": "number",
            "min": 16,
            "max": 1600,
            "step": 16,
            "defaultValue": 1024
          },
          {
            "id": "height",
            "label": "高度",
            "type": "number",
            "min": 16,
            "max": 1600,
            "step": 16,
            "defaultValue": 1024
          },
          {
            "id": "num",
            "label": "生成数量",
            "type": "number",
            "min": 1,
            "max": 10,
            "step": 1
          },
          {
            "id": "seed",
            "label": "随机种子",
            "type": "number",
            "step": 1
          }
        ]
      }
    },
    {
      "id": "dreamImage20",
      "label": "DreamImage 2.0",
      "type": "image",
      "generation": {
        "promptRequired": true,
        "inputs": [
          {
            "id": "sourceImage",
            "label": "待编辑图片",
            "mediaType": "image",
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": []
      }
    },
    {
      "id": "colorize",
      "label": "黑白照片上色",
      "type": "image",
      "generation": {
        "promptRequired": false,
        "inputs": [
          {
            "id": "sourceImage",
            "label": "待上色图片",
            "mediaType": "image",
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": []
      }
    },
    {
      "id": "enhanceImage",
      "label": "图片增强",
      "type": "image",
      "generation": {
        "promptRequired": false,
        "inputs": [
          {
            "id": "sourceImage",
            "label": "待增强图片",
            "mediaType": "image",
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": []
      }
    },
    {
      "id": "outpainting",
      "label": "图片扩图",
      "type": "image",
      "generation": {
        "promptRequired": false,
        "inputs": [
          {
            "id": "sourceImage",
            "label": "原始图片",
            "mediaType": "image",
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": [
          {
            "id": "left",
            "label": "向左扩展像素",
            "type": "number",
            "min": 0,
            "step": 1,
            "defaultValue": 0
          },
          {
            "id": "right",
            "label": "向右扩展像素",
            "type": "number",
            "min": 0,
            "step": 1,
            "defaultValue": 0
          },
          {
            "id": "top",
            "label": "向上扩展像素",
            "type": "number",
            "min": 0,
            "step": 1,
            "defaultValue": 0
          },
          {
            "id": "bottom",
            "label": "向下扩展像素",
            "type": "number",
            "min": 0,
            "step": 1,
            "defaultValue": 0
          }
        ]
      }
    },
    {
      "id": "swapFaceImage",
      "label": "图片换脸",
      "type": "image",
      "generation": {
        "promptRequired": false,
        "inputs": [
          {
            "id": "targetImage",
            "label": "目标图片",
            "mediaType": "image",
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          },
          {
            "id": "faceImage",
            "label": "人脸图片",
            "mediaType": "image",
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": []
      }
    },
    {
      "id": "removeBackground",
      "label": "图片抠像",
      "type": "image",
      "generation": {
        "promptRequired": false,
        "inputs": [
          {
            "id": "sourceImage",
            "label": "待抠像图片",
            "mediaType": "image",
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": []
      }
    },
    {
      "id": "virtualTryOn",
      "label": "虚拟试衣",
      "type": "image",
      "generation": {
        "promptRequired": false,
        "inputs": [
          {
            "id": "modelImage",
            "label": "人物图片",
            "mediaType": "image",
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          },
          {
            "id": "upperGarment",
            "label": "上装图片",
            "mediaType": "image",
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          },
          {
            "id": "lowerGarment",
            "label": "下装图片",
            "mediaType": "image",
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          },
          {
            "id": "onePieceGarment",
            "label": "连衣裙/连体装图片",
            "mediaType": "image",
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": [
          {
            "id": "enableShoes",
            "label": "生成鞋子",
            "type": "boolean",
            "defaultValue": false
          },
          {
            "id": "width",
            "label": "输出宽度",
            "type": "number",
            "min": 1,
            "step": 1
          },
          {
            "id": "height",
            "label": "输出高度",
            "type": "number",
            "min": 1,
            "step": 1
          }
        ]
      }
    },
    {
      "id": "seedream40",
      "label": "Seedream 4.0",
      "type": "image",
      "generation": {
        "promptRequired": true,
        "inputs": [
          {
            "id": "images",
            "label": "参考图片（可选）",
            "mediaType": "image",
            "fallback": "images",
            "maxItems": 10,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": [
          {
            "id": "size",
            "label": "输出尺寸",
            "type": "string",
            "allowCustom": true,
            "options": [
              "1K",
              "2K",
              "4K"
            ]
          },
          {
            "id": "seed",
            "label": "随机种子",
            "type": "number",
            "step": 1
          }
        ]
      }
    },
    {
      "id": "seedream45",
      "label": "Seedream 4.5",
      "type": "image",
      "generation": {
        "promptRequired": true,
        "inputs": [
          {
            "id": "images",
            "label": "参考图片（可选）",
            "mediaType": "image",
            "fallback": "images",
            "maxItems": 10,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": [
          {
            "id": "size",
            "label": "输出尺寸",
            "type": "string",
            "allowCustom": true,
            "options": [
              "2K",
              "4K"
            ]
          },
          {
            "id": "seed",
            "label": "随机种子",
            "type": "number",
            "step": 1
          }
        ]
      }
    },
    {
      "id": "seedream50Lite",
      "label": "Seedream 5.0 Lite",
      "type": "image",
      "generation": {
        "promptRequired": true,
        "inputs": [
          {
            "id": "images",
            "label": "参考图片（可选）",
            "mediaType": "image",
            "fallback": "images",
            "maxItems": 10,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": [
          {
            "id": "size",
            "label": "输出尺寸",
            "type": "string",
            "allowCustom": true,
            "options": [
              "2K",
              "3K",
              "4K"
            ]
          },
          {
            "id": "seed",
            "label": "随机种子",
            "type": "number",
            "step": 1
          }
        ]
      }
    },
    {
      "id": "seedream50Pro",
      "label": "Seedream 5.0 Pro",
      "type": "image",
      "generation": {
        "promptRequired": true,
        "inputs": [
          {
            "id": "images",
            "label": "参考图片（可选）",
            "mediaType": "image",
            "fallback": "images",
            "maxItems": 10,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": [
          {
            "id": "size",
            "label": "输出尺寸",
            "type": "string",
            "allowCustom": true,
            "options": [
              "1K",
              "1.5K",
              "2K"
            ]
          },
          {
            "id": "seed",
            "label": "随机种子",
            "type": "number",
            "step": 1
          }
        ]
      }
    },
    {
      "id": "nanoBanana2",
      "label": "Nano Banana 2",
      "type": "image",
      "generation": {
        "promptRequired": true,
        "inputs": [
          {
            "id": "images",
            "label": "参考图片（可选）",
            "mediaType": "image",
            "fallback": "images",
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": [
          {
            "id": "imageSize",
            "label": "输出尺寸",
            "type": "string",
            "options": [
              "512",
              "1K",
              "2K",
              "4K"
            ]
          },
          {
            "id": "aspectRatio",
            "label": "画面比例",
            "type": "string"
          }
        ]
      }
    },
    {
      "id": "nanoBananaPro",
      "label": "Nano Banana Pro",
      "type": "image",
      "generation": {
        "promptRequired": true,
        "inputs": [
          {
            "id": "images",
            "label": "参考图片（可选）",
            "mediaType": "image",
            "fallback": "images",
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": [
          {
            "id": "imageSize",
            "label": "输出尺寸",
            "type": "string",
            "options": [
              "1K",
              "2K"
            ]
          },
          {
            "id": "aspectRatio",
            "label": "画面比例",
            "type": "string"
          }
        ]
      }
    },
    {
      "id": "gptImage2",
      "label": "GPT Image 2",
      "type": "image",
      "generation": {
        "promptRequired": true,
        "promptMaxLength": 4000,
        "inputs": [
          {
            "id": "images",
            "label": "参考图片（可选）",
            "mediaType": "image",
            "fallback": "images",
            "maxItems": 4,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": [
          {
            "id": "width",
            "label": "宽度",
            "type": "number",
            "min": 16,
            "max": 3840,
            "step": 16,
            "defaultValue": 1024
          },
          {
            "id": "height",
            "label": "高度",
            "type": "number",
            "min": 16,
            "max": 3840,
            "step": 16,
            "defaultValue": 1024
          },
          {
            "id": "quality",
            "label": "画质",
            "type": "string",
            "options": [
              "low",
              "medium",
              "high"
            ],
            "defaultValue": "low"
          },
          {
            "id": "n",
            "label": "生成数量",
            "type": "number",
            "min": 1,
            "max": 10,
            "step": 1,
            "defaultValue": 1
          }
        ]
      }
    },
    {
      "id": "gptImage25FlareTextToImage",
      "label": "GPT Image 2.5 Flare 文生图",
      "type": "image",
      "generation": {
        "promptRequired": true,
        "promptMaxLength": 4000,
        "inputs": [],
        "parameters": [
          {
            "id": "width",
            "label": "宽度",
            "type": "number",
            "min": 16,
            "max": 3840,
            "step": 16,
            "defaultValue": 1024
          },
          {
            "id": "height",
            "label": "高度",
            "type": "number",
            "min": 16,
            "max": 3840,
            "step": 16,
            "defaultValue": 1024
          },
          {
            "id": "quality",
            "label": "画质",
            "type": "string",
            "options": [
              "low",
              "medium",
              "high",
              "xhigh",
              "max"
            ],
            "defaultValue": "low"
          },
          {
            "id": "n",
            "label": "生成数量",
            "type": "number",
            "min": 1,
            "max": 10,
            "step": 1,
            "defaultValue": 1
          }
        ]
      }
    },
    {
      "id": "gptImage25FlareImageToImage",
      "label": "GPT Image 2.5 Flare 图生图",
      "type": "image",
      "generation": {
        "promptRequired": true,
        "promptMaxLength": 4000,
        "inputs": [
          {
            "id": "images",
            "label": "参考图片",
            "mediaType": "image",
            "fallback": "images",
            "required": true,
            "minItems": 1,
            "maxItems": 4,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": [
          {
            "id": "width",
            "label": "宽度",
            "type": "number",
            "min": 16,
            "max": 3840,
            "step": 16,
            "defaultValue": 1024
          },
          {
            "id": "height",
            "label": "高度",
            "type": "number",
            "min": 16,
            "max": 3840,
            "step": 16,
            "defaultValue": 1024
          },
          {
            "id": "quality",
            "label": "画质",
            "type": "string",
            "options": [
              "low",
              "medium",
              "high",
              "xhigh",
              "max"
            ],
            "defaultValue": "low"
          },
          {
            "id": "n",
            "label": "生成数量",
            "type": "number",
            "min": 1,
            "max": 10,
            "step": 1,
            "defaultValue": 1
          }
        ]
      }
    },
    {
      "id": "gptImage25SunburstTextToImage",
      "label": "GPT Image 2.5 Sunburst 文生图",
      "type": "image",
      "generation": {
        "promptRequired": true,
        "promptMaxLength": 4000,
        "inputs": [],
        "parameters": [
          {
            "id": "width",
            "label": "宽度",
            "type": "number",
            "min": 16,
            "max": 3840,
            "step": 16,
            "defaultValue": 1024
          },
          {
            "id": "height",
            "label": "高度",
            "type": "number",
            "min": 16,
            "max": 3840,
            "step": 16,
            "defaultValue": 1024
          },
          {
            "id": "quality",
            "label": "画质",
            "type": "string",
            "options": [
              "low",
              "medium",
              "high",
              "xhigh",
              "max"
            ],
            "defaultValue": "low"
          },
          {
            "id": "n",
            "label": "生成数量",
            "type": "number",
            "min": 1,
            "max": 10,
            "step": 1,
            "defaultValue": 1
          }
        ]
      }
    },
    {
      "id": "gptImage25SunburstImageToImage",
      "label": "GPT Image 2.5 Sunburst 图生图",
      "type": "image",
      "generation": {
        "promptRequired": true,
        "promptMaxLength": 4000,
        "inputs": [
          {
            "id": "images",
            "label": "参考图片",
            "mediaType": "image",
            "fallback": "images",
            "required": true,
            "minItems": 1,
            "maxItems": 4,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": [
          {
            "id": "width",
            "label": "宽度",
            "type": "number",
            "min": 16,
            "max": 3840,
            "step": 16,
            "defaultValue": 1024
          },
          {
            "id": "height",
            "label": "高度",
            "type": "number",
            "min": 16,
            "max": 3840,
            "step": 16,
            "defaultValue": 1024
          },
          {
            "id": "quality",
            "label": "画质",
            "type": "string",
            "options": [
              "low",
              "medium",
              "high",
              "xhigh",
              "max"
            ],
            "defaultValue": "low"
          },
          {
            "id": "n",
            "label": "生成数量",
            "type": "number",
            "min": 1,
            "max": 10,
            "step": 1,
            "defaultValue": 1
          }
        ]
      }
    },
    {
      "id": "wan21TextToVideo",
      "label": "Wan 2.1 文生视频",
      "type": "video",
      "generation": {
        "promptRequired": true,
        "promptMaxLength": 1500,
        "inputs": [],
        "parameters": [
          {
            "id": "resolution",
            "label": "分辨率",
            "type": "string",
            "options": [
              "480p",
              "720p"
            ]
          }
        ]
      }
    },
    {
      "id": "wan21ImageToVideo",
      "label": "Wan 2.1 图生视频",
      "type": "video",
      "generation": {
        "promptRequired": true,
        "promptMaxLength": 1500,
        "inputs": [
          {
            "id": "sourceImage",
            "label": "首帧图片",
            "mediaType": "image",
            "fallback": "images",
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": [
          {
            "id": "resolution",
            "label": "分辨率",
            "type": "string",
            "options": [
              "480p",
              "720p"
            ]
          }
        ]
      }
    },
    {
      "id": "wan21HeadTailToVideo",
      "label": "Wan 2.1 首尾帧视频",
      "type": "video",
      "generation": {
        "promptRequired": true,
        "promptMaxLength": 1500,
        "inputs": [
          {
            "id": "firstFrame",
            "label": "首帧图片",
            "mediaType": "image",
            "fallback": "images",
            "fallbackIndex": 0,
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          },
          {
            "id": "lastFrame",
            "label": "尾帧图片",
            "mediaType": "image",
            "fallback": "images",
            "fallbackIndex": 1,
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": []
      }
    },
    {
      "id": "dreamVideo30TextToVideo",
      "label": "DreamVideo 3.0 文生视频",
      "type": "video",
      "generation": {
        "promptRequired": true,
        "inputs": [],
        "parameters": [
          {
            "id": "duration",
            "label": "时长（秒）",
            "type": "number",
            "min": 3,
            "max": 15,
            "step": 1
          },
          {
            "id": "resolution",
            "label": "分辨率",
            "type": "string",
            "options": [
              "480P",
              "720P"
            ]
          },
          {
            "id": "aspectRatio",
            "label": "画面比例",
            "type": "string",
            "options": [
              "auto",
              "9:16",
              "3:4",
              "1:1",
              "4:3",
              "16:9"
            ]
          },
          {
            "id": "seed",
            "label": "随机种子",
            "type": "number",
            "step": 1
          }
        ]
      }
    },
    {
      "id": "dreamVideo30ImageToVideo",
      "label": "DreamVideo 3.0 图生视频",
      "type": "video",
      "generation": {
        "promptRequired": true,
        "inputs": [
          {
            "id": "images",
            "label": "首帧/尾帧图片",
            "mediaType": "image",
            "fallback": "images",
            "required": true,
            "minItems": 1,
            "maxItems": 2,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": [
          {
            "id": "duration",
            "label": "时长（秒）",
            "type": "number",
            "min": 3,
            "max": 15,
            "step": 1
          },
          {
            "id": "resolution",
            "label": "分辨率",
            "type": "string",
            "options": [
              "480P",
              "720P"
            ]
          },
          {
            "id": "aspectRatio",
            "label": "画面比例",
            "type": "string",
            "options": [
              "auto",
              "9:16",
              "3:4",
              "1:1",
              "4:3",
              "16:9"
            ]
          },
          {
            "id": "seed",
            "label": "随机种子",
            "type": "number",
            "step": 1
          }
        ]
      }
    },
    {
      "id": "seedance25",
      "label": "Seedance 2.5",
      "type": "video",
      "mode": ["text", "singleImage", "startEndRequired", "endFrameOptional", ["imageReference:9", "videoReference:10", "audioReference:3"]],
      "generation": {
        "promptRequired": true,
        "promptMaxLength": 1500,
        "inputs": [
          {
            "id": "images",
            "label": "参考图片",
            "mediaType": "image",
            "fallback": "images",
            "maxItems": 9,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          },
          {
            "id": "firstFrame",
            "label": "首帧图片",
            "mediaType": "image",
            "fallback": "firstFrame",
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          },
          {
            "id": "lastFrame",
            "label": "尾帧图片",
            "mediaType": "image",
            "fallback": "lastFrame",
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          },
          {
            "id": "videos",
            "label": "参考视频",
            "mediaType": "video",
            "fallback": "videos",
            "maxItems": 10,
            "accept": [
              "video/mp4"
            ]
          },
          {
            "id": "audios",
            "label": "参考音频",
            "mediaType": "audio",
            "fallback": "audios",
            "maxItems": 3,
            "accept": [
              "audio/mpeg",
              "audio/wav",
              "audio/x-wav",
              "audio/mp4",
              "audio/aac",
              "audio/flac"
            ]
          }
        ],
        "parameters": [
          {
            "id": "resolution",
            "label": "分辨率",
            "type": "string",
            "required": true,
            "options": [
              "480p",
              "720p",
              "1080p"
            ]
          },
          {
            "id": "duration",
            "label": "时长（秒）",
            "type": "number",
            "required": true,
            "min": 4,
            "max": 30,
            "step": 1
          },
          {
            "id": "ratio",
            "label": "画面比例",
            "type": "string",
            "defaultValue": "adaptive"
          },
          {
            "id": "seed",
            "label": "随机种子",
            "type": "number",
            "step": 1
          },
          {
            "id": "generateAudio",
            "label": "生成视频声音",
            "type": "boolean",
            "defaultValue": false
          },
          {
            "id": "omniReferenceTaskType",
            "label": "参考视频任务模式",
            "type": "string",
            "options": [
              "reference",
              "edit",
              "extend"
            ]
          }
        ]
      }
    },
    {
      "id": "seedance20",
      "label": "Seedance 2.0",
      "type": "video",
      "mode": ["text", "singleImage", "startEndRequired", "endFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      "generation": {
        "promptRequired": true,
        "promptMaxLength": 1500,
        "inputs": [
          {
            "id": "images",
            "label": "参考图片",
            "mediaType": "image",
            "fallback": "images",
            "maxItems": 9,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          },
          {
            "id": "firstFrame",
            "label": "首帧图片",
            "mediaType": "image",
            "fallback": "firstFrame",
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          },
          {
            "id": "lastFrame",
            "label": "尾帧图片",
            "mediaType": "image",
            "fallback": "lastFrame",
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          },
          {
            "id": "videos",
            "label": "参考视频",
            "mediaType": "video",
            "fallback": "videos",
            "maxItems": 3,
            "accept": [
              "video/mp4",
              "video/x-msvideo",
              "video/quicktime",
              "video/x-matroska",
              "video/webm"
            ]
          },
          {
            "id": "audios",
            "label": "参考音频",
            "mediaType": "audio",
            "fallback": "audios",
            "maxItems": 3,
            "accept": [
              "audio/mpeg",
              "audio/wav",
              "audio/x-wav",
              "audio/mp4",
              "audio/aac",
              "audio/flac"
            ]
          }
        ],
        "parameters": [
          {
            "id": "resolution",
            "label": "分辨率",
            "type": "string",
            "required": true,
            "options": [
              "480p",
              "720p",
              "1080p",
              "4k"
            ]
          },
          {
            "id": "duration",
            "label": "时长（秒）",
            "type": "number",
            "required": true,
            "min": 4,
            "max": 15,
            "step": 1
          },
          {
            "id": "ratio",
            "label": "画面比例",
            "type": "string",
            "defaultValue": "adaptive"
          },
          {
            "id": "seed",
            "label": "随机种子",
            "type": "number",
            "step": 1
          },
          {
            "id": "generateAudio",
            "label": "生成视频声音",
            "type": "boolean",
            "defaultValue": false
          }
        ]
      }
    },
    {
      "id": "seedance20Mini",
      "label": "Seedance 2.0 Mini",
      "type": "video",
      "mode": ["text", "singleImage", "startEndRequired", "endFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      "generation": {
        "promptRequired": true,
        "promptMaxLength": 1500,
        "inputs": [
          {
            "id": "images",
            "label": "参考图片",
            "mediaType": "image",
            "fallback": "images",
            "maxItems": 9,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          },
          {
            "id": "firstFrame",
            "label": "首帧图片",
            "mediaType": "image",
            "fallback": "firstFrame",
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          },
          {
            "id": "lastFrame",
            "label": "尾帧图片",
            "mediaType": "image",
            "fallback": "lastFrame",
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          },
          {
            "id": "videos",
            "label": "参考视频",
            "mediaType": "video",
            "fallback": "videos",
            "maxItems": 3,
            "accept": [
              "video/mp4",
              "video/x-msvideo",
              "video/quicktime",
              "video/x-matroska",
              "video/webm"
            ]
          },
          {
            "id": "audios",
            "label": "参考音频",
            "mediaType": "audio",
            "fallback": "audios",
            "maxItems": 3,
            "accept": [
              "audio/mpeg",
              "audio/wav",
              "audio/x-wav",
              "audio/mp4",
              "audio/aac",
              "audio/flac"
            ]
          }
        ],
        "parameters": [
          {
            "id": "resolution",
            "label": "分辨率",
            "type": "string",
            "required": true,
            "options": [
              "480p",
              "720p"
            ]
          },
          {
            "id": "duration",
            "label": "时长（秒）",
            "type": "number",
            "required": true,
            "min": 4,
            "max": 15,
            "step": 1
          },
          {
            "id": "ratio",
            "label": "画面比例",
            "type": "string",
            "defaultValue": "adaptive"
          },
          {
            "id": "seed",
            "label": "随机种子",
            "type": "number",
            "step": 1
          },
          {
            "id": "generateAudio",
            "label": "生成视频声音",
            "type": "boolean",
            "defaultValue": false
          }
        ]
      }
    },
    {
      "id": "lipSync",
      "label": "LipSync",
      "type": "video",
      "generation": {
        "promptRequired": false,
        "inputs": [
          {
            "id": "sourceVideo",
            "label": "源视频",
            "mediaType": "video",
            "fallback": "videos",
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "video/mp4",
              "video/x-msvideo",
              "video/quicktime",
              "video/x-matroska",
              "video/webm"
            ]
          },
          {
            "id": "audio",
            "label": "驱动音频",
            "mediaType": "audio",
            "fallback": "audios",
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "audio/mpeg",
              "audio/wav",
              "audio/x-wav",
              "audio/mp4",
              "audio/aac",
              "audio/flac"
            ]
          }
        ],
        "parameters": [
          {
            "id": "videoWidth",
            "label": "输出宽度（0 保持原尺寸）",
            "type": "number",
            "min": 0,
            "step": 1,
            "defaultValue": 0
          },
          {
            "id": "videoHeight",
            "label": "输出高度（0 保持原尺寸）",
            "type": "number",
            "min": 0,
            "step": 1,
            "defaultValue": 0
          },
          {
            "id": "videoEnhance",
            "label": "画质增强",
            "type": "boolean",
            "defaultValue": false
          }
        ]
      }
    },
    {
      "id": "lipSync20",
      "label": "LipSync 2.0",
      "type": "video",
      "generation": {
        "promptRequired": false,
        "inputs": [
          {
            "id": "sourceVideo",
            "label": "源视频",
            "mediaType": "video",
            "fallback": "videos",
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "video/mp4",
              "video/x-msvideo",
              "video/quicktime",
              "video/x-matroska",
              "video/webm"
            ]
          },
          {
            "id": "audio",
            "label": "原始音频",
            "mediaType": "audio",
            "fallback": "audios",
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "audio/mpeg",
              "audio/wav",
              "audio/x-wav",
              "audio/mp4",
              "audio/aac",
              "audio/flac"
            ]
          },
          {
            "id": "vocalAudio",
            "label": "人声分离音频（可选）",
            "mediaType": "audio",
            "maxItems": 1,
            "accept": [
              "audio/mpeg",
              "audio/wav",
              "audio/x-wav",
              "audio/mp4",
              "audio/aac",
              "audio/flac"
            ]
          }
        ],
        "parameters": [
          {
            "id": "videoWidth",
            "label": "输出宽度（0 保持原尺寸）",
            "type": "number",
            "min": 0,
            "step": 1,
            "defaultValue": 0
          },
          {
            "id": "videoHeight",
            "label": "输出高度（0 保持原尺寸）",
            "type": "number",
            "min": 0,
            "step": 1,
            "defaultValue": 0
          },
          {
            "id": "videoEnhanceLevel",
            "label": "增强等级",
            "type": "number",
            "min": 0,
            "max": 1,
            "step": 1,
            "defaultValue": 1
          },
          {
            "id": "fps",
            "label": "帧率",
            "type": "string",
            "options": [
              "25",
              "original"
            ]
          }
        ]
      }
    },
    {
      "id": "dreamAvatar30Fast",
      "label": "DreamAvatar 3.0 Fast",
      "type": "video",
      "generation": {
        "promptRequired": true,
        "inputs": [
          {
            "id": "portrait",
            "label": "人物肖像图片",
            "mediaType": "image",
            "fallback": "images",
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          },
          {
            "id": "audio",
            "label": "驱动音频",
            "mediaType": "audio",
            "fallback": "audios",
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "audio/mpeg",
              "audio/wav",
              "audio/x-wav",
              "audio/mp4",
              "audio/aac",
              "audio/flac"
            ]
          }
        ],
        "parameters": [
          {
            "id": "resolution",
            "label": "分辨率",
            "type": "string",
            "options": [
              "480p",
              "720p"
            ]
          }
        ]
      }
    },
    {
      "id": "dreamact",
      "label": "Dreamact 动作迁移",
      "type": "video",
      "generation": {
        "promptRequired": false,
        "inputs": [
          {
            "id": "drivingVideo",
            "label": "动作驱动视频",
            "mediaType": "video",
            "fallback": "videos",
            "fallbackIndex": 0,
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "video/mp4",
              "video/x-msvideo",
              "video/quicktime",
              "video/x-matroska",
              "video/webm"
            ]
          },
          {
            "id": "referenceImages",
            "label": "角色参考图片",
            "mediaType": "image",
            "fallback": "images",
            "required": true,
            "minItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": [
          {
            "id": "seed",
            "label": "随机种子",
            "type": "number",
            "step": 1
          },
          {
            "id": "resolution",
            "label": "分辨率",
            "type": "string",
            "options": [
              "480P",
              "720P"
            ]
          },
          {
            "id": "taskMode",
            "label": "动作模式",
            "type": "string",
            "options": [
              "replace_body",
              "pose2v"
            ]
          },
          {
            "id": "qualityMode",
            "label": "质量模式",
            "type": "string",
            "options": [
              "high",
              "base"
            ]
          }
        ]
      }
    },
    {
      "id": "swapFaceVideo",
      "label": "视频换脸",
      "type": "video",
      "generation": {
        "promptRequired": false,
        "inputs": [
          {
            "id": "sourceVideo",
            "label": "源视频",
            "mediaType": "video",
            "fallback": "videos",
            "fallbackIndex": 0,
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "video/mp4",
              "video/x-msvideo",
              "video/quicktime",
              "video/x-matroska",
              "video/webm"
            ]
          },
          {
            "id": "faceImage",
            "label": "人脸图片",
            "mediaType": "image",
            "fallback": "images",
            "fallbackIndex": 0,
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          }
        ],
        "parameters": []
      }
    },
    {
      "id": "videoMatting",
      "label": "视频抠像",
      "type": "video",
      "generation": {
        "promptRequired": false,
        "inputs": [
          {
            "id": "sourceVideo",
            "label": "源视频",
            "mediaType": "video",
            "fallback": "videos",
            "fallbackIndex": 0,
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "video/mp4"
            ]
          }
        ],
        "parameters": [
          {
            "id": "bitRate",
            "label": "目标码率",
            "type": "string"
          },
          {
            "id": "removeColorSpill",
            "label": "去除边缘色溢",
            "type": "boolean"
          }
        ]
      }
    },
    {
      "id": "compositeAfterMatting",
      "label": "视频抠像背景合成",
      "type": "video",
      "generation": {
        "promptRequired": false,
        "inputs": [
          {
            "id": "sourceVideo",
            "label": "原始视频（节点连线第 1 个视频）",
            "mediaType": "video",
            "fallback": "videos",
            "fallbackIndex": 0,
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "video/mp4",
              "video/x-msvideo",
              "video/quicktime",
              "video/x-matroska",
              "video/webm"
            ]
          },
          {
            "id": "alphaVideo",
            "label": "Alpha 抠像视频（节点连线第 2 个视频）",
            "mediaType": "video",
            "fallback": "videos",
            "fallbackIndex": 1,
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "video/mp4",
              "video/x-msvideo",
              "video/quicktime",
              "video/x-matroska",
              "video/webm"
            ]
          },
          {
            "id": "backgroundImage",
            "label": "背景图片（背景类型为 image 时）",
            "mediaType": "image",
            "fallback": "images",
            "fallbackIndex": 0,
            "maxItems": 1,
            "accept": [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/webp",
              "image/gif"
            ]
          },
          {
            "id": "backgroundVideo",
            "label": "背景视频（背景类型为 video 时）",
            "mediaType": "video",
            "fallback": "videos",
            "fallbackIndex": 2,
            "maxItems": 1,
            "accept": [
              "video/mp4",
              "video/x-msvideo",
              "video/quicktime",
              "video/x-matroska",
              "video/webm"
            ]
          }
        ],
        "parameters": [
          {
            "id": "backgroundType",
            "label": "背景类型",
            "type": "string",
            "required": true,
            "options": [
              "color",
              "image",
              "video"
            ]
          },
          {
            "id": "backgroundColor",
            "label": "背景颜色（十六进制）",
            "type": "string"
          }
        ]
      }
    },
    {
      "id": "videoWatermarkRemover",
      "label": "视频去水印",
      "type": "video",
      "generation": {
        "promptRequired": false,
        "inputs": [
          {
            "id": "sourceVideo",
            "label": "待处理视频",
            "mediaType": "video",
            "fallback": "videos",
            "fallbackIndex": 0,
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "video/mp4",
              "video/x-msvideo",
              "video/quicktime",
              "video/x-matroska",
              "video/webm"
            ]
          }
        ],
        "parameters": [
          {
            "id": "seed",
            "label": "随机种子",
            "type": "number",
            "step": 1
          }
        ]
      }
    },
    {
      "id": "videoEnhance",
      "label": "视频增强",
      "type": "video",
      "generation": {
        "promptRequired": false,
        "inputs": [
          {
            "id": "sourceVideo",
            "label": "待增强视频",
            "mediaType": "video",
            "fallback": "videos",
            "fallbackIndex": 0,
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "video/mp4",
              "video/x-msvideo",
              "video/quicktime",
              "video/x-matroska",
              "video/webm"
            ]
          }
        ],
        "parameters": []
      }
    },
    {
      "id": "videoTranslate20",
      "label": "Video Translate 2.0",
      "type": "video",
      "generation": {
        "promptRequired": false,
        "inputs": [
          {
            "id": "sourceVideo",
            "label": "待翻译视频",
            "mediaType": "video",
            "fallback": "videos",
            "fallbackIndex": 0,
            "required": true,
            "minItems": 1,
            "maxItems": 1,
            "accept": [
              "video/mp4",
              "video/x-msvideo",
              "video/quicktime",
              "video/x-matroska",
              "video/webm"
            ]
          }
        ],
        "parameters": [
          {
            "id": "sourceLanguage",
            "label": "原语言",
            "type": "string",
            "required": true,
            "options": [
              "zh",
              "en",
              "ja",
              "id",
              "es",
              "pt",
              "de",
              "fr",
              "ko",
              "fil",
              "ms",
              "th",
              "ar",
              "it",
              "bn",
              "el",
              "nl",
              "ru",
              "tr",
              "vi",
              "pl",
              "ro",
              "ne",
              "uk",
              "yue"
            ]
          },
          {
            "id": "targetLanguage",
            "label": "目标语言",
            "type": "string",
            "required": true,
            "options": [
              "zh",
              "en",
              "ja",
              "ko",
              "de",
              "fr",
              "it",
              "ru",
              "es",
              "pt",
              "pl",
              "nl",
              "hi",
              "id",
              "th",
              "vi",
              "ms",
              "ar",
              "el"
            ]
          },
          {
            "id": "enableLipSync",
            "label": "启用口型同步",
            "type": "boolean",
            "defaultValue": true
          }
        ]
      }
    },
    {
      "id": "ttsClone",
      "label": "TTS Clone",
      "type": "audio",
      "generation": {
        "promptRequired": true,
        "inputs": [],
        "parameters": [
          {
            "id": "cloneId",
            "label": "已创建的音色 cloneId",
            "type": "string",
            "required": true
          },
          {
            "id": "language",
            "label": "语种代码",
            "type": "string",
            "required": true
          }
        ]
      }
    },
    {
      "id": "ttsCommon",
      "label": "TTS Common",
      "type": "audio",
      "generation": {
        "promptRequired": true,
        "inputs": [],
        "parameters": [
          {
            "id": "audioId",
            "label": "有效的 Common 音色 ID",
            "type": "string",
            "required": true
          },
          {
            "id": "language",
            "label": "语种代码",
            "type": "string",
            "required": true
          }
        ]
      }
    },
    {
      "id": "ttsPro",
      "label": "TTS Pro",
      "type": "audio",
      "generation": {
        "promptRequired": true,
        "inputs": [],
        "parameters": [
          {
            "id": "audioId",
            "label": "有效的 Pro 音色 ID",
            "type": "string",
            "required": true
          },
          {
            "id": "language",
            "label": "语种代码",
            "type": "string",
            "required": true
          }
        ]
      }
    }
  ],
  async generateImage(this: ProviderContext, request: ImageRequest) { return generate(this, "image", request); },
  async generateVideo(this: ProviderContext, request: VideoRequest) { return generate(this, "video", request); },
  async generateAudio(this: ProviderContext, request: AudioRequest) { return generate(this, "audio", request); },
} satisfies ProviderDefinition;
