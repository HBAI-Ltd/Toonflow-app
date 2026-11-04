#!/bin/sh
set -eu

case "${1:-}" in
  install|upgrade) prepareOnly=1 ;;
  configure) prepareOnly=0 ;;
  abort-upgrade|abort-remove|abort-deconfigure) exit 0 ;;
  *) printf '%s\n' 'Toonflow：不支持的安装配置阶段。' >&2; exit 1 ;;
esac

# runtimeConfig

fail() {
  printf '%s\n' "Toonflow：$*" >&2
  exit 1
}

verifyFile() {
  [ -f "$1" ] && [ ! -L "$1" ] &&
    [ "$(wc -c < "$1")" -eq "$2" ] &&
    [ "$(sha256sum "$1" | cut -d ' ' -f 1)" = "$3" ]
}

case "$runtimeArch" in
  x64) packageArchitecture=amd64 ;;
  arm64) packageArchitecture=arm64 ;;
  *) fail '必要运行时架构无效。' ;;
esac
[ "$(id -u)" -eq 0 ] || fail '请通过软件包管理器以管理员身份安装。'
[ "$(dpkg --print-architecture)" = "$packageArchitecture" ] || fail '必要运行时与系统架构不一致。'

targetDirectory=/opt/toonflow/bin
targetPath=$targetDirectory/bun
cacheDirectory=/var/cache/toonflow
archivePath=$cacheDirectory/bun-$runtimeVersion-linux-$runtimeArch.zip
downloadPath=
runtimeTemporary=

cleanup() {
  [ -z "$downloadPath" ] || rm -f -- "$downloadPath"
  [ -z "$runtimeTemporary" ] || rm -f -- "$runtimeTemporary"
}
trap cleanup 0
trap 'exit 1' HUP INT TERM

if [ "$prepareOnly" -eq 0 ]; then
  [ ! -L /opt/toonflow ] && [ ! -L "$targetDirectory" ] && [ -d "$targetDirectory" ] || fail '应用运行时目录无效。'
  [ ! -d "$targetPath" ] || fail 'Bun 目标路径被目录占用。'
  if verifyFile "$targetPath" "$executableSize" "$executableSha256"; then
    chmod 755 "$targetPath"
    printf '%s\n' "Toonflow：已复用通过校验的 Bun $runtimeVersion。"
    exit 0
  fi
fi

[ ! -L "$cacheDirectory" ] || fail '运行时缓存目录不能是符号链接。'
mkdir -p "$cacheDirectory"
chown 0:0 "$cacheDirectory"
chmod 700 "$cacheDirectory"
[ ! -d "$archivePath" ] || fail '运行时缓存路径被目录占用。'
umask 077

if ! verifyFile "$archivePath" "$archiveSize" "$archiveSha256"; then
  [ "$prepareOnly" -eq 1 ] || fail '必要运行时缓存缺失或校验不通过，请重新安装 Toonflow 软件包。'
  for sourceUrl do
    printf '%s\n' "Toonflow：正在下载 Bun $runtimeVersion 必要运行时：$sourceUrl"
    downloadPath=$(mktemp "$cacheDirectory/.bunArchive.XXXXXXXX")
    if curl --fail --location --proto '=https' --proto-redir '=https' --tlsv1.2 \
      --connect-timeout 30 --max-time 1200 --speed-limit 1024 --speed-time 60 \
      --max-filesize "$archiveSize" --output "$downloadPath" "$sourceUrl" &&
      verifyFile "$downloadPath" "$archiveSize" "$archiveSha256"; then
      mv -fT -- "$downloadPath" "$archivePath"
      downloadPath=
      break
    fi
    printf '%s\n' 'Toonflow：此来源下载失败或校验不通过，正在尝试下一个来源。' >&2
    rm -f -- "$downloadPath"
    downloadPath=
  done
fi
verifyFile "$archivePath" "$archiveSize" "$archiveSha256" || fail '必要运行时下载失败，请检查网络后重新安装 Toonflow 软件包。'

if [ "$prepareOnly" -eq 1 ]; then
  runtimeTemporary=$(mktemp "$cacheDirectory/.bun.XXXXXXXX")
else
  runtimeTemporary=$(mktemp "$targetDirectory/.bun.XXXXXXXX")
fi
# ACT: 只流式读取固定成员，不展开 ZIP 路径；先校验归档，再校验可执行文件。
unzip -p "$archivePath" "$archiveMember" > "$runtimeTemporary" || fail '必要运行时解压失败。'
verifyFile "$runtimeTemporary" "$executableSize" "$executableSha256" || fail '必要运行时大小或 SHA-256 校验失败。'
if [ "$prepareOnly" -eq 1 ]; then
  printf '%s\n' "Toonflow：Bun $runtimeVersion 安装缓存已准备并通过完整性校验。"
  exit 0
fi
chmod 755 "$runtimeTemporary"
mv -fT -- "$runtimeTemporary" "$targetPath"
runtimeTemporary=
printf '%s\n' "Toonflow：Bun $runtimeVersion 已安装并通过完整性校验。"
