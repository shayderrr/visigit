import { useState, useEffect } from 'react'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [key, setKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [ghToken, setGhToken] = useState('')
  const [ghSaved, setGhSaved] = useState(false)

  useEffect(() => {
    if (open) {
      window.electronAPI.aiHasKey().then((has) => {
        setSaved(has)
      })
      window.electronAPI.githubHasToken().then((has) => {
        setGhSaved(has)
      })
    }
  }, [open])

  if (!open) return null

  const handleSave = async () => {
    await window.electronAPI.aiSetKey(key.trim())
    setSaved(true)
    setTimeout(() => onClose(), 600)
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div
        className="card w-[480px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.25s ease-out' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#1a1a24]">
          <div>
            <h3 className="text-sm text-[#f0f0f0] font-light">Settings</h3>
            <p className="text-[10px] text-[#555560] mt-0.5">AI Summary Configuration</p>
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

        <div className="p-4 space-y-4">
          <div>
            <label className="text-[11px] text-[#999999] font-light block mb-1.5">
              GitHub Token
            </label>
            <p className="text-[10px] text-[#555560] mb-2 font-light">
              Required for private repos.{' '}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noreferrer"
                className="text-[#888888] underline underline-offset-2 hover:text-[#d0d0d0] transition-colors"
              >
                Generate a token
              </a>
              {' '}(select <span className="text-[#777]">repo</span> scope)
            </p>
            <input
              type="password"
              value={ghToken}
              onChange={(e) => { setGhToken(e.target.value); setGhSaved(false) }}
              placeholder="ghp_..."
              className="w-full px-3 py-2 bg-white/[0.03] border border-neutral-800 rounded-lg text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-all duration-200 font-light font-mono"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[#555560] font-light">
              {ghSaved ? 'Token set' : 'No token'}
            </p>
            <button
              onClick={async () => {
                await window.electronAPI.githubSetToken(ghToken.trim())
                setGhSaved(true)
              }}
              disabled={!ghToken.trim()}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                ghSaved
                  ? 'bg-white/[0.06] text-[#888888]'
                  : 'bg-white text-black hover:bg-neutral-200 disabled:opacity-20 disabled:cursor-not-allowed'
              }`}
            >
              {ghSaved ? 'Saved' : 'Save Token'}
            </button>
          </div>

          <div className="border-t border-[#1a1a24]" />

          <div>
            <label className="text-[11px] text-[#999999] font-light block mb-1.5">
              NVIDIA NIM API Key
            </label>
            <p className="text-[10px] text-[#555560] mb-2 font-light">
              Get a free key at{' '}
              <a
                href="https://build.nvidia.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[#888888] underline underline-offset-2 hover:text-[#d0d0d0] transition-colors"
              >
                build.nvidia.com
              </a>
              {' '}(5,000 free credits/day)
            </p>
            <input
              type="password"
              value={key}
              onChange={(e) => { setKey(e.target.value); setSaved(false) }}
              placeholder="nvapi-..."
              className="w-full px-3 py-2 bg-white/[0.03] border border-neutral-800 rounded-lg text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-all duration-200 font-light font-mono"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[#555560] font-light">
              Model: z-ai/glm-5.2
            </p>
            <button
              onClick={handleSave}
              disabled={!key.trim()}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                saved
                  ? 'bg-white/[0.06] text-[#888888]'
                  : 'bg-white text-black hover:bg-neutral-200 disabled:opacity-20 disabled:cursor-not-allowed'
              }`}
            >
              {saved ? 'Saved' : 'Save Key'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
