export interface CommitInfo {
  hash: string
  message: string
  author: string
  email: string
  date: string
  additions: number
  deletions: number
  files: string[]
  body: string
}

export interface BranchInfo {
  name: string
  current: boolean
  commit: string
}

export interface ContributorInfo {
  name: string
  email: string
  commits: number
  additions: number
  deletions: number
}

export interface DailyActivity {
  date: string
  count: number
}

export interface CodeFrequency {
  date: string
  additions: number
  deletions: number
}

export interface GitData {
  repoPath: string
  repoName: string
  commits: CommitInfo[]
  branches: BranchInfo[]
  contributors: ContributorInfo[]
  dailyActivity: DailyActivity[]
  codeFrequency: CodeFrequency[]
  totalCommits: number
  totalAdditions: number
  totalDeletions: number
  dateRange: { first: string; last: string }
  topFiles: { name: string; count: number }[]
}

export interface CommitDetail {
  hash: string
  message: string
  author: string
  date: string
  additions: number
  deletions: number
  files: string[]
  diff: string
}

export interface FileTreeItem {
  path: string
  name: string
  type: 'file' | 'dir' | 'symlink'
  size?: number
}

export interface FileContent {
  name: string
  path: string
  content: string
  encoding: string
  size: number
}

export type TabId = 'graph' | 'timeline' | 'heatmap' | 'frequency' | 'contributors' | 'files'
