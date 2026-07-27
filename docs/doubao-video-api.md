# 豆包网页视频 API 接入

Toonflow 内置供应商“豆包网页视频”通过本机 `doubao2api` 服务调用豆包网页的视频生成能力。

## 前置条件

1. 确保 `doubao2api` 位于 Toonflow 同级目录，或通过
   `TOONFLOW_DOUBAO2API_DIR` 指定项目目录。Toonflow 启动时会使用
   Conda 自动启动该服务；已运行的服务会直接复用。
2. 在 `doubao2api` 控制台完成豆包扫码登录。
3. 确认服务可访问；默认地址为 `http://127.0.0.1:9090`。
4. 在 Toonflow 的供应商设置中启用“豆包网页视频”。如果 `doubao2api` 配置了 API Key，同时填写该 Key。

## Toonflow 模型

| 显示名称 | 模型标识 | 能力 |
| --- | --- | --- |
| 豆包网页多图视频生成（自动路由） | `doubao-video` | 多图参考视频 |

当前 `doubao2api` 视频接口必须接收 1 至 10 张参考图，因此 Toonflow 中只公开
多图参考模式，不再显示文生视频。提示词仍用于描述参考图中的主体如何运动；
时长和分辨率显示为接口当前的默认结果。

## HTTP 契约

请求：

```http
POST /v1/video/generations
Content-Type: application/json
Authorization: Bearer <可选 API Key>
```

```json
{
  "model": "doubao-video",
  "prompt": "镜头缓慢推进，角色自然眨眼",
  "ratio": "16:9",
  "images": [
    {
      "b64_json": "<base64>",
      "filename": "reference-1.png",
      "mime_type": "image/png"
    }
  ]
}
```

Toonflow 会把上传的图片转换为 `images` 数组。适配器在提交前校验至少 1 张、
最多 10 张且全部为图片；`doubao2api` 解码后会在实际选中的豆包账号登录态中
逐张上传，再把图片 URI 作为视频参考附件提交。多账号额度切换时会在新账号中
重新上传这些图片。

成功响应中的视频地址读取自：

```json
{
  "data": [
    {
      "video_url": "https://example.com/video.mp4"
    }
  ]
}
```

Toonflow 会下载该 URL 并保存到项目文件中。`baseUrl` 既可填写服务根地址，也可直接填写完整的 `/v1/video/generations` 地址。
