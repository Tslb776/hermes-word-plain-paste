#!/bin/zsh
set -euo pipefail
package_dir=${0:A:h}
source_dir="$package_dir/word-plain-paste"
hermes_plugin_home="${HERMES_HOME:-$HOME/.hermes}"
target_dir="$hermes_plugin_home/desktop-plugins/word-plain-paste"
for filename in plugin.js README.md LICENSE; do
  if [[ -e "$target_dir/$filename" ]] && ! cmp -s "$source_dir/$filename" "$target_dir/$filename"; then
    print -u2 -- "安装停止：已有不同版本 $target_dir/$filename。请先备份并移走该插件目录。"
    exit 1
  fi
done
mkdir -p "$target_dir"
for filename in plugin.js README.md LICENSE; do
  cp "$source_dir/$filename" "$target_dir/$filename"
done
print -- "已安装 Word 文字粘贴修复：$target_dir"
print -- "回到 Hermes，查看状态栏的「Word 转文字 · 用一次」，仅在需要时点击一次。如果没有出现，按 ⌘K，执行 Reload desktop plugins。"
