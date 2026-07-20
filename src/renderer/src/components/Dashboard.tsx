import type { GitData } from '../types'
import SnowBackground from './SnowBackground'
import StatsBar from './StatsBar'
import Sidebar from './Sidebar'
import CommitGraph from './CommitGraph'
import CommitTimeline from './CommitTimeline'
import ContributionHeatmap from './ContributionHeatmap'
import CodeFrequencyChart from './CodeFrequencyChart'
import ContributorStats from './ContributorStats'
import SummaryPanel from './SummaryPanel'
import FileBrowser from './FileBrowser'
import SettingsModal from './SettingsModal'
import { useAiSummary } from '../hooks/useAiSummary'
import { useState, useEffect } from 'react'

import type { TabId } from '../types'

interface DashboardProps {
  data: GitData
  onReset: () => void
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'graph', label: 'Graph' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'frequency', label: 'Code Frequency' },
  { id: 'contributors', label: 'Contributors' },
  { id: 'files', label: 'Files' },
]

export default function Dashboard({ data, onReset }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('graph')
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [branchData, setBranchData] = useState<GitData | null>(null)
  const [branchLoading, setBranchLoading] = useState(false)
  const [tabAnimKey, setTabAnimKey] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const ai = useAiSummary()

  useEffect(() => {
    setTabAnimKey((k) => k + 1)
  }, [activeTab])

  const effectiveData = branchData || data

  const handleSelectBranch = async (branch: string) => {
    const next = selectedBranch === branch ? '' : branch
    setSelectedBranch(next)
    if (!next) {
      setBranchData(null)
      return
    }
    setBranchLoading(true)
    try {
      const result = await window.electronAPI.openRepo(data.repoPath, next)
      if (result) setBranchData(result)
    } catch {
    } finally {
      setBranchLoading(false)
    }
  }

  const renderTab = () => {
    if (branchLoading) {
      return (
        <div className="flex items-center justify-center h-64 text-[#555560] text-sm font-light">
          <div className="w-4 h-4 border border-[#555560] border-t-white/60 rounded-full animate-spin mr-3" />
          Loading branch...
        </div>
      )
    }
    switch (activeTab) {
      case 'graph':
        return <CommitGraph data={effectiveData} onSelectCommit={setSelectedCommit} />
      case 'timeline':
        return <CommitTimeline data={effectiveData} ai={ai} onSelectCommit={setSelectedCommit} />
      case 'heatmap':
        return <ContributionHeatmap data={effectiveData} />
      case 'frequency':
        return <CodeFrequencyChart data={effectiveData} />
      case 'contributors':
        return <ContributorStats data={effectiveData} />
      case 'files':
        return <FileBrowser source={data.repoPath} branch={selectedBranch || undefined} />
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-[#050508]">
      <SnowBackground density={30} />

      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <div className="drag-region h-8 w-full shrink-0" />

        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            data={data}
            onReset={onReset}
            onSelectBranch={handleSelectBranch}
            selectedBranch={selectedBranch}
          />

          <div className="flex-1 flex flex-col min-w-0">
            <StatsBar data={effectiveData} />

            <div className="flex items-center gap-0 px-4 border-b border-[#1a1a24] shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3 py-2.5 text-[11px] font-medium tracking-wide transition-all duration-200 ${
                    activeTab === tab.id ? 'tab-active' : 'tab-inactive'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-2 right-2 h-px bg-white/60" />
                  )}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(true)}
                  className="text-[#555560] hover:text-[#999999] transition-colors p-1.5 rounded-md hover:bg-white/[0.04]"
                  title="Settings"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                </button>
                <SummaryPanel data={effectiveData} ai={ai} />
              </div>
            </div>

            <div className="flex-1 overflow-auto p-5" key={tabAnimKey}>
              <div className="animate-fade-in">{renderTab()}</div>
            </div>
          </div>
        </div>
      </div>

      {selectedCommit && (
        <CommitDetailOverlay
          hash={selectedCommit}
          source={data.repoPath}
          onClose={() => setSelectedCommit(null)}
        />
      )}

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}

function CommitDetailOverlay({
  hash,
  source,
  onClose,
}: {
  hash: string
  source: string
  onClose: () => void
}) {
  const [detail, setDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const ai = useAiSummary()

  useEffect(() => {
    window.electronAPI.getCommitDetail(source, hash).then((d: any) => {
      setDetail(d)
      setLoading(false)
    })
  }, [source, hash])

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div
        className="card w-[700px] max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.25s ease-out' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#1a1a24]">
          <div>
            <p className="text-[11px] text-[#555560] font-mono">{hash.slice(0, 8)}</p>
            <p className="text-sm text-[#f0f0f0] mt-0.5 font-light">
              {detail?.message || 'Loading...'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#555560] hover:text-[#f0f0f0] transition-colors p-1 rounded-md hover:bg-white/[0.05]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-[#555560] text-sm font-light">
              <div className="w-4 h-4 border border-[#555560] border-t-white/60 rounded-full animate-spin mx-auto mb-3" />
              Loading commit details...
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <div className="flex gap-4 text-[11px] text-[#999999]">
                <span>{detail.author}</span>
                <span>{new Date(detail.date).toLocaleString()}</span>
                <span className="text-[#7a7a7a]">+{detail.additions}</span>
                <span className="text-[#555555]">-{detail.deletions}</span>
              </div>

              <AiCommitSummary hash={hash} message={detail.message} diff={detail.diff} ai={ai} />

              <div className="text-[11px] text-[#555560]">
                <p className="mb-2 text-[#999999]">Files changed ({detail.files.length})</p>
                <div className="space-y-0.5">
                  {detail.files.map((f: string) => (
                    <p key={f} className="font-mono text-[10px]">
                      {f}
                    </p>
                  ))}
                </div>
              </div>

              {detail.diff && (
                <div>
                  <p className="text-[11px] text-[#999999] mb-2">Diff</p>
                  <pre className="text-[10px] font-mono text-[#666666] bg-[#0a0a0f] p-3 rounded-lg overflow-auto max-h-60 border border-[#1a1a24]">
                    {detail.diff.slice(0, 5000)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-[#555560] text-sm font-light">
              Failed to load commit
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AiCommitSummary({
  hash,
  message,
  diff,
  ai,
}: {
  hash: string
  message: string
  diff: string
  ai: ReturnType<typeof useAiSummary>
}) {
  const key = `commit-${hash}`
  const cached = ai.getSummary(key)
  const generating = ai.isGenerating(key)

  useEffect(() => {
    if (!cached) {
      ai.summarize(
        key,
        `Summarize this git commit in 1-2 sentences. Be concise:\n\nMessage: ${message}\n\nDiff excerpt: ${diff.slice(0, 2000)}`
      )
    }
  }, [])

  return (
    <div className="p-3 bg-[#0a0a0f] border border-[#1a1a24] rounded-lg">
      <div className="flex items-center gap-2 mb-1.5">
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#555560"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span className="text-[9px] text-[#555560] uppercase tracking-[0.15em]">AI Summary</span>
      </div>
      {generating && !cached ? (
        <div className="flex items-center gap-2 text-[11px] text-[#555560]">
          <div className="w-2.5 h-2.5 border border-[#555560] border-t-white/60 rounded-full animate-spin" />
          Generating...
        </div>
      ) : (
        <p className="text-[11px] text-[#999999] leading-relaxed font-light">
          {cached || 'No summary available'}
        </p>
      )}
    </div>
  )
}
