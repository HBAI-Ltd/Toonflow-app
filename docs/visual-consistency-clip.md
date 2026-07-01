# 视觉一致性校验：本地 CLIP embedding

> 视频审核（`src/utils/videoReview.ts` 的 `inspectVisualConsistency`）比对视频首帧与资产/分镜参考图，度量角色/画面一致性。本文说明如何从旧的 16×16 像素指纹升级到本地 CLIP embedding。

## 为什么升级

- 旧方案 16×16 像素欧氏距离（`visualSimilarity.ts` 的 `createVisualFingerprint`/`compareVisualFingerprints`）只能抓"完全跑偏"，抓不住"微变脸/服装细节漂移"，且对构图/景别/光线变化极敏感（同角色不同景别会误判为不相似）。
- CLIP 图像 embedding 是语义级相似，对构图变化鲁棒，能更准地判断"是不是同一角色/同一画面要素"。本地离线运行，零调用成本。

## 工作机制

- `src/utils/agent/imageEmbedding.ts`：仿 `embedding.ts`（文本 embedding）的本地 ONNX 范式，用 `pipeline("image-feature-extraction", …)` 生成图像 embedding（L2 归一化），进程内 LRU 缓存。
- `visualSimilarity.ts` 的 `compareImageFilesByEmbedding`：两图 embedding 的余弦相似度 [0,1]。
- `videoReview.ts`：优先用 CLIP（阈值 `VISUAL_LOW_SIMILARITY_THRESHOLD_CLIP = 0.75`）；**模型不可用时自动降级**到旧像素指纹（阈值 `0.55`），审核不中断，`report.visualConsistency.method` 记录用了 `clip` 还是 `pixel`。

## 启用步骤（默认走降级，需下模型才启用 CLIP）

**未放置模型时，系统自动使用像素指纹 fallback，功能正常、不报错。** 要启用 CLIP：

1. **下载 CLIP ONNX 模型** 到 `data/models/`，与现有 `all-MiniLM-L6-v2` 同级。推荐 `Xenova/clip-vit-base-patch32`（transformers.js 兼容的 ONNX 版）。目录结构需含 `config.json`、`preprocessor_config.json`、`onnx/model.onnx`（或量化版）等，与 transformers 本地加载约定一致。
   - 例：`data/models/clip-vit-base-patch32/…`
2. **配置 `o_setting`**（可选，有默认值）：
   - `imageModelFolder`：模型文件夹名，默认 `clip-vit-base-patch32`
   - `imageModelDtype`：量化类型，默认 `fp32`（如用 fp16 量化则设 `fp16`）
3. 重启服务。首次审核会 lazy 加载模型（~秒级），之后走进程内缓存。

## 阈值校准

`0.75` 是经验初值。用几组真实资产图/分镜图跑出 CLIP 相似度分布后可调整：同一角色不同景别通常 0.75+，不同角色通常 0.5 以下。调整 `videoReview.ts` 的 `VISUAL_LOW_SIMILARITY_THRESHOLD_CLIP`。

## 注意事项

- **仓库体积**：现有 `all-MiniLM-L6-v2`（44MB）已入库；CLIP 模型（~350MB）较大，是否入库需权衡仓库膨胀。若不入库，需在部署/打包流程单独分发到 `data/models/`。
- **打包**：`data/models/` 已在 Electron 打包资源内（与 all-MiniLM 一致）。
- **降级是安全网**：任何时候模型缺失/加载失败，都不会让视频审核崩溃，只是回落到较粗的像素度量。

## 相关文件

| 文件 | 作用 |
|---|---|
| `src/utils/agent/imageEmbedding.ts` | 本地 CLIP 图像 embedding（新增） |
| `src/utils/visualSimilarity.ts` | `compareImageFilesByEmbedding`（新增）+ 旧像素指纹（保留为 fallback） |
| `src/utils/videoReview.ts` | 切换 CLIP + 阈值 + 降级保护 + `method` 记录 |
| `src/utils/agent/embedding.ts` | 参照范式（文本 embedding） |
