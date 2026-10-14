# Word Plain Text Paste for Hermes Desktop

[中文说明](#中文说明) · [MIT License](LICENSE)

An unofficial Hermes Desktop plugin for the macOS issue where Word text is pasted as an image. **Version 1.1.0 is explicitly one-shot: ordinary paste is never automatically converted.**

## Why automatic conversion was removed

A real image can share the clipboard with a title, caption, filename or source URL. Versions 1.0.x treated any meaningful text plus image as text, which could suppress an image the user intended to paste in Hermes. The old heuristic was too broad. Clipboard formats alone do not reliably identify user intent.

Version 1.1.0 removes the persistent automatic mode and ignores its saved `enabled` setting. The plugin installs a paste filter only after you explicitly request one text paste. It does not change the macOS system clipboard or listen in other applications. Reports of image-paste failures in other applications require separate OS/application verification; this project does not claim that changing this plugin alone fixes a system-wide clipboard problem.

## Install or upgrade on macOS

Download **Code → Download ZIP**, extract it, open Terminal in the extracted folder and run:

```sh
zsh install.command
```

GitHub source ZIPs may not preserve executable flags. For upgrades, first use the previous package's uninstaller, or back up and move the existing `word-plain-paste` plugin directory; the installer refuses to overwrite different files.

The plugin lives at `${HERMES_HOME:-$HOME/.hermes}/desktop-plugins/word-plain-paste/`. Hermes normally reloads it automatically; otherwise use `⌘K` → **Reload desktop plugins**, or restart Hermes.

## Use

**Normal image paste:** paste with `⌘V` as usual. Do not click the text-conversion button. The plugin leaves Hermes's native behavior alone.

**Word text pasted as an image:**

1. Copy the desired text in Word.
2. Switch to Hermes, then click **Word 转文字 · 用一次** in the status bar.
3. Focus the message input and press `⌘V` once.

The request is consumed by the next eligible composer paste, including a plain-text or image-only paste. Clicking the button again, pressing Escape, switching applications, or waiting 30 seconds cancels it. It is not restored after reload.

While explicitly armed, mixed text/image data is forwarded to Hermes as text only. Pure images stay on the native image path. Data-image URLs and absolute image paths are excluded from text conversion. Embedded images within mixed Word content are omitted only for the explicitly requested text paste.

## Uninstall

Run `zsh uninstall.command`, or disable the plugin in Hermes's plugin settings. The scripts refuse to overwrite/delete files that differ from the package and preserve unrelated files.

## Scope and implementation

Uses Hermes's [runtime disk-plugin loader](https://github.com/NousResearch/hermes-agent/blob/main/apps/desktop/src/plugins/README.md). It relies on the internal `composer-rich-input` DOM marker and a mounted status-bar component; future Hermes changes may require updates.

No polling, system-clipboard writes, network requests, clipboard logs, or Accessibility permission. A temporary window listener handles a single explicit composer paste, forwarding text-only `DataTransfer` data to the existing Hermes handler. It cancels the original event only when the host accepts the replacement, and skips non-cancelable events. Drafts, selection, undo and large-paste policy remain the host's responsibility.

## Verification

Node.js 22.12+:

```sh
npm install
npm test
```

**37 passing React/jsdom checks**, including ordinary images with captions/filenames, old-preference migration, one-shot consumption, timeout, app switch, cancellation, two immediate paste events, original clipboard immutability and unrelated input fields. Clipboard constructors and editing commands are simulated in the DOM suite. See [VALIDATION.md](VALIDATION.md) for manual-version limits.

The optional Electron harness needs `npm install --no-save electron@40`, then `npm run test:electron`. Its standalone process could not launch in the restricted authoring environment.

## Related upstream work

[Issue #42280](https://github.com/NousResearch/hermes-agent/issues/42280), [duplicate #80400](https://github.com/NousResearch/hermes-agent/issues/80400), and existing proposals [#42288](https://github.com/NousResearch/hermes-agent/pull/42288) / [#42888](https://github.com/NousResearch/hermes-agent/pull/42888). This is a community workaround alongside upstream work, not an official fix or a claim to have discovered the cause first.

## 中文说明

**v1.1.0 已取消常驻自动转换。** 旧版会把“图片＋标题/说明”等内容也转成文字，可能影响 Hermes 中真正的图片粘贴。这是原先判断范围过宽的问题。

- 平时粘贴图片：直接 `⌘V`，不点插件按钮。
- 从 Word 粘贴文字：先复制，切到 Hermes，点击状态栏 **Word 转文字 · 用一次**，再到消息框按一次 `⌘V`。
- 下一次粘贴后自动恢复。再次点击、按 Esc、切换应用或超过 30 秒也会取消；不会记住旧版的自动开关。

插件只监听 Hermes 的消息输入框，不改写系统剪贴板。微信等其他应用也不能粘贴图片时，需要另外检查系统剪贴板或图片来源，不能据此断定这个插件已经解决了全系统问题。

安装：下载并解压，在该目录的终端运行 `zsh install.command`；卸载运行 `zsh uninstall.command`。升级前先卸载旧版或备份并移走旧插件目录。

## Changelog

### 1.1.0

- Remove persistent automatic text priority; require a one-shot user request.
- Consume the request even for a plain-text/image-only paste; ignore old saved preferences.
- Cancel on app switch, Escape, timeout, second click, or unload.
- Add image-metadata and one-shot regressions; 37 checks pass.

### 1.0.1

- Preserve original paste when the host declines the replacement.
- Skip non-cancelable events; 28 checks passed for the old automatic policy.
