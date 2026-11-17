# 托管钱包与管理页面实施计划

**目标：** 拆分系统设置和用户管理，并按上游可核对账单结算钱包。
**设计：** ../specs/2026-11-11-hostedBilling-design.md
**技术：** 现有 Bun / SQLite / Express / Vue / Element Plus，无新增依赖。
**约束：** 小驼峰命名、一个路由一个文件、通过 core.ts 生成路由；不新增测试文件；保留已有未提交改动，不部署和不触发付费调用。

- [x] 新增 `apps/server/src/utils/hosting/billing.ts`：SQLite 增量表、整数金额、倍率快照、幂等余额调整、请求上下文、OpenFox 账单核对。
- [x] 接入 `hosting/tasks.ts`、`ai/files.ts`、`media/provider.ts`：调用前检查余额、记录每笔上游请求、任务结束核对，查询失败保持待核对。
- [x] 新增 `routes/admin/billing/{get,save,adjust,reconcile,ledger}.ts` 和 `routes/account/ledger.ts`；扩展账户/管理用量和用户列表响应；只读自己的账本，管理写操作验证管理员当前密码。
- [x] 将 `panels/account.vue` 中用户管理迁移到 `panels/userManagement.vue`；新增 `panels/systemSettings.vue`；设置侧边栏按角色显示独立入口。
- [x] 账户表格显示上游金额、倍率、实际扣费与核对状态；用户页显示余额并可调整、查看流水；设置页配置默认倍率和开关。
- [x] 运行现有 routes、server/web typecheck、server/web build；审查差异与权限、金额精度、重复结算、旧记录边界，修复本次引入的问题并记录实际验证结果。

## 实际验证

- routes 生成成功；前后端 build 均成功，Web 保留原有大分包警告。
- 前后端 typecheck 均遇同一个环境缺失：`electrobun.config.ts:1` 引用的 `.hutch/devkit/api/config/ElectrobunConfig` 不存在；修正本次新增的表格行类型问题后，未报告本次文件的其他类型错误。未伪造声明或更改桌面配置以绕过检查。
- 使用独立 `data/billingPreview20261111` 启动本地服务，未改真实账户余额或配置。通过现有初始化脚本创建隔离管理员，实际 HTTP 验证配置读写、初始钱包、六位小数增减、倍率继承、同操作 UUID 重试不重复入账、冲突操作返回 409、普通用户管理员接口返回 403及独立账本。
- 实际浏览器验证系统设置和用户管理入口、钱包弹窗保存 `10.000001` 元及 `1.25×` 回显、默认倍率 `1.2345` 保存。修复原生 number 步长校验阻止合法小数提交的问题。
- 隔离预览密钥验证：默认接口返回掩码，管理员指定供应商读取成功；实际打开编辑窗点击眼睛后，input 为 text 且值等于预览密钥。加载真实值后再挂载 form-create，避免旧掩码覆盖真实值。
- 上游公开换算接口实际读取成功。没有发起付费模型调用，没有用模拟账单冒充真实结算验证；真实账单到扣费流水的完整链路仍未实际验证。视频缺少唯一最终金额快照时保留待核对。
- 没有新增测试模块或测试依赖，没有提交、推送或部署。
