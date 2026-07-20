import type { GitData } from '../types'

interface StatsBarProps {
  data: GitData
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function StatsBar({ data }: StatsBarProps) {
  const stats = [
    { label: 'Commits', value: formatNumber(data.totalCommits) },
    { label: 'Contributors', value: data.contributors.length.toString() },
    { label: 'Branches', value: data.branches.length.toString() },
    { label: 'Added', value: formatNumber(data.totalAdditions), accent: 'add' as const },
    { label: 'Removed', value: formatNumber(data.totalDeletions), accent: 'del' as const },
  ]

  return (
    <div className="flex items-center gap-6 px-5 py-3 border-b border-[#1a1a24] shrink-0">
      <h2 className="text-sm font-medium text-[#f0f0f0] tracking-tight">{data.repoName}</h2>

      <div className="h-3 w-px bg-[#1a1a24]" />

      <div className="flex items-center gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#555560] uppercase tracking-[0.12em]">
              {stat.label}
            </span>
            <span
              className={`text-[11px] font-medium ${
                stat.accent === 'add'
                  ? 'text-[#aaaaaa]'
                  : stat.accent === 'del'
                  ? 'text-[#666666]'
                  : 'text-[#d0d0d0]'
              }`}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {data.dateRange.first && (
        <>
          <div className="h-3 w-px bg-[#1a1a24]" />
          <span className="text-[10px] text-[#555560] font-light">
            {formatDate(data.dateRange.first)} &mdash; {formatDate(data.dateRange.last)}
          </span>
        </>
      )}
    </div>
  )
}
