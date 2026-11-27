import { markMessages } from "@toonflow/i18n";
import type { ModelAsset } from "@/utils/localModel/catalog";
import { githubRawSources, githubSources, huggingFaceSources } from "@/utils/localModel/assets/sources";

export const mattingNormalAssets: ModelAsset[] = [
  { id: "deepBump", name: "DeepBump", displayName: markMessages("照片转法线图"), version: "256", fileName: "deepbump256.onnx", size: 26706979,
    sha256: "3a2ababc5fa652b19040a0f3d639b71826368e52ad805cf70ffb0e7c96a54d67",
    sources: [...huggingFaceSources("shiertier/deepbump", "febe3942581cce2573fc57f0dafaa350a634f06d", "deepbump256.onnx"),
      ...githubRawSources("HugoTini/DeepBump", "fad19ba87daed12b1d0410a57e74f3d79e82f78d", "deepbump256.onnx")] },
  { id: "rvmMobileNet", name: "Robust Video Matting", displayName: markMessages("视频人像抠像"), version: "MobileNetV3 FP32", fileName: "rvm_mobilenetv3_fp32.onnx", size: 14975696,
    sha256: "88d4531297118f595bf2fd60f6f566aec2e559393802d1f436c380f0cbbd2828",
    sources: githubSources("PeterL1n/RobustVideoMatting", "v1.0.0", "rvm_mobilenetv3_fp32.onnx") },
];
