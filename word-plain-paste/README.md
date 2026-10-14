# Word 文字粘贴修复 · Hermes 桌面插件

在 Hermes 桌面版聊天输入框中，复制内容同时包含文字和图片时，优先按文字粘贴。适用于 Word 文本被误识别为图片的情况。

## 使用

安装后，Hermes 状态栏出现 **Word 文字粘贴 ✓**。从 Word 复制文字，回到 Hermes 按平常的 `⌘V` 即可。按钮上的数字表示本窗口本次加载以来修复了多少次粘贴。

点击这个按钮可暂停或重新开启；开关状态会保存在 Hermes 本地。也可在 Hermes 的 Plugins 设置中禁用整个插件。

只有图片、空剪贴板、普通纯文本和其他应用输入框不会被此插件接管。文字内容本身若是图片的 data URL 或绝对文件路径，也保留原有图片处理。混合内容中嵌入的真实图片不会随文字一并附上；需要粘贴它们时，先暂停修复或单独复制图片。

## 安装

在上一级文件夹中双击 `install.command`。默认安装位置：

```text
~/.hermes/desktop-plugins/word-plain-paste/plugin.js
```

使用自定义 Hermes 主目录时，请先设置 `HERMES_HOME`，或手动把本文件夹复制到该主目录的 `desktop-plugins/` 下。文件夹名必须是 `word-plain-paste`。

Hermes 会监测插件目录并自动加载。如果状态栏按钮没有出现，在 Hermes 按 `⌘K`，搜索 **Reload desktop plugins** 并执行，或重新打开 Hermes。此插件跟随状态栏组件挂载；状态栏未显示时，修复监听器也不会运行。

## 卸载

双击上一级的 `uninstall.command`，或在 Hermes 中禁用插件。卸载脚本只移除与本包一致的文件；发现改动会停止，避免覆盖或删除你的自定义版本。

## 实现与兼容性

- 使用 Hermes 官方桌面插件加载机制，无需修改 Hermes 源码或应用包。
- 在窗口捕获阶段筛选混合粘贴事件，构建仅含 `text/plain` 的新事件，交回 Hermes 自己的粘贴处理器。因此输入框选区、草稿更新、撤销和 URL 处理仍由 Hermes 实现决定。
- 不轮询、不读取整个系统剪贴板、不修改剪贴板、不记录文字，不联网，不需要辅助功能权限。
- 依赖 Hermes 的 `composer-rich-input` 编辑器标识，以及 Electron 的 `DataTransfer` / `ClipboardEvent`。未来 Hermes 更改这些界面内部结构时可能需要更新插件；它不是官方的粘贴扩展 API。
- 本包根据 Hermes 桌面源码制作，已在实际运行的 Hermes v0.19.1 中完成 Word → Hermes 粘贴及撤销验证。完整记录见安装包中的 `VALIDATION.md`。

官方插件说明：https://github.com/NousResearch/hermes-agent/blob/main/apps/desktop/src/plugins/README.md

## License

MIT
