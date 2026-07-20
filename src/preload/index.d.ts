export interface ElectronAPI {
  selectFolder: () => Promise<string | null>
  openRepo: (input: string, branch?: string) => Promise<any>
  getCommitDetail: (source: string, commitHash: string) => Promise<any>
  getTree: (source: string, branch?: string) => Promise<any>
  getFile: (source: string, filePath: string, ref?: string) => Promise<any>
  getLastFileCommit: (source: string, filePath: string, branch?: string) => Promise<any>
  aiChat: (prompt: string) => Promise<string>
  aiSetKey: (key: string) => Promise<void>
  aiHasKey: () => Promise<boolean>
  onProgress: (cb: (data: { stage: string; percent: number; message: string }) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
