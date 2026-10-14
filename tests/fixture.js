import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import plugin, { textForMixedPaste, installPasteFilter } from '../word-plain-paste/plugin.js'

window.__testPromise = (async () => {
  const results = []
  function assert(ok, message) { if (!ok) throw new Error(message) }
  async function test(name, run) {
    try { await run(); results.push({ name, passed: true }) }
    catch (error) { results.push({ name, passed: false, error: error.message }) }
  }
  const image = new File([new Uint8Array([137, 80, 78, 71])], 'word.png', { type: 'image/png' })
  function data(text, options = {}) {
    const value = new DataTransfer()
    if (text !== null) value.setData('text/plain', text)
    if (options.html) value.setData('text/html', options.html)
    if (options.image !== false) value.items.add(image)
    return value
  }
  let attachmentCount = 0
  let hostPasteCount = 0
  let draft = ''
  let undoPoints = []
  let lastHostData
  // React delegates paste on the root, as Hermes does. Reproduce its
  // image-first decision and draft/undo callbacks, without loading a gateway.
  function onHostPaste(event) {
    hostPasteCount++
    lastHostData = event.clipboardData
    event.preventDefault()
    if (!event.clipboardData) return
    const images = Array.from(event.clipboardData.items).filter(item => item.kind === 'file' && /^image\//.test(item.type))
    if (images.length) { attachmentCount += images.length; return }
    const text = event.clipboardData.getData('text').trim()
    if (!text) return
    undoPoints.push(event.currentTarget.textContent)
    document.execCommand('insertText', false, text)
    draft = event.currentTarget.textContent
  }
  const editorRoot = createRoot(document.querySelector('#editor-root'))
  editorRoot.render(createElement('div', {
    'data-slot': 'composer-rich-input', contentEditable: true,
    suppressContentEditableWarning: true, onPaste: onHostPaste
  }))
  await new Promise(resolve => setTimeout(resolve, 30))
  const editor = document.querySelector('[data-slot="composer-rich-input"]')
  function reset(text = '') {
    attachmentCount = 0; hostPasteCount = 0; draft = text; undoPoints = []
    editor.textContent = text
    editor.focus()
    const range = document.createRange()
    range.selectNodeContents(editor); range.collapse(false)
    getSelection().removeAllRanges(); getSelection().addRange(range)
  }
  function paste(clipboard, target = editor) {
    const event = new ClipboardEvent('paste', { clipboardData: clipboard, bubbles: true, cancelable: true })
    target.dispatchEvent(event)
    return event
  }
  await test('baseline reproduces image-first bug', () => {
    reset(); paste(data('来自 Word 的中文'))
    assert(attachmentCount === 1 && !editor.textContent, 'baseline did not attach image')
  })
  let conversions = 0
  let dispose = installPasteFilter(window, () => conversions++)
  await test('Word text + image becomes text through React host handler once', () => {
    reset(); paste(data('来自 Word 的中文 😀\n第二行', { html: '<p>来自 Word 的中文</p>' }))
    assert(attachmentCount === 0 && hostPasteCount === 1, 'image attached or duplicate paste')
    assert(draft === '来自 Word 的中文 😀\n第二行' && conversions === 1, 'draft/text mismatch')
    assert(lastHostData.files.length === 0 && lastHostData.getData('text/html') === '', 'image or HTML leaked')
  })
  await test('HTML-embedded image is stripped with its mixed text', () => {
    reset(); paste(data('HTML Word 文本', { image: false, html: '<p>HTML Word 文本<img src="data:image/png;base64,iVBORw0KGgo="></p>' }))
    assert(conversions === 2 && draft === 'HTML Word 文本' && !lastHostData.getData('text/html'), 'HTML image not stripped')
  })
  await test('pure screenshots retain native image attachment', () => {
    reset(); paste(data(null))
    assert(attachmentCount === 1 && hostPasteCount === 1 && conversions === 2, 'screenshot intercepted')
  })
  await test('plain text stays on native path', () => {
    reset(); paste(data('普通文字', { image: false }))
    assert(draft === '普通文字' && conversions === 2, 'pure text intercepted')
  })
  await test('whitespace-only text preserves image', () => {
    reset(); paste(data(' \n\t'))
    assert(attachmentCount === 1 && conversions === 2, 'whitespace intercepted')
  })
  await test('empty clipboard keeps native behavior', () => {
    reset(); paste(data(null, { image: false }))
    assert(!draft && !attachmentCount && conversions === 2, 'empty paste changed')
  })
  await test('image data URL keeps native behavior', () => {
    assert(textForMixedPaste(data('data:image/png;base64,iVBORw0KGgo=')) === null, 'data URL intercepted')
  })
  await test('image file URI keeps native behavior', () => {
    assert(textForMixedPaste(data('file:///tmp/screenshot.png')) === null, 'file URI intercepted')
  })
  await test('image absolute path keeps native behavior', () => {
    assert(textForMixedPaste(data('/tmp/screenshot.png')) === null, 'path intercepted')
  })
  await test('paste outside composer is untouched', () => {
    reset(); let received
    const other = document.querySelector('#other')
    other.addEventListener('paste', event => { received = event.clipboardData }, { once: true })
    const original = data('其他输入框')
    paste(original, other)
    assert(received === original && received.files.length === 1, 'outside paste modified')
  })
  await test('disabled composer is untouched', () => {
    reset(); editor.setAttribute('contenteditable', 'false')
    paste(data('只读'))
    editor.setAttribute('contenteditable', 'true')
    assert(attachmentCount === 1, 'disabled composer intercepted')
  })
  await test('selection replacement and surrounding text are preserved', () => {
    reset('前缀替换后缀')
    const range = document.createRange()
    range.setStart(editor.firstChild, 2); range.setEnd(editor.firstChild, 4)
    getSelection().removeAllRanges(); getSelection().addRange(range)
    paste(data('新内容'))
    assert(draft === '前缀新内容后缀', 'selection replacement incorrect')
    assert(undoPoints.length === 1 && undoPoints[0] === '前缀替换后缀', 'host undo point missing')
  })
  await test('large multiline Chinese text is forwarded unchanged', () => {
    reset(); const text = '段落\t金额 100 😀\n'.repeat(1500) + '结束'
    paste(data(text))
    assert(draft === text && hostPasteCount === 1, 'large paste truncated or duplicated')
  })
  await test('original clipboard data is not mutated', () => {
    reset(); const original = data('保持剪贴板', { html: '<b>保持剪贴板</b>' })
    paste(original)
    assert(original.files.length === 1 && original.getData('text/html') === '<b>保持剪贴板</b>', 'original mutated')
  })
  await test('missing clipboard data fails open', () => {
    reset(); paste(null)
    assert(textForMixedPaste(null) === null, 'null did not pass through')
  })
  await test('cleanup restores native image-first behavior', () => {
    dispose(); reset(); paste(data('卸载后'))
    assert(attachmentCount === 1 && !draft, 'cleanup did not remove listener')
  })
  await test('reload installs one handler without duplicate insertion', () => {
    dispose = installPasteFilter(window)
    reset(); paste(data('重新加载'))
    assert(draft === '重新加载' && hostPasteCount === 1 && !attachmentCount, 'reload duplicated')
    dispose()
  })
  const settings = new Map()
  let contribution
  plugin.register({
    storage: { get: (key, fallback) => settings.has(key) ? settings.get(key) : fallback,
      set: (key, value) => settings.set(key, value) },
    register: value => { contribution = value }
  })
  const statusRoot = createRoot(document.querySelector('#status-root'))
  statusRoot.render(contribution.render())
  await new Promise(resolve => setTimeout(resolve, 30))
  await test('real plugin registration mounts enabled status button and filter', () => {
    assert(plugin.id === 'word-plain-paste' && contribution.area === 'statusBar.right', 'invalid registration')
    reset(); paste(data('插件已开启'))
    assert(draft === '插件已开启' && !attachmentCount, 'mounted plugin inactive')
  })
  await test('status toggle pauses filtering and persists setting', async () => {
    document.querySelector('#status-root button').click()
    await new Promise(resolve => setTimeout(resolve, 20))
    reset(); paste(data('已暂停'))
    assert(attachmentCount === 1 && settings.get('enabled') === false, 'toggle did not pause')
  })
  await test('status toggle re-enables filtering', async () => {
    document.querySelector('#status-root button').click()
    await new Promise(resolve => setTimeout(resolve, 20))
    reset(); paste(data('重新开启'))
    assert(draft === '重新开启' && settings.get('enabled') === true, 'toggle did not resume')
  })
  await test('unmount removes all paste interception', () => {
    statusRoot.unmount(); reset(); paste(data('禁用插件'))
    assert(attachmentCount === 1 && !draft, 'unmount listener leaked')
  })
  editorRoot.unmount()
  return { engine: navigator.userAgent, passed: results.filter(result => result.passed).length,
    failed: results.filter(result => !result.passed).length, results }
})()
