# 手动媒体模式 API

Toonflow 的图片和视频主流程采用“完整提示词 → 外部生成 → 原位置上传”的手动媒体模式。
文本模型仍可用于整理提示词，但服务端不会调用图片或视频供应商。

## 被禁用的生成接口

下列接口固定返回 HTTP `409`，不会创建任务、写入生成中记录或访问媒体模型：

- `POST /api/assetsGenerate/generateAssets`
- `POST /api/assetsGenerate/batchGenerateImageAssets`
- `POST /api/production/assets/batchGenerateAssetsImage`
- `POST /api/production/storyboard/batchGenerateImage`
- `POST /api/production/editImage/generateFlowImage`
- `POST /api/production/workbench/generateVideo`
- `POST /api/production/workbench/batchGenerateVideo`
- `POST /api/setting/vendorConfig/modelTest/imageTest`
- `POST /api/setting/vendorConfig/modelTest/videoTest`

## 上传外部生成的视频

`POST /api/production/workbench/uploadVideo`

请求体：

```json
{
  "projectId": 1,
  "scriptId": 2,
  "trackId": 3,
  "base64Data": "data:video/mp4;base64,..."
}
```

支持 MP4、WebM、MOV 和 MKV。接口会验证轨道属于指定项目和剧本，将视频保存到项目视频目录，
创建状态为“已完成”的视频记录，并把该视频设为原轨道当前选中视频。

成功响应：

```json
{
  "code": 200,
  "data": {
    "id": 10,
    "src": "http://localhost:10588/oss/1/video/example.mp4",
    "state": "已完成"
  },
  "message": "成功"
}
```
