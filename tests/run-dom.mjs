import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const resolve = createRequire(process.env.HERMES_TEST_MODULES
  ? join(process.env.HERMES_TEST_MODULES, '..', 'package.json')
  : join(root, 'package.json'))
const { build } = resolve('esbuild')
const { JSDOM } = resolve('jsdom')
const bundle = await build({
  stdin: { contents: readFileSync(join(root, 'tests/fixture.js'), 'utf8'),
    resolveDir: join(root, 'tests'), sourcefile: 'fixture.js' },
  bundle: true, platform: 'browser', format: 'iife', write: false,
  nodePaths: process.env.HERMES_TEST_MODULES ? [process.env.HERMES_TEST_MODULES] : [],
  define: { 'process.env.NODE_ENV': '"production"' }
})
const dom = new JSDOM('<!doctype html><div id="editor-root"></div><div id="status-root"></div><textarea id="other"></textarea>', {
  runScripts: 'outside-only', pretendToBeVisual: true
})
const win = dom.window
// jsdom lacks clipboard constructors and the native editing command. These
// narrow test doubles model their interface; this suite tests DOM/React event
// routing and lifecycle, and does not claim to be an OS clipboard end-to-end test.
win.DataTransfer = class {
  constructor() {
    this.values = new Map(); this.files = []
    this.files.item = index => this.files[index] ?? null
    this.items = []
    this.items.add = file => {
      this.files.push(file)
      this.items.push({ kind: 'file', type: file.type, getAsFile: () => file })
    }
  }
  setData(type, value) {
    if (type === 'text') type = 'text/plain'
    this.values.set(type, String(value))
  }
  getData(type) { return this.values.get(type === 'text' ? 'text/plain' : type) || '' }
}
win.ClipboardEvent = class extends win.Event {
  constructor(type, options) { super(type, options); this.clipboardData = options.clipboardData }
}
win.document.execCommand = (command, unused, text) => {
  if (command !== 'insertText') throw new Error('Unexpected editing command')
  const range = win.getSelection().getRangeAt(0)
  range.deleteContents()
  const node = win.document.createTextNode(text)
  range.insertNode(node); range.setStartAfter(node); range.collapse(true)
  return true
}
win.eval(bundle.outputFiles[0].text)
const results = await win.__testPromise
results.engine = 'jsdom + React; clipboard/editing interfaces simulated'
console.log(JSON.stringify(results, null, 2))
dom.window.close()
process.exit(results.failed ? 1 : 0)
