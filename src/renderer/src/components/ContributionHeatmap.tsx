import { useState, useCallback } from 'react'
import HeatMap from '@uiw/react-heat-map'
import type { GitData } from '../types'

interface ContributionHeatmapProps {
  data: GitData
}

export default function ContributionHeatmap({ data }: ContributionHeatmapProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const values = data.dailyActivity.map((d) => ({
    date: d.date,
    count: d.count,
  }))

  const maxCount = Math.max(...data.dailyActivity.map((d) => d.count), 1)

  const commitsForDate = selectedDate
    ? data.commits.filter((c) => c.date.split('T')[0] === selectedDate)
    : []

  const handleCellClick = useCallback(
    (_: any, item: { date: string; count: number }) => {
      if (!item?.date) return
      const d = new Date(item.date)
      if (isNaN(d.getTime())) return
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      setSelectedDate((prev) => (prev === dateStr ? null : dateStr))
    },
    []
  )

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (values.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#555560] text-sm font-light">
        No activity data to display
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm text-[#d0d0d0] font-light">Contribution Activity</h3>
          <p className="text-[11px] text-[#555560] mt-0.5 font-light">
            {data.dailyActivity.reduce((s, d) => s + d.count, 0)} commits across{' '}
            {data.dailyActivity.length} active days
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-[#555560]">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => {
            const opacity = (level + 1) * 0.2
            return (
              <div
                key={level}
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: `rgba(255,255,255,${opacity})` }}
              />
            )
          })}
          <span>More</span>
        </div>
      </div>

      <div className="card p-5 overflow-x-auto">
        <HeatMap
          value={values}
          width={900}
          height={150}
          rectSize={10}
          space={3}
          startDate={new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)}
          panelColors={{
            0: '#0e0e14',
            [Math.ceil(maxCount * 0.25)]: '#2a2a35',
            [Math.ceil(maxCount * 0.5)]: '#444450',
            [Math.ceil(maxCount * 0.75)]: '#888890',
            [maxCount]: '#f0f0f0',
          }}
          rectRender={(props, item) => (
            <rect
              {...props}
              onClick={(e) => {
                e.stopPropagation()
                handleCellClick(e, item)
              }}
              style={{ cursor: 'pointer', ...props.style }}
            >
              <title>{`${item.date}: ${item.count || 0} commits`}</title>
            </rect>
          )}
          weekLabels={['', 'Mon', '', 'Wed', '', 'Fri', '']}
        />
      </div>

      {selectedDate && (
        <div
          className="card overflow-hidden border border-[#1a1a24] animate-slide-up"
          style={{ animationDuration: '0.3s' }}
        >
          <div className="px-5 py-3 border-b border-[#1a1a24] bg-[#0e0e14]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs text-[#f0f0f0] font-light">{formatDate(selectedDate)}</h4>
                <p className="text-[10px] text-[#555560] mt-0.5 font-light">
                  {commitsForDate.length} commit{commitsForDate.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-[#555560] hover:text-[#f0f0f0] transition-colors p-1 rounded-md hover:bg-white/[0.05]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-auto">
            {commitsForDate.length === 0 ? (
              <div className="px-5 py-6 text-center text-[#555560] text-xs font-light">
                No commits recorded for this date
              </div>
            ) : (
              <div className="divide-y divide-[#1a1a24]">
                {commitsForDate.map((commit) => (
                  <div
                    key={commit.hash}
                    className="px-5 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-[#f0f0f0] font-light truncate">
                          {commit.message}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] text-[#555560] font-mono">
                            {commit.hash.slice(0, 7)}
                          </span>
                          <span className="text-[9px] text-[#666666] font-light">
                            {commit.author}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {commit.additions > 0 && (
                          <span className="text-[10px] font-mono text-[#7a9e7a]">
                            +{commit.additions}
                          </span>
                        )}
                        {commit.deletions > 0 && (
                          <span className="text-[10px] font-mono text-[#9e7a7a]">
                            -{commit.deletions}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card p-4">
        <h4 className="text-[9px] text-[#555560] uppercase tracking-[0.15em] mb-3">
          Monthly Breakdown
        </h4>
        <div className="grid grid-cols-7 gap-2">
          {[...new Set(data.dailyActivity.map((d) => d.date.slice(0, 7)))].map((month) => {
            const monthCommits = data.dailyActivity
              .filter((d) => d.date.startsWith(month))
              .reduce((s, d) => s + d.count, 0)
            return (
              <div key={month} className="text-center p-2 bg-white/[0.02] rounded-lg">
                <p className="text-[9px] text-[#555560] font-light">{month}</p>
                <p className="text-xs text-[#999999] font-mono mt-0.5">{monthCommits}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
