import { useState, useEffect } from 'react'
import type { GitData } from '../types'
import type { useAiSummary } from '../hooks/useAiSummary'

interface SummaryPanelProps {
  data: GitData
  ai: ReturnType<typeof useAiSummary>
}

export default function SummaryPanel({ data, ai }: SummaryPanelProps) {
  const [open, setOpen] = useState(false)
  const key = 'repo-summary'
  const summary = ai.getSummary(key)
  const generating = ai.isGenerating(key)

  useEffect(() => {
    if (open && !summary && !generating) {
      ai.summarize(
        key,
        `Provide a concise 2-3 sentence overview of this git repository based on its history:\n\nRepository: ${data.repoName}\nTotal commits: ${data.totalCommits}\nContributors: ${data.contributors.map((c) => `${c.name} (${c.commits} commits)`).join(', ')}\nBranches: ${data.branches.map((b) => b.name).join(', ')}\nActive period: ${data.dateRange.first} to ${data.dateRange.last}\nTop changed files: ${data.topFiles.slice(0, 10).map((f) => f.name).join(', ')}\nTotal additions: ${data.totalAdditions}, Total deletions: ${data.totalDeletions}\n\nFocus on: what this project likely is, who maintains it, and notable development patterns.`
      )
    }
  }, [open])

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] text-[#555560] hover:text-[#999999] border border-[#1a1a24] rounded-lg hover:border-[#2a2a35] transition-all duration-200 font-light"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        AI Summary
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-[400px] card p-5 z-50 animate-slide-up shadow-2xl border-[#2a2a35]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[11px] text-[#999999] font-light">Repository Overview</h4>
              <button
                onClick={() => setOpen(false)}
                className="text-[#555560] hover:text-[#f0f0f0] transition-colors"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {generating && !summary ? (
              <div className="flex items-center gap-2 text-[11px] text-[#555560] py-4">
                <div className="w-3 h-3 border border-[#555560] border-t-white/50 rounded-full animate-spin" />
                <span className="font-light">Analyzing repository...</span>
              </div>
            ) : summary ? (
              <p className="text-[11px] text-[#999999] leading-relaxed font-light">{summary}</p>
            ) : (
              <p className="text-[11px] text-[#555560] font-light">Click to generate summary</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
