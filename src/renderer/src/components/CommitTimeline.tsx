import { useState, useEffect } from 'react'
import type { GitData } from '../types'
import type { useAiSummary } from '../hooks/useAiSummary'

interface CommitTimelineProps {
  data: GitData
  ai: ReturnType<typeof useAiSummary>
  onSelectCommit: (hash: string) => void
}

export default function CommitTimeline({ data, ai, onSelectCommit }: CommitTimelineProps) {
  const [visibleCount, setVisibleCount] = useState(50)
  const commits = data.commits.slice(0, visibleCount)

  return (
    <div className="space-y-px">
      {commits.map((commit, i) => (
        <CommitRow
          key={commit.hash}
          commit={commit}
          ai={ai}
          onSelect={() => onSelectCommit(commit.hash)}
          showDate={
            i === 0 ||
            new Date(commit.date).toDateString() !==
              new Date(commits[i - 1].date).toDateString()
          }
        />
      ))}

      {visibleCount < data.commits.length && (
        <button
          onClick={() => setVisibleCount((prev) => prev + 50)}
          className="w-full py-4 text-[11px] text-[#555560] hover:text-[#999999] transition-colors font-light"
        >
          Load more ({data.commits.length - visibleCount} remaining)
        </button>
      )}
    </div>
  )
}

function CommitRow({
  commit,
  ai,
  onSelect,
  showDate,
}: {
  commit: any
  ai: ReturnType<typeof useAiSummary>
  onSelect: () => void
  showDate: boolean
}) {
  const key = `tl-${commit.hash}`
  const summary = ai.getSummary(key)
  const generating = ai.isGenerating(key)

  useEffect(() => {
    if (!summary && !generating) {
      ai.summarize(
        key,
        `Explain this git commit in one short sentence (max 15 words):\nMessage: ${commit.message}\nFiles: ${commit.files.slice(0, 5).join(', ')}`
      )
    }
  }, [])

  const dateStr = new Date(commit.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      className="group card-hover p-3 cursor-pointer animate-fade-in"
      onClick={onSelect}
    >
      {showDate && (
        <p className="text-[9px] text-[#555560] mb-1.5 uppercase tracking-[0.15em] font-light">
          {dateStr}
        </p>
      )}

      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center pt-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#f0f0f0]/60 shrink-0 group-hover:bg-white transition-colors" />
          <div className="w-px flex-1 bg-[#1a1a24] mt-1" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-[#d0d0d0] leading-snug font-light">
            {commit.message}
          </p>

          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-[#555560] font-mono">{commit.hash.slice(0, 7)}</span>
            <span className="text-[10px] text-[#666666]">{commit.author}</span>
            {commit.additions > 0 && (
              <span className="text-[10px] text-[#888888]">+{commit.additions}</span>
            )}
            {commit.deletions > 0 && (
              <span className="text-[10px] text-[#555555]">-{commit.deletions}</span>
            )}
          </div>

          <div className="mt-1.5">
            {generating && !summary ? (
              <div className="flex items-center gap-1.5 text-[10px] text-[#555560]">
                <div className="w-2 h-2 border border-[#555560] border-t-white/50 rounded-full animate-spin" />
                <span className="font-light">Summarizing...</span>
              </div>
            ) : summary ? (
              <p className="text-[11px] text-[#555560] leading-relaxed font-light">{summary}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
