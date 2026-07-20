import { useState, useEffect, useCallback } from 'react'
import type { FileTreeItem, FileContent } from '../types'

interface FileBrowserProps {
  source: string
  branch?: string
}

interface TreeNode {
  name: string
  path: string
  type: 'file' | 'dir' | 'symlink'
  size?: number
  children: TreeNode[]
  expanded: boolean
}

interface FileCommitInfo {
  hash: string
  author: string
  email: string
  date: string
  message: string
}

function buildTree(items: FileTreeItem[]): TreeNode[] {
  const root: TreeNode[] = []
  const map = new Map<string, TreeNode>()

  const sorted = [...items].sort((a, b) => {
    if (a.type === 'dir' && b.type !== 'dir') return -1
    if (a.type !== 'dir' && b.type === 'dir') return 1
    return a.path.localeCompare(b.path)
  })

  for (const item of sorted) {
    const parts = item.path.split('/')
    const node: TreeNode = {
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size,
      children: [],
      expanded: false,
    }
    map.set(item.path, node)

    if (parts.length === 1) {
      root.push(node)
    } else {
      const parentPath = parts.slice(0, -1).join('/')
      const parent = map.get(parentPath)
      if (parent) {
        parent.children.push(node)
      } else {
        root.push(node)
      }
    }
  }

  return root
}

export default function FileBrowser({ source, branch }: FileBrowserProps) {
  const [tree, setTree] = useState<TreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null)
  const [fileCommit, setFileCommit] = useState<FileCommitInfo | null>(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setSelectedFile(null)
    setFileCommit(null)
    ;(window as any).electronAPI
      .getTree(source, branch)
      .then((items: FileTreeItem[]) => {
        setTree(buildTree(items))
        setLoading(false)
      })
      .catch((err: any) => {
        setError(err?.message || 'Failed to load file tree')
        setLoading(false)
      })
  }, [source, branch])

  const handleFileClick = useCallback(
    (filePath: string) => {
      setFileLoading(true)
      setFileCommit(null)
      Promise.all([
        (window as any).electronAPI.getFile(source, filePath, branch),
        (window as any).electronAPI.getLastFileCommit(source, filePath, branch),
      ])
        .then(([file, commit]: [FileContent, FileCommitInfo | null]) => {
          setSelectedFile(file)
          setFileCommit(commit)
          setFileLoading(false)
        })
        .catch(() => {
          setSelectedFile(null)
          setFileCommit(null)
          setFileLoading(false)
        })
    },
    [source, branch]
  )

  const toggleDir = useCallback((dirPath: string) => {
    setTree((prev) => {
      const toggle = (nodes: TreeNode[]): TreeNode[] =>
        nodes.map((node) => {
          if (node.path === dirPath) {
            return { ...node, expanded: !node.expanded }
          }
          if (node.children.length > 0) {
            return { ...node, children: toggle(node.children) }
          }
          return node
        })
      return toggle(prev)
    })
  }, [])

  const renderTreeItem = (node: TreeNode, depth: number = 0) => {
    const isDir = node.type === 'dir'
    return (
      <div key={node.path}>
        <button
          onClick={() => {
            if (isDir) toggleDir(node.path)
            else handleFileClick(node.path)
          }}
          className={`w-full text-left px-2 py-1 flex items-center gap-2 text-[11px] font-light transition-colors rounded-md ${
            selectedFile?.path === node.path
              ? 'bg-white/[0.08] text-[#f0f0f0]'
              : 'text-[#999999] hover:bg-white/[0.04] hover:text-[#d0d0d0]'
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          {isDir ? (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#555560"
              strokeWidth="2"
              className={`shrink-0 transition-transform duration-200 ${node.expanded ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          ) : (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#555560"
              strokeWidth="2"
              className="shrink-0"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          )}
          <span className="truncate">{node.name}</span>
          {!isDir && node.size !== undefined && (
            <span className="ml-auto text-[9px] text-[#555560] font-mono shrink-0">
              {node.size > 1024
                ? `${(node.size / 1024).toFixed(1)}k`
                : `${node.size}b`}
            </span>
          )}
        </button>
        {isDir && node.expanded && node.children.length > 0 && (
          <div>
            {node.children.map((child) => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const getLanguageHint = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    const map: Record<string, string> = {
      ts: 'TypeScript', tsx: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript',
      py: 'Python', rs: 'Rust', go: 'Go', java: 'Java', c: 'C', cpp: 'C++',
      h: 'Header', css: 'CSS', html: 'HTML', json: 'JSON', yaml: 'YAML',
      yml: 'YAML', md: 'Markdown', toml: 'TOML', sh: 'Shell', bash: 'Shell',
      sql: 'SQL', xml: 'XML', svg: 'SVG',
    }
    return map[ext] || ext.toUpperCase() || 'Text'
  }

  const formatCommitDate = (date: string) => {
    if (!date) return ''
    const d = new Date(date)
    if (isNaN(d.getTime())) return date
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-[#555560] text-sm font-light">
          <div className="w-4 h-4 border border-[#555560] border-t-white/60 rounded-full animate-spin" />
          Loading file tree...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <p className="text-sm text-[#555560] font-light">{error}</p>
          <p className="text-[10px] text-[#555560] font-light">
            File browsing may not be available for GitHub URLs
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full animate-fade-in" style={{ animationDuration: '0.3s' }}>
      <div className="w-72 shrink-0 border-r border-[#1a1a24] flex flex-col bg-[#0a0a0f]">
        <div className="px-3 py-2.5 border-b border-[#1a1a24]">
          <h4 className="text-[9px] text-[#555560] uppercase tracking-[0.15em] font-light">
            Files ({tree.length})
          </h4>
        </div>
        <div className="flex-1 overflow-auto py-1 px-1">
          {tree.map((node) => renderTreeItem(node, 0))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedFile ? (
          <>
            <div className="px-4 py-2.5 border-b border-[#1a1a24] bg-[#0a0a0f]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#555560"
                    strokeWidth="2"
                    className="shrink-0"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="text-[11px] text-[#d0d0d0] font-mono truncate">
                    {selectedFile.path}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[9px] text-[#555560] font-light">
                    {getLanguageHint(selectedFile.name)}
                  </span>
                  <span className="text-[9px] text-[#555560] font-mono">
                    {selectedFile.size > 1024
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                      : `${selectedFile.size} B`}
                  </span>
                </div>
              </div>
              {fileCommit && (
                <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                  <div className="w-4 h-4 rounded-full bg-white/[0.08] flex items-center justify-center text-[7px] text-[#999] font-medium shrink-0">
                    {(fileCommit.author || '?')[0].toUpperCase()}
                  </div>
                  <span className="text-[#999999] font-light">{fileCommit.author}</span>
                  <span className="text-[#555560]">·</span>
                  <span className="text-[#666666] font-light truncate max-w-[200px]">{fileCommit.message}</span>
                  <span className="text-[#555560]">·</span>
                  <span className="text-[#555560] font-mono">{formatCommitDate(fileCommit.date)}</span>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-auto bg-[#050508]">
              <pre className="p-4 text-[11px] leading-[1.7] font-mono text-[#999999] whitespace-pre">
                {selectedFile.content}
              </pre>
            </div>
          </>
        ) : fileLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3 text-[#555560] text-sm font-light">
              <div className="w-3.5 h-3.5 border border-[#555560] border-t-white/60 rounded-full animate-spin" />
              Loading file...
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2a2a35"
                strokeWidth="1.5"
                className="mx-auto"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p className="text-xs text-[#555560] font-light">Select a file to view its contents</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
