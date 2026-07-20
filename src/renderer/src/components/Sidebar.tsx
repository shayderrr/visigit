import type { GitData } from '../types'

interface SidebarProps {
  data: GitData
  onReset: () => void
  onSelectBranch: (branch: string) => void
  selectedBranch: string
}

export default function Sidebar({ data, onReset, onSelectBranch, selectedBranch }: SidebarProps) {
  return (
    <div className="w-56 shrink-0 border-r border-[#1a1a24] flex flex-col bg-[#0a0a0f]">
      <div className="p-3 border-b border-[#1a1a24]">
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white text-black text-[11px] font-medium rounded-lg hover:bg-neutral-200 transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Open Repository
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-3">
          <h3 className="text-[9px] text-[#555560] uppercase tracking-[0.15em] mb-2 px-1 flex items-center gap-1.5">
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
              <line x1="6" y1="3" x2="6" y2="15" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <path d="M18 9a9 9 0 0 1-9 9" />
            </svg>
            Branches ({data.branches.length})
          </h3>
          <div className="space-y-px">
            {data.branches.map((branch) => {
              const isSelected = selectedBranch === branch.name
              return (
                <button
                  key={branch.name}
                  onClick={() => onSelectBranch(branch.name)}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-all duration-200 ${
                    isSelected
                      ? 'bg-white/[0.06] text-white'
                      : 'text-[#666666] hover:bg-white/[0.03] hover:text-[#999999]'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                    )}
                    <span className="truncate font-light">{branch.name}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-3 border-t border-[#1a1a24]">
          <h3 className="text-[9px] text-[#555560] uppercase tracking-[0.15em] mb-2 px-1">
            Contributors ({data.contributors.length})
          </h3>
          <div className="space-y-px">
            {data.contributors.slice(0, 15).map((contributor, i) => {
              const initials = contributor.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
              return (
                <div
                  key={`${contributor.name}-${i}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-[#888888] hover:bg-white/[0.03] transition-all duration-200"
                >
                  <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center text-[8px] text-[#999] font-medium shrink-0">
                    {initials}
                  </div>
                  <span className="truncate font-light">{contributor.name}</span>
                  <span className="text-[#555560] font-mono text-[10px] shrink-0 ml-auto">
                    {contributor.commits}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {data.topFiles.length > 0 && (
          <div className="p-3 border-t border-[#1a1a24]">
            <h3 className="text-[9px] text-[#555560] uppercase tracking-[0.15em] mb-2 px-1">
              Top Files
            </h3>
            <div className="space-y-px">
              {data.topFiles.slice(0, 10).map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between px-2 py-1 text-[10px] text-[#666666] hover:bg-white/[0.03] rounded-md transition-all duration-200"
                >
                  <span className="truncate font-mono">{file.name}</span>
                  <span className="text-[#555560] shrink-0 ml-2">{file.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
