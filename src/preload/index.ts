import { contextBridge, ipcRenderer } from 'electron'

const api = {
  selectFolder: (): Promise<string | null> => ipcRenderer.invoke('git:select-folder'),
  openRepo: (input: string, branch?: string): Promise<any> => ipcRenderer.invoke('git:open', input, branch),
  getCommitDetail: (source: string, commitHash: string): Promise<any> =>
    ipcRenderer.invoke('git:get-commit-detail', source, commitHash),
  getTree: (source: string, branch?: string): Promise<any> =>
    ipcRenderer.invoke('git:get-tree', source, branch),
  getFile: (source: string, filePath: string, ref?: string): Promise<any> =>
    ipcRenderer.invoke('git:get-file', source, filePath, ref),
  getLastFileCommit: (source: string, filePath: string, branch?: string): Promise<any> =>
    ipcRenderer.invoke('git:get-last-file-commit', source, filePath, branch),
  aiChat: (prompt: string): Promise<string> => ipcRenderer.invoke('ai:chat', prompt),
  aiSetKey: (key: string): Promise<void> => ipcRenderer.invoke('ai:set-key', key),
  aiHasKey: (): Promise<boolean> => ipcRenderer.invoke('ai:has-key'),
  githubSetToken: (token: string): Promise<void> => ipcRenderer.invoke('github:set-token', token),
  githubHasToken: (): Promise<boolean> => ipcRenderer.invoke('github:has-token'),
  onProgress: (cb: (data: { stage: string; percent: number; message: string }) => void) => {
    const handler = (_: any, data: any) => cb(data)
    ipcRenderer.on('git:progress', handler)
    return () => { ipcRenderer.removeListener('git:progress', handler) }
  },
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electronAPI', api)
} else {
  ;(window as any).electronAPI = api
}
