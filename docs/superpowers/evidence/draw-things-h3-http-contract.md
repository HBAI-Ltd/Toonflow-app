# Draw Things MiniMax H3 HTTP Contract

状态：待本机系统更新后的 Draw Things 运行时恢复后确认。

## 已确认

- Local API 地址为 `http://127.0.0.1:7888`。
- 图片接口 `POST /sdapi/v1/txt2img` 可返回 `{ images: [base64Png] }`。
- `minimax_h3_ref2va_i6x.ckpt` 会被 Draw Things API 接受为模型名。

## 当前阻塞

使用 MiniMax H3 视频参数请求后，Draw Things 进程退出，curl 返回 `Empty reply from server`，没有可记录的完成状态或已编码视频字段。因此 Provider 的视频响应字段解析暂按兼容候选实现，直到获得真实成功响应后再锁定为单一契约。

## 复现参数

```json
{
  "prompt": "a person gently turns their head, natural motion",
  "model": "minimax_h3_ref2va_i6x.ckpt",
  "width": 512,
  "height": 768,
  "steps": 4,
  "cfg_scale": 1,
  "num_frames": 5,
  "fps": 24,
  "batch_size": 1
}
```

恢复后需要补充：实际请求路径、视频请求字段、同步或异步完成语义，以及返回视频的 URL/data URL/base64/binary 字段和 MIME 类型。

## Toonflow 文生视频实测（2026-10-08）

- Toonflow 开发服务：`http://localhost:3000`
- Provider：`drawThings`
- 模型：`minimax_h3_fl2va_i8x.ckpt`
- 入口：`POST /api/ai/media/generate`
- 结果：Toonflow 正确进入 Provider，但 Draw Things 在视频请求后关闭 socket，未返回 HTTP 响应；随后 `7888` 停止监听。
- 另外确认：Draw Things 会对未知字段返回 422，`ratio` 不能直接放入 JSON 请求体，Provider 已改为只用 ratio 计算 width/height。
