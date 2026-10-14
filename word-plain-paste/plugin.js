/** Word Plain Text Paste v1.0.1 — MIT. Hermes Desktop runtime plugin. */
import { useEffect, useState } from 'react'
import { jsx } from 'react/jsx-runtime'

export const ID = 'word-plain-paste'
export const EDITOR_SELECTOR = '[data-slot="composer-rich-input"][contenteditable="true"]'

/** Only intervene on mixed text/image pastes in Hermes's message editor. */
export function textForMixedPaste(clipboard) {
  if (!clipboard) return null
  const text = clipboard.getData('text/plain') || clipboard.getData('text')
  if (!text || !text.trim()) return null
  // A copied image can carry its own data URL or file path as the text flavor.
  // Those should continue through Hermes's image attachment handling.
  if (/^\s*data:image\//i.test(text)) return null
  if (/^\s*(?:file:\/\/|\/|[a-z]:[\\/]).*\.(?:png|jpe?g|gif|webp|bmp|tiff?|heic|avif)\s*$/i.test(text)) return null
  const items = Array.from(clipboard.items || [])
  const files = Array.from(clipboard.files || [])
  const hasImage = items.some(item => item.kind === 'file' && /^image\//i.test(item.type)) ||
    files.some(file => /^image\//i.test(file.type)) ||
    /<img\b[^>]*?\bsrc\s*=\s*["']data:image\//i.test(clipboard.getData('text/html'))
  return hasImage ? text : null
}

/** Replace the mixed event with text-only data, using the host's own paste path.
 * This preserves Hermes's draft updates, undo history, URL chips and selection.
 * It never reads/writes the system clipboard or inserts HTML into the editor.
 */
export function installPasteFilter(win, onConverted = () => {}) {
  const forwarded = new WeakSet()
  function onPaste(event) {
    if (forwarded.has(event) || event.defaultPrevented || !event.cancelable) return
    const editor = event.target?.closest?.(EDITOR_SELECTOR)
    if (!editor || editor.getAttribute('aria-disabled') === 'true') return
    let text
    try {
      text = textForMixedPaste(event.clipboardData)
    } catch {
      return // Fail open if a host or clipboard implementation changes.
    }
    if (text === null) return
    let replacement
    try {
      const data = new win.DataTransfer()
      data.setData('text/plain', text)
      replacement = new win.ClipboardEvent('paste', {
        clipboardData: data, bubbles: true, cancelable: true, composed: true
      })
      if (replacement.clipboardData?.getData('text/plain') !== text) return
    } catch {
      return
    }
    forwarded.add(replacement)
    editor.dispatchEvent(replacement)
    // A synthetic paste has no native insertion default. Only suppress the
    // original after the host has accepted the replacement. If the editor's
    // handler is absent or rejects synthetic events, retain its native path.
    if (!replacement.defaultPrevented) return
    event.preventDefault()
    event.stopImmediatePropagation()
    onConverted()
  }
  win.addEventListener('paste', onPaste, true)
  return () => win.removeEventListener('paste', onPaste, true)
}

function PasteStatus({ storage }) {
  const [enabled, setEnabled] = useState(() => storage.get('enabled', true) !== false)
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!enabled) return
    return installPasteFilter(window, () => setCount(value => value + 1))
  }, [enabled])
  return jsx('button', {
    type: 'button',
    'aria-label': enabled ? '关闭 Word 文字粘贴修复' : '开启 Word 文字粘贴修复',
    'aria-pressed': enabled,
    title: `${enabled ? '已开启' : '已暂停'}：文字与图片同时存在时优先粘贴文字。纯图片照常粘贴。已修复 ${count} 次；点击切换。`,
    className: 'inline-flex h-full items-center px-2 text-[0.6875rem] text-(--ui-text-secondary) hover:bg-(--chrome-action-hover)',
    onClick: () => {
      const next = !enabled
      storage.set('enabled', next)
      setEnabled(next)
    },
    children: enabled ? `Word 文字粘贴 ✓${count ? ` · ${count}` : ''}` : 'Word 文字粘贴 · 暂停'
  })
}

export default {
  id: ID,
  name: 'Word 文字粘贴修复',
  register(ctx) {
    ctx.register({
      id: 'status', area: 'statusBar.right', order: 130,
      render: () => jsx(PasteStatus, { storage: ctx.storage })
    })
  }
}
