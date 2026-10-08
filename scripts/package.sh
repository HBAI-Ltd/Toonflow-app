#!/usr/bin/env bash
set -eu

repoDir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -n "${BUN_BIN:-}" ]]; then
  bunBin="$BUN_BIN"
elif command -v bun >/dev/null 2>&1; then
  bunBin="$(command -v bun)"
else
  bunBin=""
  for candidate in "$HOME/.bun/bin/bun" "$HOME/.cherrystudio/bin/bun" /opt/homebrew/bin/bun /usr/local/bin/bun; do
    if [[ -x "$candidate" ]]; then
      bunBin="$candidate"
      break
    fi
  done
fi

if [[ -z "$bunBin" || ! -x "$bunBin" ]]; then
  echo "未找到 Bun，请先安装 Bun 1.3.14 并确保 bun 在 PATH 中。" >&2
  exit 1
fi

export PATH="$(dirname "$bunBin"):$PATH"
cd "$repoDir"

if [[ "$(uname -s)" == "Darwin" ]]; then
  case "$(uname -m)" in
    arm64)
      startupArch="arm64"
      startupTarget="macArm64"
      ;;
    x86_64)
      startupArch="x64"
      startupTarget="macX64"
      ;;
    *)
      echo "不支持当前 macOS 架构: $(uname -m)" >&2
      exit 1
      ;;
  esac
  startupDir="packages/startup/assets/$startupTarget"
  if [[ ! -x "$startupDir/libthorvg.dylib" || ! -x "$startupDir/nativeSplash.dylib" ]]; then
    archive="build/startupNative/thorvg.tar.xz"
    if [[ ! -f "$archive" ]] && command -v curl >/dev/null 2>&1; then
      mkdir -p "$(dirname "$archive")"
      echo "下载 macOS 启动画面依赖..."
      curl -L --fail --retry 3 -o "$archive" \
        "https://github.com/thorvg/thorvg/releases/download/v1.1.1/thorvg-1.1.1.tar.xz" \
        || rm -f "$archive"
    fi
    echo "生成 macOS $startupArch 启动库..."
    "$bunBin" packages/startup/scripts/buildMac.ts "$startupArch"
  fi
fi

echo "开始构建 Toonflow 桌面应用..."
"$bunBin" run package:desktop

if [[ "$(uname -s)" == "Darwin" ]]; then
  case "$(uname -m)" in
    arm64) artifactDir="build/desktop/artifacts/macArm64" ;;
    x86_64) artifactDir="build/desktop/artifacts/macX64" ;;
    *) artifactDir="build/desktop/artifacts" ;;
  esac
else
  artifactDir="build/desktop/artifacts"
fi

echo "打包完成，产物目录: $repoDir/$artifactDir"
find "$repoDir/$artifactDir" -maxdepth 1 -type f -print | sort
