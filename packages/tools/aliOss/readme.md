# 阿里云 OSS

为视频生成等工作流提供工作区媒体上传，文件保存在阿里云 OSS，服务通过有时效的 HTTPS 签名链接读取。安装并启用后，在“设置 → 插件市场 → 已安装”中配置：

- OSS 地域，例如 `cn-hangzhou`。
- 对应地域的公网 Endpoint，例如 `https://oss-cn-hangzhou.aliyuncs.com`。请在 Bucket 的阿里云控制台查询公网地址。
- Bucket 名称、AccessKey ID 和 AccessKey Secret。建议使用仅能向指定 Bucket 写入对象和读取对象的 RAM 身份。
- 对象前缀，默认 `toonflow`；下载链接有效期默认 72 小时，可设置为 1–168 小时。实际处理耗时可能超过有效期，需按任务情况调整。

上传的对象设置为私有，链接在有效期内可被持有者访问；请勿分享或公开链接。每次使用随机对象名，并发送禁止覆盖请求头。Bucket 开启或暂停版本控制时，该请求头不保证阻止同名写入。对象会保留在 OSS 中，本插件不会自动删除。OSS 存储与流量费用由阿里云按实际使用收取。

例如，Bucket 位于华东 1（杭州），名称为 `example-media`，则在该插件配置中填写：

- 地域：`cn-hangzhou`
- 公网 Endpoint：`https://oss-cn-hangzhou.aliyuncs.com`
- Bucket 名称：`example-media`
- AccessKey ID 和 AccessKey Secret：填写已授权的 RAM 用户密钥；不要把密钥发到对话中。

地域、Bucket 和公网 Endpoint 可在阿里云 OSS 控制台对应 Bucket 的“概览”中查找，以上仅为示例，必须替换成自己的实际配置。

如上传中断或状态未知，请先使用返回的 Bucket 和对象名在 OSS 控制台核对，再决定是否重新上传。工作区工具最多上传 100 MB 的图片、视频或音频文件。

被 OSS 明确拒绝（4xx）时，提示中会带 HTTP 状态与 OSS 错误码，常见如 `SignatureDoesNotMatch`（密钥错误）、`AccessDenied`（权限不足）、`NoSuchBucket`（Bucket 不存在或地域不匹配）；此时对象未写入。
