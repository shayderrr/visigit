import { useState, useCallback, useEffect, useRef } from 'react'
import type { GitData } from '../types'

export interface Progress {
  stage: string
  percent: number
  message: string
}

export function useGitData() {
  const [data, setData] = useState<GitData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [progress, setProgress] = useState<Progress | null>(null)
  const removeListener = useRef<(() => void) | null>(null)

  useEffect(() => {
    removeListener.current = window.electronAPI.onProgress((p) => {
      setProgress(p)
    })
    return () => { removeListener.current?.() }
  }, [])

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setProgress(null), 600)
      return () => clearTimeout(t)
    }
  }, [loading])

  const loadBranch = useCallback(
    async (branch: string) => {
      if (!data) return
      setLoading(true)
      setError(null)
      try {
        const result = await window.electronAPI.openRepo(data.repoPath, branch)
        if (!result) {
          setError('Failed to load branch data')
          return
        }
        setData(result)
        setSelectedBranch(branch)
      } catch (err) {
        setError('Error: ' + (err as Error).message)
      } finally {
        setLoading(false)
      }
    },
    [data],
  )

  const openFolder = useCallback(async () => {
    const folder = await window.electronAPI.selectFolder()
    if (!folder) return null
    return await loadFromInput(folder)
  }, [])

  const loadFromInput = useCallback(async (input: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.electronAPI.openRepo(input)
      if (!result) {
        setError('Failed to load repository data')
        return null
      }
      setData(result)
      setSelectedBranch(result.branches.find((b) => b.current)?.name ?? '')
      return result
    } catch (err) {
      setError('Error: ' + (err as Error).message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    data,
    loading,
    error,
    progress,
    selectedBranch,
    setSelectedBranch,
    loadBranch,
    openFolder,
    loadFromInput,
    setData,
  }
}
