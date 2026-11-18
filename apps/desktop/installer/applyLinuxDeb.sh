#!/bin/sh
set -eu
PATH=/usr/sbin:/usr/bin:/sbin:/bin
export PATH
umask 077

fail() { printf '%s\n' "Toonflow: $*" >&2; exit 1; }
[ "$(id -u)" = 0 ] && [ "$#" = 3 ] || fail '需要系统授权安装更新。'
version=$1
size=$2
sha256=$3
printf '%s\n' "$version" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$' || fail '版本无效。'
case "$size" in ''|*[!0-9]*) fail '大小无效。' ;; esac
[ "$size" -gt 0 ] && [ "$size" -le 536870912 ] || fail '大小无效。'
case "$sha256" in *[!a-f0-9]*) fail 'SHA-256 无效。' ;; esac
[ "${#sha256}" = 64 ] || fail 'SHA-256 无效。'

# 不让 apt 重新打开用户可修改的文件。授权后只安装 root 独占副本，校验与安装使用同一份字节。
directory=$(mktemp -d /var/tmp/toonflowDeb.XXXXXXXX)
package=$directory/toonflow.deb
trap 'rm -f -- "$package"; rmdir -- "$directory"' EXIT
trap 'exit 1' HUP INT TERM
head -c "$((size + 1))" > "$package"
[ "$(wc -c < "$package")" -eq "$size" ] && [ "$(sha256sum "$package" | cut -d ' ' -f 1)" = "$sha256" ] || fail '下载的安装包校验失败。'
[ "$(dpkg-deb -f "$package" Package)" = toonflow ] &&
  [ "$(dpkg-deb -f "$package" Architecture)" = "$(dpkg --print-architecture)" ] &&
  [ "$(dpkg-deb -f "$package" Version)" = "$version" ] || fail '安装包名称、架构或版本不匹配。'
installed=$(dpkg-query -W -f='${Version}' toonflow)
dpkg --compare-versions "$version" ge "$installed" || fail '不能降级已安装的 Toonflow。'
DEBIAN_FRONTEND=noninteractive apt-get -y --no-remove --reinstall install "$package"
