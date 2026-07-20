import simpleGit, { SimpleGit, LogResult } from 'simple-git'
import { existsSync } from 'fs'
import { join } from 'path'

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

async function getDiffStats(git: SimpleGit, hash: string): Promise<{ additions: number; deletions: number; files: string[] }> {
  try {
    const stats = await git.raw(['diff', '--numstat', `${hash}^`, hash])
    let additions = 0
    let deletions = 0
    const files: string[] = []

    for (const line of stats.split('\n').filter(Boolean)) {
      const parts = line.split('\t')
      if (parts.length >= 3) {
        const add = parseInt(parts[0], 10)
        const del = parseInt(parts[1], 10)
        if (!isNaN(add)) additions += add
        if (!isNaN(del)) deletions += del
        files.push(parts[2])
      }
    }
    return { additions, deletions, files }
  } catch {
    return { additions: 0, deletions: 0, files: [] }
  }
}

export async function getGitData(folderPath: string, branch?: string): Promise<GitData> {
  if (!existsSync(join(folderPath, '.git'))) {
    throw new Error('Not a git repository')
  }

  const git = simpleGit(folderPath)
  const repoName = folderPath.split('/').pop() || folderPath.split('\\').pop() || 'repository'

  const branchResult = await git.branchLocal()
  const branches: BranchInfo[] = branchResult.all.map((name) => ({
    name,
    current: name === branchResult.current,
    commit: branchResult.branches[name]?.commit || '',
  }))

  const logRef = branch || undefined
  const logResult: LogResult = await git.log({ all: !branch, maxCount: 2000 }, [logRef].filter(Boolean) as string[])

  const commits: CommitInfo[] = []
  const contributorMap = new Map<string, ContributorInfo>()
  const dailyMap = new Map<string, number>()
  const weeklyAddDel = new Map<string, { additions: number; deletions: number }>()
  const fileMap = new Map<string, number>()

  const sortedLogs = [...logResult.all].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  for (let i = 0; i < sortedLogs.length; i++) {
    const log = sortedLogs[i]
    const isDetailed = i >= sortedLogs.length - 50
    const { additions, deletions, files } = isDetailed
      ? await getDiffStats(git, log.hash)
      : { additions: 0, deletions: 0, files: [] }

    const commitInfo: CommitInfo = {
      hash: log.hash,
      message: log.message,
      author: log.author_name,
      email: log.author_email,
      date: log.date,
      additions,
      deletions,
      files,
      body: log.body || '',
    }
    commits.push(commitInfo)

    const authorKey = `${log.author_name}|||${log.author_email}`
    const existing = contributorMap.get(authorKey)
    if (existing) {
      existing.commits++
      existing.additions += additions
      existing.deletions += deletions
    } else {
      contributorMap.set(authorKey, {
        name: log.author_name,
        email: log.author_email,
        commits: 1,
        additions,
        deletions,
      })
    }

    const day = log.date.split('T')[0]
    dailyMap.set(day, (dailyMap.get(day) || 0) + 1)

    const dateObj = new Date(log.date)
    const weekStart = new Date(dateObj)
    weekStart.setDate(dateObj.getDate() - dateObj.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]
    const weekData = weeklyAddDel.get(weekKey) || { additions: 0, deletions: 0 }
    weekData.additions += additions
    weekData.deletions += deletions
    weeklyAddDel.set(weekKey, weekData)

    for (const f of files) {
      const basename = f.split('/').pop() || f
      fileMap.set(basename, (fileMap.get(basename) || 0) + 1)
    }
  }

  const contributors = [...contributorMap.values()].sort((a, b) => b.commits - a.commits)

  const dailyActivity: DailyActivity[] = [...dailyMap.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const codeFrequency: CodeFrequency[] = [...weeklyAddDel.entries()]
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const topFiles = [...fileMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0)
  const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0)

  const sortedByDate = [...commits].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return {
    repoPath: folderPath,
    repoName,
    commits: [...commits].reverse(),
    branches,
    contributors,
    dailyActivity,
    codeFrequency,
    totalCommits: commits.length,
    totalAdditions,
    totalDeletions,
    dateRange: {
      first: sortedByDate[0]?.date || '',
      last: sortedByDate[sortedByDate.length - 1]?.date || '',
    },
    topFiles,
  }
}

export async function getCommitDetail(folderPath: string, commitHash: string) {
  const git = simpleGit(folderPath)
  const log = await git.log({ from: commitHash, maxCount: 1 })
  if (log.latest === null) return null

  let diff = ''
  try {
    diff = await git.diff([`${commitHash}^`, commitHash])
  } catch {}

  const stat = await getDiffStats(git, commitHash)

  return {
    hash: commitHash,
    message: log.latest.message,
    author: log.latest.author_name,
    date: log.latest.date,
    additions: stat.additions,
    deletions: stat.deletions,
    files: stat.files,
    diff: diff.slice(0, 10000),
  }
}

export async function getLastFileCommit(folderPath: string, filePath: string, branch?: string) {
  const git = simpleGit(folderPath)
  const args = ['log', '-1', '--format=%H|%an|%ae|%ad|%s', '--date=iso']
  if (branch) args.push(branch)
  args.push('--', filePath)
  const result = await git.raw(args)
  const parts = result.trim().split('|')
  if (parts.length < 5) return null
  return {
    hash: parts[0],
    author: parts[1],
    email: parts[2],
    date: parts[3],
    message: parts[4],
  }
}
