import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const resolve = createRequire(process.env.HERMES_TEST_MODULES
  ? join(process.env.HERMES_TEST_MODULES, '..', 'package.json')
  : join(root, 'package.json'))
const { build } = resolve('esbuild')
const scratch = mkdtempSync(join(tmpdir(), 'hermes-word-paste-test-'))
const fixture = readFileSync(join(root, 'tests/fixture.js'), 'utf8')
await build({
  stdin: { contents: fixture, resolveDir: join(root, 'tests'), sourcefile: 'fixture.js' },
  bundle: true, platform: 'browser', format: 'iife',
  nodePaths: process.env.HERMES_TEST_MODULES ? [process.env.HERMES_TEST_MODULES] : [],
  outfile: join(scratch, 'fixture.js'), define: { 'process.env.NODE_ENV': '"production"' }
})
writeFileSync(join(scratch, 'fixture.html'), '<!doctype html><meta charset="utf-8"><div id="editor-root"></div><div id="status-root"></div><textarea id="other"></textarea><script src="fixture.js"></script>')
writeFileSync(join(scratch, 'runner.cjs'), `
const { app, BrowserWindow } = require('electron')
app.whenReady().then(async () => {
  try {
    const win = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true, sandbox: true } })
    await win.loadFile(${JSON.stringify(join(scratch, 'fixture.html'))})
    const result = await win.webContents.executeJavaScript('window.__testPromise')
    console.log(JSON.stringify(result, null, 2))
    app.exit(result.failed ? 1 : 0)
  } catch (err) { console.error(err); app.exit(1) }
})
`)
const binary = resolve('electron')
const testEnvironment = { ...process.env }
delete testEnvironment.ELECTRON_RUN_AS_NODE
const result = spawnSync(binary, [join(scratch, 'runner.cjs')], {
  encoding: 'utf8', env: testEnvironment, timeout: 45000
})
process.stdout.write(result.stdout || '')
process.stderr.write(result.stderr || '')
if (result.error) console.error(result.error.message)
if (result.signal) console.error(`Electron exited with signal ${result.signal}`)
process.exit(result.status ?? 1)
