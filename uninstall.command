#!/bin/zsh
set -euo pipefail
package_dir=${0:A:h}
source_dir="$package_dir/word-plain-paste"
hermes_plugin_home="${HERMES_HOME:-$HOME/.hermes}"
target_dir="$hermes_plugin_home/desktop-plugins/word-plain-paste"
for filename in plugin.js README.md LICENSE; do
  if [[ -e "$target_dir/$filename" ]] && ! cmp -s "$source_dir/$filename" "$target_dir/$filename"; then
    print -u2 -- "卸载停止：$target_dir/$filename 已被修改，请先备份并手动移除。"
    exit 1
  fi
done
for filename in plugin.js README.md LICENSE; do
  if [[ -f "$target_dir/$filename" ]]; then rm -- "$target_dir/$filename"; fi
done
if [[ -d "$target_dir" ]]; then
  if ! rmdir "$target_dir"; then
    print -- "插件文件已移除，目录内还有其他文件，因此保留目录。"
  fi
fi
print -- "已卸载 Word 文字粘贴修复。若按钮暂未消失，在 Hermes 按 ⌘K，执行 Reload desktop plugins。"
