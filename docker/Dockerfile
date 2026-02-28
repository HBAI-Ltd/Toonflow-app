# 构建阶段
FROM node:24-alpine AS builder

WORKDIR /app

# 定义构建参数
ARG GIT=github
ARG TAG=""
ARG BRANCH=""

# 安装 git
RUN apk add --no-cache git

RUN npm config set registry https://registry.npmmirror.com/ && \
    yarn config set registry https://registry.npmmirror.com/

# 根据参数选择仓库源，支持 TAG / BRANCH 切换
# 优先级: TAG > BRANCH > 最新 tag > 默认分支
RUN if [ "$GIT" = "gitee" ]; then \
        REPO_URL="https://gitee.com/HBAI-Ltd/Toonflow-app.git"; \
    else \
        REPO_URL="https://github.com/HBAI-Ltd/Toonflow-app.git"; \
    fi && \
    echo "Cloning from: $REPO_URL" && \
    git clone "$REPO_URL" . && \
    if [ -n "$TAG" ]; then \
        echo "Checking out specified tag: $TAG" && \
        git checkout "$TAG"; \
    elif [ -n "$BRANCH" ]; then \
        echo "Checking out specified branch: $BRANCH" && \
        git checkout "$BRANCH"; \
    else \
        LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || git tag --sort=-v:refname | head -n 1) && \
        if [ -n "$LATEST_TAG" ]; then \
            echo "Checking out latest tag: $LATEST_TAG" && \
            git checkout "$LATEST_TAG"; \
        else \
            echo "No tags found, using default branch"; \
        fi; \
    fi && \
    echo "Current version:" && git describe --tags --always

RUN yarn install --frozen-lockfile

RUN yarn build

# 生产阶段
FROM node:24-alpine

WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com/ && \
    yarn config set registry https://registry.npmmirror.com/

# 复制后端文件
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/scripts/web ./scripts/web

# 只安装生产依赖
RUN yarn install --frozen-lockfile --production

ENV NODE_ENV=prod

EXPOSE 60000

CMD ["node", "build/app.js"]
