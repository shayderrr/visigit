import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getGitData, getCommitDetail, getLastFileCommit, GitData } from './git-service'
import { readdir, readFile, rm } from 'fs/promises'
import { statSync, mkdtempSync, existsSync } from 'fs'
import simpleGit from 'simple-git'
import { tmpdir } from 'os'

let nimApiKey = ''
let githubToken = ''

function isGitHubUrl(input: string): boolean {
  return /github\.com\/[^/]+\/[^/]+/.test(input)
}

async function readDirRecursive(
  dir: string,
  basePath: string = ''
): Promise<{ path: string; name: string; type: 'file' | 'dir' | 'symlink'; size?: number }[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const results: { path: string; name: string; type: 'file' | 'dir' | 'symlink'; size?: number }[] = []

  for (const e of entries) {
    if (e.name.startsWith('.')) continue
    const relPath = basePath ? `${basePath}/${e.name}` : e.name
    const fullPath = join(dir, e.name)
    const type = e.isDirectory() ? 'dir' as const : e.isSymbolicLink() ? 'symlink' as const : 'file' as const
    const size = e.isFile() ? statSync(fullPath).size : undefined
    results.push({ path: relPath, name: e.name, type, size })

    if (e.isDirectory()) {
      const children = await readDirRecursive(fullPath, relPath)
      results.push(...children)
    }
  }

  return results
}

let mainWindow: BrowserWindow | null = null
const clonedRepos = new Map<string, string>()

function sendProgress(stage: string, percent: number, message: string): void {
  mainWindow?.webContents.send('git:progress', { stage, percent, message })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#000000',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

async function cleanupClonedRepos(): Promise<void> {
  for (const dir of clonedRepos.values()) {
    try {
      if (existsSync(dir)) {
        await rm(dir, { recursive: true, force: true })
      }
    } catch {}
  }
  clonedRepos.clear()
}

async function ensureClone(url: string): Promise<string> {
  const existing = clonedRepos.get(url)
  if (existing && existsSync(existing)) return existing

  const tempDir = mkdtempSync(join(tmpdir(), 'visigit-'))
  clonedRepos.set(url, tempDir)

  sendProgress('clone', 10, 'Connecting to repository...')

  let pct = 10
  const timer = setInterval(() => {
    pct = Math.min(85, pct + 3)
    sendProgress('clone', pct, 'Cloning repository...')
  }, 400)

  let cloneUrl = url
  if (githubToken && isGitHubUrl(url)) {
    cloneUrl = url.replace('https://github.com/', `https://${githubToken}@github.com/`)
  }
  await simpleGit().clone(cloneUrl, tempDir, ['--depth=200', '--no-single-branch'])

  clearInterval(timer)
  sendProgress('clone', 95, 'Reading branches...')
  return tempDir
}

async function resolveSource(input: string): Promise<string> {
  if (isGitHubUrl(input)) {
    return await ensureClone(input)
  }
  return input
}

async function readLocalFile(source: string, filePath: string) {
  const fullPath = join(source, filePath)
  const content = await readFile(fullPath, 'utf-8')
  const stats = statSync(fullPath)
  return {
    name: filePath.split('/').pop() || filePath,
    path: filePath,
    content,
    encoding: 'utf-8' as const,
    size: stats.size,
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.visigit')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  ipcMain.handle('git:select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: 'Select a Git Repository',
      buttonLabel: 'Open Repository',
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })

  ipcMain.handle('git:open', async (_, input: string, branch?: string): Promise<GitData | null> => {
    try {
      const source = await resolveSource(input)
      sendProgress('analyze', 97, 'Analyzing commits...')
      const result = await getGitData(source, branch)
      sendProgress('done', 100, 'Ready')
      return result
    } catch (err) {
      console.error('Git data error:', err)
      throw err
    }
  })

  ipcMain.handle('git:get-commit-detail', async (_, source: string, commitHash: string) => {
    try {
      const local = await resolveSource(source)
      return await getCommitDetail(local, commitHash)
    } catch (err) {
      console.error('Commit detail error:', err)
      return null
    }
  })

  ipcMain.handle('git:get-tree', async (_, source: string, _branch?: string) => {
    try {
      const local = await resolveSource(source)
      return await readDirRecursive(local)
    } catch (err) {
      console.error('Get tree error:', err)
      throw err
    }
  })

  ipcMain.handle('git:get-file', async (_, source: string, filePath: string, _ref?: string) => {
    try {
      const local = await resolveSource(source)
      return readLocalFile(local, filePath)
    } catch (err) {
      console.error('Get file error:', err)
      throw err
    }
  })

  ipcMain.handle('git:get-last-file-commit', async (_, source: string, filePath: string, branch?: string) => {
    try {
      const local = await resolveSource(source)
      return await getLastFileCommit(local, filePath, branch)
    } catch (err) {
      console.error('Get last file commit error:', err)
      return null
    }
  })

  ipcMain.handle('ai:chat', async (_, prompt: string): Promise<string> => {
    if (!nimApiKey) return 'No API key configured. Open Settings to add your NVIDIA NIM API key.'
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nimApiKey}`,
        },
        body: JSON.stringify({
          model: 'z-ai/glm-5.2',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 256,
          temperature: 0.3,
        }),
      })
      if (!res.ok) {
        const err = await res.text()
        console.error('NIM API error:', res.status, err)
        return 'AI request failed'
      }
      const data = await res.json()
      return data.choices?.[0]?.message?.content || 'No response'
    } catch (err) {
      console.error('NIM API error:', err)
      return 'AI request failed'
    }
  })

  ipcMain.handle('ai:set-key', async (_, key: string) => {
    nimApiKey = key
  })

  ipcMain.handle('ai:has-key', async () => {
    return nimApiKey.length > 0
  })

  ipcMain.handle('github:set-token', async (_, token: string) => {
    githubToken = token
  })

  ipcMain.handle('github:has-token', async () => {
    return githubToken.length > 0
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', async () => {
  await cleanupClonedRepos()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  await cleanupClonedRepos()
})
