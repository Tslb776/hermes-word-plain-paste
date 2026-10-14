# Word Plain Text Paste for Hermes Desktop

[中文说明](#中文说明) · [MIT License](LICENSE)

A small, unofficial Hermes Desktop plugin for the macOS problem where copying text from Microsoft Word and pasting it into a chat creates an image attachment instead of editable text.

When clipboard data contains **both meaningful text and an image representation**, this plugin forwards a text-only paste to Hermes's existing handler. Image-only screenshots retain the normal attachment path. No Hermes source rebuild, background clipboard polling, network requests, or Accessibility permission is needed.

## Install on macOS

1. Download this repository using **Code → Download ZIP** and extract it.
2. Double-click **install.command**. If Finder does not launch it, open Terminal in this folder and run `zsh install.command`.
3. Look for **Word 文字粘贴 ✓** in the Hermes status bar. Continue copying from Word and pasting with `⌘V`.

Hermes normally loads disk plugins automatically. If the status button does not appear, press `⌘K` in Hermes and run **Reload desktop plugins**, or restart Hermes.

Manual installation:

```sh
mkdir -p "${HERMES_HOME:-$HOME/.hermes}/desktop-plugins"
cp -R word-plain-paste "${HERMES_HOME:-$HOME/.hermes}/desktop-plugins/"
```

The plugin folder must remain named `word-plain-paste`. For a custom Hermes home, set `HERMES_HOME` before running the installer or copy the folder into that home's `desktop-plugins` directory.

## Controls and behavior

- **Word 文字粘贴 ✓** means enabled. Click to pause; click again to resume. The preference persists locally.
- The number on the button counts accepted conversions since this window loaded the plugin; it does not store clipboard text.
- Text-only, image-only, empty, and non-composer pastes remain on the host's normal path.
- A text payload that is an image data URL or absolute image file path is excluded from conversion.
- When a clipboard intentionally contains text plus real embedded images, this plugin forwards the text only. Pause it or copy the images separately when you want them attached.
- The plugin runs while its status-bar component is mounted. It will not intercept paste while that component is absent.
- Formatting and table layout are handled as plain text; this is not a Word table or document importer.

## Uninstall

Double-click **uninstall.command**, run `zsh uninstall.command`, or disable the plugin in Hermes's plugin settings. The scripts refuse to overwrite/delete files that differ from the downloaded package, and preserve unrelated files in the directory.

## Upstream status

Checked on **2026-10-14**:

- [Issue #42280](https://github.com/NousResearch/hermes-agent/issues/42280) remains open.
- [Issue #80400](https://github.com/NousResearch/hermes-agent/issues/80400) was closed as a **duplicate**, not as a completed fix.
- [PR #42288](https://github.com/NousResearch/hermes-agent/pull/42288) and [PR #42888](https://github.com/NousResearch/hermes-agent/pull/42888) propose text-priority changes but are still open and unmerged.
- The [current main-branch composer](https://github.com/NousResearch/hermes-agent/blob/main/apps/desktop/src/app/chat/composer/index.tsx) now processes text after attaching image blobs, so the original loss-of-text behavior has partially changed. It still attaches the image representation when meaningful text is present. This plugin suppresses that unwanted attachment.

This is a community workaround. Existing upstream authors already identified the cause and proposed fixes; this project does not claim to have discovered it first. If an official version provides the desired text-only behavior, disable this plugin and test that version first.

## Compatibility and implementation

**Manually verified:** macOS, Microsoft Word for Mac, Hermes Desktop **v0.19.1**. A three-line Chinese/number test was copied in Word and pasted as editable Hermes text with no image attachment. One `⌘Z` removed the whole paste. The original user also confirmed the issue was resolved.

The plugin uses the official [runtime desktop-plugin mechanism](https://github.com/NousResearch/hermes-agent/blob/main/apps/desktop/src/plugins/README.md), with one uncompiled ESM `plugin.js`. It targets the internal `composer-rich-input` contenteditable marker; Hermes does not provide a dedicated public paste-filter API here. Future UI changes may require a plugin update. Other versions/platforms have not been manually verified.

A window capture listener intercepts only mixed text/image composer paste events. It creates a new `DataTransfer` containing `text/plain`, then dispatches a replacement `ClipboardEvent` to the same editor. Hermes's own handler retains responsibility for draft synchronization, insertion, undo, URL references, and large-paste handling. The original system clipboard is not rewritten; pasted HTML is never inserted by the plugin. Disabling or unloading the status component removes the listener.

## Tests

Requires Node.js 22.12+.

```sh
npm install
npm test
```

The included suite has **22 passing DOM/React integration checks** covering the reproduced bug, mixed flavors, HTML image representations, Chinese/emoji/multiline/large text, selected text, clipboard immutability, ordinary screenshots, toggling, persistence, reload, and cleanup.

DOM tests use real React and jsdom. Clipboard constructors and the editing command are narrow test doubles; they are not OS clipboard end-to-end tests. See [VALIDATION.md](VALIDATION.md) for the separate real Word → Hermes verification.

An optional standalone Electron test harness is included. Install Electron separately with `npm install --no-save electron@40`, then run `npm run test:electron` in a desktop environment that permits launching it. That harness was not successfully run in the restricted authoring environment.

## 中文说明

这是一个 **Hermes 桌面版社区插件**，解决 Mac 上从 Word 复制文字，粘到 Hermes 后变成图片的问题。复制内容同时包含文字和图片时，优先把文字交给 Hermes 的原有粘贴处理器；只复制截图时保留图片处理。

安装：点击本页 **Code → Download ZIP**，解压后双击 `install.command`。状态栏出现 **Word 文字粘贴 ✓** 后，照常使用 `⌘C → ⌘V` 即可。若未出现，在 Hermes 按 `⌘K`，执行 **Reload desktop plugins**。

点击状态栏按钮可暂停/开启。需要粘贴文字中嵌入的真实图片时，请先暂停或单独复制图片。卸载时双击 `uninstall.command`，也可在 Hermes 插件设置中禁用。

已经在 Hermes v0.19.1 实测 Word 三行中文粘贴和整次撤销。上游已有修复 PR，但截至 2026-10-14 尚未合并；最新主分支仍会在混合粘贴时附加图片，所以这个插件目前仍有用途。它不联网、不记录剪贴板文字、不需要辅助功能权限。

如遇兼容问题，请在本仓库提交 issue，说明 macOS、Hermes、Word 版本及粘贴的是普通段落还是表格；可用非敏感测试文本复现。
