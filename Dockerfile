FROM node:20-bookworm-slim

WORKDIR /app

RUN corepack enable

RUN npm config set registry https://registry.npmmirror.com/ && \
    yarn config set registry https://registry.npmmirror.com/

# Copy the repository contents into the image and install all dependencies
COPY . .

# The container only serves the backend, so strip Electron-only
# packages before installing to avoid downloading desktop binaries.
RUN node -e "const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));for(const section of ['dependencies','devDependencies']){if(!pkg[section]) continue;for(const name of ['custom-electron-titlebar','electron','electron-builder','electron-rebuild','electronmon']) delete pkg[section][name];}fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2)+'\n');" && \
    yarn install --frozen-lockfile && \
    node scripts/runLocalYarn.cjs build && \
    yarn cache clean

ENV NODE_ENV=prod
ENV PORT=10588

EXPOSE 10588

CMD ["node", "data/serve/app.js"]
