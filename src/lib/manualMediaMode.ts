export const MEDIA_GENERATION_DISABLED_MESSAGE =
  "当前为手动媒体模式：请复制完整提示词，在外部工具生成后回到原位置上传文件";

export const MANUAL_MEDIA_PROJECT_CONTEXT =
  "当前项目使用手动媒体模式：只输出可复制的完整图片/视频提示词，不依赖或调用图片/视频模型；用户会在外部工具生成媒体后回到原位置上传结果。";

export const MEDIA_GENERATION_PATHS = [
  "/api/assets/generateAssets",
  "/api/assetsGenerate/generateAssets",
  "/api/assetsGenerate/batchGenerateImageAssets",
  "/api/production/assets/batchGenerateAssetsImage",
  "/api/production/storyboard/batchGenerateImage",
  "/api/production/editImage/generateFlowImage",
  "/api/production/workbench/generateVideo",
  "/api/production/workbench/batchGenerateVideo",
  "/api/setting/vendorConfig/modelTest/imageTest",
  "/api/setting/vendorConfig/modelTest/videoTest",
] as const;

export function assertManualMediaMode(): void {
  throw new Error(MEDIA_GENERATION_DISABLED_MESSAGE);
}
