import { markMessages } from "@toonflow/i18n";
import type { LocalModelItem } from "@/types/localModels";
import { githubSources, huggingFaceSources, modelScopeSource } from "@/utils/localModel/assets/sources";
import { mattingNormalAssets } from "@/utils/localModel/assets/mattingNormals";
import { deepFilterAssets } from "@/utils/localModel/assets/speech";
import { videoProductionAssets } from "@/utils/localModel/assets/videoProduction";

export type ModelAsset = Omit<LocalModelItem, "installed" | "installing" | "canRun" | "remoteAvailable" | "requiredAssetIds" | "progress"> & { sha256: string };


function anime4k(id: string, displayName: string, channels: number, size: number, sha256: string): ModelAsset {
  const fileName = `cnn-${channels}.bin`;
  return { id, name: "Anime4K", displayName, version: `CNN-${channels}`, fileName, size, sha256,
    sources: [
      { id: "artplayer", label: "ArtPlayer", url: `https://artplayer.org/upscaler/weights/${fileName}` },
      { id: "upscaleX", label: "UpscaleX", url: `https://upscalex.video/weights/${fileName}` },
    ] };
}

function mediaPipe(id: string, name: string, displayName: string, task: string, model: string, size: number, sha256: string, repo: string, revision: string): ModelAsset {
  const fileName = `${model}.tflite`;
  const url = `https://storage.googleapis.com/mediapipe-models/${task}/${model}/float16/1/${fileName}`;
  return { id, name, displayName, version: "1", fileName, size, sha256,
    sources: [modelScopeSource(repo, revision, fileName), { id: "mediapipe", label: "Google MediaPipe", url }] };
}

// Anime4K、MediaPipe 的 SHA-256 来自 ArtPlayer 的资源清单，其余使用固定版本的 Git LFS 对象摘要。
export const modelAssets: ModelAsset[] = [
  ...mattingNormalAssets, ...videoProductionAssets, ...deepFilterAssets,
  { id: "teed", name: "TEED", displayName: markMessages("画面轮廓与线稿提取"), version: "BIPED", fileName: "teed.onnx", size: 252280,
    sha256: "0ad443441475c06192309b0649b86ab6e6c1cc88cc6441e08ce7a6afa2c3e78c",
    sources: huggingFaceSources("5atoya/asciiartme-models", "fbf65632d589b434eeb1a110783e2208b19e4c69", "teed.onnx") },
  { id: "animeFace", name: "Anime Face Segmentation", displayName: markMessages("动漫人脸分区蒙版"), version: "U-Net", fileName: "face_unet.onnx", size: 6209211,
    sha256: "acc4b2c0a246a93bb643c8f626ebf4042e1113657fcc22d6286a79f74e656efe",
    sources: huggingFaceSources("5atoya/asciiartme-models", "fbf65632d589b434eeb1a110783e2208b19e4c69", "face_unet.onnx") },
  { id: "palmDetection", name: "MediaPipe Palm Detection", displayName: markMessages("手掌定位"), version: "2023.02", fileName: "palm_detection_mediapipe_2023feb.onnx", size: 3905734,
    sha256: "78ff51c38496b7fc8b8ebdb6cc8c1abb02fa6c38427c6848254cdaba57fcce7c",
    sources: huggingFaceSources("opencv/palm_detection_mediapipe", "233e619dcea1759bf6de707b9b904fe30881ea55", "palm_detection_mediapipe_2023feb.onnx") },
  { id: "handPose", name: "MediaPipe Hand Landmarks", displayName: markMessages("手部姿势骨架"), version: "2023.02", fileName: "handpose_estimation_mediapipe_2023feb.onnx", size: 4099621,
    sha256: "db0898ae717b76b075d9bf563af315b29562e11f8df5027a1ef07b02bef6d81c",
    sources: huggingFaceSources("opencv/handpose_estimation_mediapipe", "4b2a0b446e5cf2f11fb6b2c7251091c035d2c1f7", "handpose_estimation_mediapipe_2023feb.onnx") },
  ...(process.platform === "win32" && process.arch === "x64" ? [{ id: "whisperRuntime", name: "whisper.cpp", displayName: markMessages("离线字幕运行库"), version: "1.8.2", fileName: "whisper-bin-x64.zip", size: 3832432,
    sha256: "b1514ebc099765e39fa37eb780b92a140a94c86bb0b3b3d98226b38825979732", sources: githubSources("ggml-org/whisper.cpp", "v1.8.2", "whisper-bin-x64.zip") }] : []),
  anime4k("anime4kFast", markMessages("动漫画质增强（快速）"), 8, 34865, "3292fbd7ab62c862bd44e59b3aa3e69bed51f6d90441f5d8c904c400c7842b00"),
  anime4k("anime4kBalanced", markMessages("动漫画质增强（均衡）"), 16, 124893, "f5d1c334dd486640c562fc6390cb89a6258f1c057d58fd8d56c36d18ac1c3cf1"),
  anime4k("anime4kQuality", markMessages("动漫画质增强（高质量）"), 28, 363615, "a809e0b639a7a3ede91c288d9fbf608b73c979802eae7b144ae9305551b5cd07"),
  { id: "rife", name: "RIFE", displayName: markMessages("视频补帧"), version: "4.25 Lite", fileName: "rife_v425lite.onnx", size: 22677513,
    sha256: "702802d0862ab78f2d72133c6bc3768e7e89b81756f7cd51d1055a2fe3d06577",
    sources: huggingFaceSources("t9749/rife-4.25-lite-onnx", "8d1488a82e19fd2f2ca5b3ee1d1bfacd6787b9df", "rife_v425lite.onnx", "hfMirrorNet") },
  mediaPipe("faceDetection", "MediaPipe BlazeFace", markMessages("人脸检测与跟踪"), "face_detector", "blaze_face_short_range", 229746, "b4578f35940bf5a1a655214a1cce5cab13eba73c1297cd78e1a04c2380b0152f",
    "litert-community/MediaPipe-FaceDetector-BlazeFace-Short-Range", "4f42ad448c71f18f53c2422c48d68621c8531330"),
  mediaPipe("personSegmentation", "MediaPipe Selfie Segmenter", markMessages("人像背景分割"), "image_segmenter", "selfie_segmenter_landscape", 250177, "490e9ea734313e0de10fa0cd9e3c6133e36ea4db2b7a49bde9ef019f72796b8e",
    "litert-community/MediaPipe-ImageSegmenter-Selfie-Landscape", "98372afed0cb0f30edb898198849e8446ec985be"),
  { id: "realEsrgan", name: "Real-ESRGAN", displayName: markMessages("图片与视频高清放大"), version: "×4", fileName: "realesrgan-x4.onnx", size: 67051787,
    sha256: "fa18ce70de3a55f3149d0cc898d335d2d69fca29edc0692cb362c856b2942c3f",
    sources: huggingFaceSources("imgdesignart/realesrgan-x4-onnx", "138909edd364e7da67b5803c3918281e0428d19b", "onnx/model.onnx", "hfMirrorNet") },
  { id: "depthAnything", name: "Depth Anything", displayName: markMessages("图片深度估计"), version: "V2 Small", fileName: "depth_anything_v2_vits.onnx", size: 99060839,
    sha256: "afb6a5c28f3b6bf1618c6e43f02073ef9dfdc70e937502d51603e57b0a1df10c",
    sources: huggingFaceSources("onnx-community/depth-anything-v2-small", "4472b7362082ad9968fee890ca0f1e5aca36b93d", "onnx/model.onnx",
      ["onnx-community/depth-anything-v2-small", "412694b964262937af8683baa8a5433485787a9a"]) },
  { id: "ormbg", name: "ORMBG", displayName: markMessages("图片抠图与视频主体分割"), version: "FP32", fileName: "ormbg.onnx", size: 176182050,
    sha256: "89b47dd4fa46a76e91b06affeb5ec7881894a27792e41f7dfaf69987653f31d3",
    sources: huggingFaceSources("schirrmacher/ormbg", "6253b318240ef7a8670017b88d242f9f87f5abeb", "ormbg.onnx",
      ["AI-ModelScope/ormbg", "32867082cbfec9f1de21f81d2c23f043be38f95c"]) },
  { id: "migan", name: "MI-GAN", displayName: markMessages("图片局部擦除与修复"), version: "ONNX", fileName: "migan.onnx", size: 29546882,
    sha256: "593eba0b7e04730f1b61c0a3cbca68d97d8d6a7ff5c6a44a7b9d7fcd880fc5ae",
    sources: huggingFaceSources("andraniksargsyan/migan", "406830d0fa60666da0071c342ad2fbc8f30c5c64", "migan.onnx",
      ["mengfanlei/migan", "8422212c25367ea0ba6807835dc55a37d090f101"]) },
  { id: "whisper", name: "Whisper", displayName: markMessages("离线语音转字幕"), version: "Base Q5_1", fileName: "ggml-base-q5_1.bin", size: 59707625,
    sha256: "422f1ae452ade6f30a004d7e5c6a43195e4433bc370bf23fac9cc591f01a8898",
    sources: huggingFaceSources("ggerganov/whisper.cpp", "5359861c739e955e79d9a303bcbc70fb988958b1", "ggml-base-q5_1.bin",
      ["cjc1887415157/whisper.cpp", "ac12dbec310c2fd6e67398e808c40d80210ce4d0"]) },
  { id: "demucs", name: "Demucs", displayName: markMessages("人声与伴奏分离"), version: "HTDemucs", fileName: "htdemucs_embedded.onnx", size: 180534758,
    sha256: "e5e425c17683f163a472462eb5f5a4ffcd11c31858d57fbd0833b012d8b88077",
    sources: huggingFaceSources("timcsy/demucs-web-onnx", "92e33df61cfc9eb820272aaa62d2ef6dcf4d950d", "htdemucs_embedded.onnx",
      ["hebe700/htdemucs-embedded-onnx", "9668a50fe6ffb908270d5f69f848f78582864676"]) },
];
