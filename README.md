<p>
  <a href="https://github.com/HBAI-Ltd/Toonflow-app">
    <img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub" />
  </a>
  &nbsp;|&nbsp;
  <a href="https://gitee.com/HBAI-Ltd/Toonflow-app">
    <img src="https://img.shields.io/badge/Gitee-C71D23?style=flat-square&logo=gitee&logoColor=white" alt="Gitee" />
  </a>
</p>

<p align="center">
  <strong>中文</strong> | 
  <a href="./docs/README.en.md">English</a>
</p>

<div align="center">

<img src="./docs/logo.png" alt="Vivido Logo" height="120"/>

# Vivido

  <p align="center">
    <b>
      AI短剧工厂
      <br />
      动动手指，小说秒变剧集！
      <br />
      AI剧本 × AI影像 × 极速生成 🔥
    </b>
  </p>
  <p align="center">
    <a href="https://github.com/HBAI-Ltd/Toonflow-app/stargazers">
      <img src="https://img.shields.io/github/stars/HBAI-Ltd/Toonflow-app?style=for-the-badge&logo=github" alt="Stars Badge" />
    </a>
    <a href="https://www.gnu.org/licenses/agpl-3.0" target="_blank">
      <img src="https://img.shields.io/badge/License-AGPL-blue.svg?style=for-the-badge" alt="AGPL License Badge" />
    </a>
    <a href="https://github.com/HBAI-Ltd/Toonflow-app/releases">
      <img alt="release" src="https://img.shields.io/github/v/release/HBAI-Ltd/Toonflow-app?style=for-the-badge" />
    </a>
  </p>
  
  > 🚀 **一站式短剧工程**：从文本到角色，从分镜到视频，0门槛全流程AI化，创作效率提升10倍+！
</div>

---

# 🌟 主要功能

Vivido 是一款 AI 工具，能够利用 AI 技术将小说自动转化为剧本，并结合 AI 生成的图片和视频，实现高效的短剧创作。借助 Vivido，可以轻松完成从文字到影像的全流程，让短剧制作变得更加智能与便捷。

- ✅ **角色生成**  
   自动分析原始小说文本，智能识别并生成角色设定，包括外貌、性格、身份等详细信息，为后续剧本与画面创作提供可靠基础。
- ✅ **剧本生成**  
   基于选定事件和章节，系统自动生成结构化剧本，涵盖对白、场景描述、剧情走向，实现从文学文本到影视剧本的高效转换。
- ✅ **分镜制作**  
   根据剧本内容，智能生成分镜提示词与画面设计，细化前中后景、角色动态、道具设定和场景布局，自动根据剧本生成分镜，为视频制作提供完整路线蓝图。
- ✅ **视频合成**  
   集成 AI 图像与视频技术，可使用 AI 生成视频片段。整合在线编辑，支持个性化调整输出，让影视创作高效协同、快捷落地。

---

# 📦 应用场景

- 短视频内容创作
- 小说影视化实验
- AI 文学改编工具
- 剧本开发与快速原型
- 视频素材生成

---

# 🔰 使用指南

## 📺 视频教程

https://www.bilibili.com/video/BV1na6wB6Ea2
[![Vivido 8 分钟快速上手 AI 视频](./docs/videoCover.png)](https://www.bilibili.com/video/BV1na6wB6Ea2)

**Vivido 8 分钟快速上手 AI 视频**
👉 [点击观看](https://www.bilibili.com/video/BV1na6wB6Ea2/?share_source=copy_web&vd_source=5b718c25439a901a34c7bc0c1d35b38e)

📱 手机微信扫码观看

<img src="./docs/videoQR.png" alt="微信扫码观看" width="150"/>

---

# 🚀 安装

## 前置条件

在安装和使用本软件之前，请准备以下内容：

- ✅ 大语言模型 AI 服务接口地址
- ✅ Sora 或豆包视频服务接口地址
- ✅ Nano Banana Pro 图片生成模型服务接口

## 本机安装

### 1. 下载与安装

| 操作系统 | GitHub 下载                                                  | 123 云盘下载                                      | 说明           |
| :------: | :----------------------------------------------------------- | :------------------------------------------------ | :------------- |
| Windows  | [Release](https://github.com/HBAI-Ltd/Toonflow-app/releases) | [123 云盘](https://www.123865.com/s/bkn5Vv-E67cv) | 官方发布安装包 |
|  Linux   | ⚙️ 敬请期待                                                  | ⚙️ 敬请期待                                       | 即将发布       |
|  macOS   | ⚙️ 敬请期待                                                  | ⚙️ 敬请期待                                       | 即将发布       |

> ⚠️ 如 123 云盘提示需付费，仅因云盘流量受限，本软件完全开源免费。

> 目前仅支持 Windows 版本，其他系统将陆续开放。

> 因 Gitee OS 环境限制及 Release 文件上传大小限制，暂不提供 Gitee Release 下载地址。

### 2. 启动服务

安装完成后，启动程序即可开始使用本服务。

> ⚠️ **首次登录**  
> 账号：`admin`  
> 密码：`admin123`

## Docker 部署

### 前置条件

- 已安装 [Docker](https://docs.docker.com/get-docker/)（版本 20.10+）
- 已安装 [Docker Compose](https://docs.docker.com/compose/install/)（版本 2.0+）

### 方式一：在线部署（推荐）

从 GitHub / Gitee 自动拉取源码并构建镜像：

```shell
docker-compose -f docker/docker-compose.yml up -d --build
```

**支持的构建参数：**

| 参数       | 说明                    | 默认值     | 示例                        |
| ---------- | ----------------------- | ---------- | --------------------------- |
| `GIT`      | 代码仓库源              | `github`   | `github` / `gitee`          |
| `TAG`      | 指定版本标签            | 最新 tag   | `v1.0.6`                    |
| `BRANCH`   | 指定分支                | 默认分支   | `main` / `dev`              |

**版本选择优先级**：指定 TAG > 指定 BRANCH > 自动获取最新 tag > 默认分支

**指定参数示例：**

```shell
# 使用 Gitee 源（国内推荐，速度更快）
GIT=gitee docker-compose -f docker/docker-compose.yml up -d --build

# 指定版本标签
TAG=v1.0.6 docker-compose -f docker/docker-compose.yml up -d --build

# 指定分支 + Gitee 源
GIT=gitee BRANCH=dev docker-compose -f docker/docker-compose.yml up -d --build
```

### 方式二：本地构建

使用本地已有的源码直接构建，适合开发者或已克隆仓库的用户：

```shell
# 先克隆项目（如已有则跳过）
git clone https://github.com/HBAI-Ltd/Toonflow-app.git
cd Toonflow-app

# 使用本地源码构建
docker-compose -f docker/docker-compose.local.yml up -d --build
```

### 服务端口说明

| 端口    | 用途                    | 在线部署映射    | 本地构建映射      |
| ------- | ----------------------- | --------------- | ----------------- |
| `80`    | Nginx 前端页面          | 随机端口        | `8080:80`         |
| `60000` | 后端 API 服务           | `60000:60000`   | `60000:60000`     |

### 数据持久化

默认日志目录会挂载到宿主机 `./logs` 目录。如需持久化上传文件或数据库，可在 `docker-compose.yml` 中添加 volumes：

```yaml
volumes:
  - ./logs:/var/log
  - ./uploads:/app/uploads      # 持久化上传文件
  - ./data:/app/data            # 持久化数据库（如有）
```

### 常用操作命令

```shell
# 查看容器状态
docker-compose -f docker/docker-compose.yml ps

# 查看实时日志
docker-compose -f docker/docker-compose.yml logs -f

# 停止服务
docker-compose -f docker/docker-compose.yml down

# 重新构建并启动（更新版本时使用）
docker-compose -f docker/docker-compose.yml up -d --build

# 进入容器调试
docker exec -it vivido sh
```

> ⚠️ **首次登录**  
> 账号：`admin`  
> 密码：`admin123`

## 云端部署

### 一、服务器环境要求

- **系统**：Ubuntu 20.04+ / CentOS 7+
- **Node.js**：24.x（推荐，最低 23.11.1+）
- **内存**：2GB+

### 二、服务器部署

#### 1. 安装环境

```bash
# 安装 Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 24
# 安装 Yarn 和 PM2
npm install -g yarn pm2
```

#### 2. 部署项目

**从 GitHub 克隆：**

```bash
cd /opt
git clone https://github.com/HBAI-Ltd/Toonflow-app.git
cd Toonflow-app
yarn install
yarn build
```

**从 Gitee 克隆（国内推荐）：**

```bash
cd /opt
git clone https://gitee.com/HBAI-Ltd/Toonflow-app.git
cd Toonflow-app
yarn install
yarn build
```

#### 3. 配置 PM2

创建 `pm2.json` 文件：

```json
{
  "name": "toonflow-app",
  "script": "build/app.js",
  "instances": "max",
  "exec_mode": "cluster",
  "env": {
    "NODE_ENV": "prod",
    "PORT": 60000,
    "OSSURL": "http://127.0.0.1:60000/"
  }
}
```

**环境变量说明：**

| 变量       | 说明                               |
| ---------- | ---------------------------------- |
| `NODE_ENV` | 运行环境，`prod` 表示生产环境      |
| `PORT`     | 服务监听端口                       |
| `OSSURL`   | 文件存储访问地址，用于静态资源访问 |

---

#### 4. 启动服务

```bash
pm2 start pm2.json
pm2 startup
pm2 save
```

#### 5. 常用命令

```bash
pm2 list              # 查看进程
pm2 logs toonflow-app # 查看日志
pm2 restart all       # 重启服务
pm2 monit             # 监控面板
```

> ⚠️ **首次登录**  
> 账号：`admin`  
> 密码：`admin123`

#### 6. 部署前端网站

如需单独部署或定制前端界面，请参考前端仓库：

- **GitHub**：[Vivido-web](https://github.com/HBAI-Ltd/Toonflow-web)
- **Gitee**：[Vivido-web](https://gitee.com/HBAI-Ltd/Toonflow-web)

> 💡 **说明**：本仓库已内置编译好的前端资源，普通用户无需单独部署前端。前端仓库仅供需要二次开发的开发者使用。

---

# 🔧 开发流程指南

## 开发环境准备

- **Node.js**：版本要求 23.11.1 及以上
- **Yarn**：推荐作为项目包管理器

## 快速启动项目

1. **克隆项目**

   **从 GitHub 克隆：**

   ```bash
   git clone https://github.com/HBAI-Ltd/Toonflow-app.git
   cd Toonflow-app
   ```

   **从 Gitee 克隆（国内推荐）：**

   ```bash
   git clone https://gitee.com/HBAI-Ltd/Toonflow-app.git
   cd Toonflow-app
   ```

2. **安装依赖**

   请先在项目根目录下执行以下命令以安装依赖项：

   ```bash
   yarn install
   ```

3. **启动开发环境**

   本项目包含 **后端 API 服务** 和 **前端页面** 两部分，请根据需要选择启动方式：

   - **方式一：仅启动后端服务（开发调试用）**

     ```bash
     yarn dev
     ```

     > ⚠️ 此命令仅启动后端 API 服务（端口 60000），**不包含前端页面**。直接访问 `http://localhost:60000` 只能调用 API 接口，无法看到完整的网页界面。如需同时使用前端页面，请配合前端项目单独启动，或使用下方的 GUI 模式。

   - **方式二：启动 Electron 桌面客户端（推荐完整体验）**

     ```bash
     yarn dev:gui
     ```

     > 此命令会同时启动后端服务和 Electron 桌面窗口，自带内置前端页面，开箱即用，无需额外配置。适合想要完整体验所有功能的开发者。

   **两种模式对比：**

   | 命令           | 启动内容               | 前端页面 | 适用场景                         |
   | -------------- | ---------------------- | -------- | -------------------------------- |
   | `yarn dev`     | 仅后端 API（端口 60000） | ❌ 无    | 后端开发调试、配合前端项目联调   |
   | `yarn dev:gui` | 后端 + Electron 桌面端 | ✅ 内置  | 完整功能体验、桌面客户端开发调试 |

4. **项目打包**

   - 编译并生成 TypeScript 文件：

     ```bash
     yarn build
     ```

   - 打包为 Windows 平台可执行程序：

     ```bash
     yarn dist:win
     ```
  
   - 打包为 Mac 平台可执行程序：

     ```bash
     yarn dist:mac
     ```

   - 打包为 Linux 平台可执行程序：

     ```bash
     yarn dist:linux
     ```

5. **代码质量检查**

   - 进行全局语法和规范检查：

     ```bash
     yarn lint
     ```

6. **AI 调试面板（可选）**

   启动 AI SDK 的可视化调试工具，方便调试 AI 调用：

   ```bash
   yarn debug:ai
   ```

## 前端开发

如需修改前端界面，请前往前端仓库进行开发：

- **GitHub**：[Vivido-web](https://github.com/HBAI-Ltd/Toonflow-web)
- **Gitee**：[Vivido-web](https://gitee.com/HBAI-Ltd/Toonflow-web)

前端构建后，将 `dist` 目录内容复制到本项目的 `scripts/web` 目录即可集成。

## 项目结构

```
📂 docker/                   # Docker 配置文件
📂 docs/                    # 文档资源
📂 scripts/                 # 构建脚本与静态资源
│  └─ 📂 web/              # 前端编译产物（内置）
📂 src/
├─ 📂 agents/              # AI Agent 模块
├─ 📂 lib/                 # 公共库（数据库初始化、响应格式）
├─ 📂 middleware/          # 中间件
├─ 📂 routes/              # 路由模块
│  ├─ 📂 assets/           # 素材管理
│  ├─ 📂 index/            # 首页
│  ├─ 📂 novel/            # 小说管理
│  ├─ 📂 other/            # 其他功能
│  ├─ 📂 outline/          # 大纲管理
│  ├─ 📂 project/          # 项目管理
│  ├─ 📂 prompt/           # 提示词管理
│  ├─ 📂 script/           # 剧本生成
│  ├─ 📂 setting/          # 系统设置
│  ├─ 📂 storyboard/       # 分镜管理
│  ├─ 📂 task/             # 任务管理
│  ├─ 📂 user/             # 用户管理
│  └─ 📂 video/            # 视频生成
├─ 📂 types/               # TypeScript 类型声明
├─ 📂 utils/               # 工具函数
├─ 📄 app.ts               # 应用入口
├─ 📄 core.ts              # 路由核心
├─ 📄 env.ts               # 环境变量处理
├─ 📄 err.ts               # 错误处理
├─ 📄 router.ts            # 路由注册
└─ 📄 utils.ts             # 通用工具
📂 uploads/                 # 上传文件目录
📄 LICENSE                  # 许可证
📄 NOTICES.txt              # 第三方依赖声明
📄 package.json             # 项目配置
📄 README.md                # 项目说明
📄 tsconfig.json            # TypeScript 配置
```

---

# 🔗 相关仓库

| 仓库             | 说明                               | GitHub                                             | Gitee                                            |
| ---------------- | ---------------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| **Vivido-app** | 完整客户端（本仓库，推荐普通用户） | [GitHub](https://github.com/HBAI-Ltd/Toonflow-app) | [Gitee](https://gitee.com/HBAI-Ltd/Toonflow-app) |
| **Vivido-web** | 前端源代码（适合前端开发者）       | [GitHub](https://github.com/HBAI-Ltd/Toonflow-web) | [Gitee](https://gitee.com/HBAI-Ltd/Toonflow-web) |

> 💡 **提示**：如果您只是想使用 Vivido，直接下载本仓库的客户端即可。前端仓库仅供需要二次开发或定制前端界面的开发者使用。

---

# 📝 开发计划

我们正持续优化产品，以下为近期开发重点：

1. 核心功能升级

- `🧩 提示词润色生成 Agent` 基于 AI 智能润色视频提示词，自动拆解生成分镜脚本，支持多镜头智能融合与平滑过渡
- `📄 多格式文本支持` 扩展小说以外的剧本、漫画脚本、游戏对话文本等多种格式的智能解析

2. 生产流程优化

- `👗 角色服化道管理` 强化长篇内容中角色的服装、化妆、道具一致性，支持多剧集关联记忆和着装自动生成
- `📦 批量处理/任务队列` 支持多章节同时处理，后台任务管理，进度实时监控和中断恢复

3. 视觉生成增强

- `🎭 多风格模板库` 内置多种视觉风格包，支持一键风格转换和用户自定义风格保存
- `⏱️ 智能节奏分析/优化` 分析剧情情绪曲线，自动建议高潮点和节奏变化，优化分镜安排生产流程优化

---

# 👨‍👩‍👧‍👦 微信交流群

~~交流群 1~~

~~交流群 2~~

~~交流群 3~~

~~交流群 4~~

~~交流群 5~~

~~交流群 6~~

~~交流群 7~~

~~交流群 8~~

~~交流群 9~~

~~交流群 10~~

~~交流群 11~~

交流群 12:

<img src="./docs/chat12QR.jpg?r=2" alt="Vivido Logo" height="400"/>
<p>使用微信扫码添加，二维码过期可提交 Issues 提醒更新</p>

---

# 💌 联系我们

📧 邮箱：[ltlctools@outlook.com](mailto:ltlctools@outlook.com?subject=Vivido咨询)

---

# 📜 许可证

Vivido 基于 AGPL-3.0 协议开源发布，许可证详情：https://www.gnu.org/licenses/agpl-3.0.html

您可以在遵循 AGPL-3.0 相关条款与条件的情况下，将 Vivido 用于包括商业目的在内的各类用途。

如需获得免于 AGPL-3.0 限制的专有商业许可，请通过邮箱与我们联系。

---

# ⭐️ 星标历史

[![Star History Chart](https://api.star-history.com/svg?repos=HBAI-Ltd/Toonflow-app&type=date&legend=top-left)](https://www.star-history.com/#HBAI-Ltd/Toonflow-app&type=date&legend=top-left)

---

# 🙏 致谢

感谢以下开源项目为 Vivido 提供强大支持：

- [Express](https://expressjs.com/) - 快速、开放、极简的 Node.js Web 框架
- [AI](https://ai-sdk.dev/) - 面向 TypeScript 的 AI 工具包
- [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3) - 高性能 SQLite3 绑定库
- [Sharp](https://sharp.pixelplumbing.com/) - 高性能 Node.js 图像处理库
- [Axios](https://axios-http.com/) - 基于 Promise 的 HTTP 客户端
- [Zod](https://zod.dev/) - TypeScript 优先的模式验证库
- [Aigne](https://github.com/aigne-com/aigne) - LLM API 统一管理与接入中间件
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用开发框架

感谢以下组织/单位/个人为 Vivido 提供支持：

<table>
  <tr>
    <td>
      <img src="./docs/sponsored/sophnet.png" alt="算能云 Logo" width="48">
    </td>
    <td>
      <b>算能云</b> 提供算力赞助
      <a href="https://www.sophnet.com/">[官网]</a>
    </td>
  </tr>
</table>

完整的第三方依赖清单请查阅 `NOTICES.txt`
