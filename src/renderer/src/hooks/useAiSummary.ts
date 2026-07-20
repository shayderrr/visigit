import { useState, useCallback, useRef } from 'react'

const summaryCache = new Map<string, string>()

export function useAiSummary() {
  const [summaries, setSummaries] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState<Set<string>>(new Set())
  const queueRef = useRef<Array<{ key: string; prompt: string }>>([])
  const processingRef = useRef(false)

  const processQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) return
    processingRef.current = true

    while (queueRef.current.length > 0) {
      const item = queueRef.current.shift()!
      if (summaryCache.has(item.key)) {
        setLoading((prev) => {
          const next = new Set(prev)
          next.delete(item.key)
          return next
        })
        continue
      }

      setLoading((prev) => new Set(prev).add(item.key))

      try {
        const text = await window.electronAPI.aiChat(item.prompt)
        if (!text.includes('request failed') && !text.includes('No API key')) {
          summaryCache.set(item.key, text)
          setSummaries((prev) => new Map(prev).set(item.key, text))
        }
      } catch {}

      setLoading((prev) => {
        const next = new Set(prev)
        next.delete(item.key)
        return next
      })
    }

    processingRef.current = false
  }, [])

  const summarize = useCallback(
    (key: string, prompt: string) => {
      if (summaryCache.has(key)) {
        const cached = summaryCache.get(key)!
        setSummaries((prev) => new Map(prev).set(key, cached))
        return
      }
      if (queueRef.current.some((q) => q.key === key)) return

      queueRef.current.push({ key, prompt })
      processQueue()
    },
    [processQueue]
  )

  const getSummary = useCallback(
    (key: string) => summaries.get(key) || summaryCache.get(key),
    [summaries]
  )

  const isGenerating = useCallback((key: string) => loading.has(key), [loading])

  return { summarize, getSummary, isGenerating, summaries }
}
