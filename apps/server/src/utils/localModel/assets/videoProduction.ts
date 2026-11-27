import { markMessages } from "@toonflow/i18n";
import type { ModelAsset } from "@/utils/localModel/catalog";
import { huggingFaceSources } from "@/utils/localModel/assets/sources";

export const videoProductionAssets: ModelAsset[] = [
  { id: "ppOcrV5Det", name: "PP-OCRv5 Mobile Det", displayName: markMessages("定位画面中的字幕"), version: "v5", fileName: "ppOcrV5Det.onnx", size: 4826518,
    sha256: "a431985659dc921974177a95adcfbb90fd9e51989a5e04d70d0b75f597b6e61d",
    sources: huggingFaceSources("PaddlePaddle/PP-OCRv5_mobile_det_onnx", "e6f4fa85f00e168c862bc462aebca69eef9b3d3d", "inference.onnx") },
  { id: "ppOcrV5Rec", name: "PP-OCRv5 Mobile Rec", displayName: markMessages("读取画面中的字幕"), version: "v5", fileName: "ppOcrV5Rec.onnx", size: 16534782,
    sha256: "da72dc72ca4dc220df0dfde68c1dedc31c58d3e76a25871122e5056227d50092",
    sources: huggingFaceSources("PaddlePaddle/PP-OCRv5_mobile_rec_onnx", "ed152b8b495f84de93cda5709d768548a9127622", "inference.onnx") },
  { id: "xfeat", name: "XFeat", displayName: markMessages("参考画面对齐"), version: "FP32", fileName: "xfeat.onnx", size: 2761136,
    sha256: "85912f6fbc838bc1f01c55b2bf95493def40fd781ccbab19a07a71c72e9f4fff",
    sources: huggingFaceSources("Inbolt/xfeat", "7b3902da7f368f56649a4ca609da1c16ffa09a3d", "xfeat_cpu.onnx") },
  { id: "vitTrack", name: "VitTrack", displayName: markMessages("视频主体跟踪"), version: "2023.09", fileName: "vitTrack.onnx", size: 714726,
    sha256: "2990f0b7cd44d92afa48cd97db6de7be113fc1d9594fddb74e2725c10478e91d",
    sources: huggingFaceSources("opencv/object_tracking_vittrack", "868e4c941984c6363594ec34ee1c3ba0b75378a3", "object_tracking_vittrack_2023sep.onnx") },
];
