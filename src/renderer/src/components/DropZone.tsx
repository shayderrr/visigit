import { useState, useCallback, useEffect, useRef } from 'react'

interface DropZoneProps {
  onSelect: (input: string) => Promise<any>
  onBrowse: () => Promise<string | null>
  error: string | null
}

export default function DropZone({ onSelect, onBrowse, error }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false)
  const [input, setInput] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = window.innerHeight)

    const particles: {
      x: number
      y: number
      r: number
      dx: number
      dy: number
      opacity: number
      swing: number
      swingSpeed: number
    }[] = []

    const count = Math.min(120, Math.floor(w / 8))
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.3,
        dy: Math.random() * 0.6 + 0.2,
        opacity: Math.random() * 0.5 + 0.1,
        swing: Math.random() * Math.PI * 2,
        swingSpeed: Math.random() * 0.02 + 0.005,
      })
    }

    let frame: number
    function draw() {
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.swing += p.swingSpeed
        p.x += p.dx + Math.sin(p.swing) * 0.3
        p.y += p.dy

        if (p.y > h + 10) {
          p.y = -10
          p.x = Math.random() * w
        }
        if (p.x > w + 10) p.x = -10
        if (p.x < -10) p.x = w + 10

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`
        ctx.fill()
      }
      frame = requestAnimationFrame(draw)
    }
    draw()

    const onResize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        const path = files[0].path
        if (path) {
          await onSelect(path)
        }
      }
    },
    [onSelect]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const val = input.trim()
      if (!val) return
      await onSelect(val)
    },
    [input, onSelect]
  )

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      <div className="absolute inset-0 z-0">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.04]"
          style={{
            width: '800px',
            height: '800px',
            background: 'radial-gradient(circle, white 0%, transparent 70%)',
          }}
        />
      </div>

      <div
        className={`relative z-10 flex flex-col items-center gap-8 p-16 transition-all duration-300 ${
          dragOver
            ? 'border-2 border-dashed border-white/40 rounded-2xl bg-white/[0.02] scale-[1.02]'
            : ''
        }`}
      >
        <div className="relative">
          <img
            src="logo.png"
            alt="VisiGit"
            className={`w-[144px] h-[144px] object-contain transition-all duration-300 ${
              dragOver ? 'brightness-150 scale-110' : 'brightness-75'
            }`}
          />
          {dragOver && (
            <div className="absolute inset-0 bg-white/10 rounded-full blur-xl animate-pulse-slow" />
          )}
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-extralight text-white tracking-tight">
            Vis<span className="font-light">i</span>Git
          </h1>
          <p className="text-sm text-neutral-500 mt-3 font-light">
            {dragOver
              ? 'Release to open'
              : 'Drop a git folder, or enter a GitHub URL'}
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onBrowse}
            className="group px-7 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-all duration-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
          >
            <span className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              Browse Folder
            </span>
          </button>

          <div className="flex items-center gap-3 text-neutral-600 text-[10px] tracking-widest uppercase">
            <div className="h-px w-14 bg-gradient-to-r from-transparent to-neutral-700" />
            <span>or paste a link</span>
            <div className="h-px w-14 bg-gradient-to-l from-transparent to-neutral-700" />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="github.com/user/repo or /path/to/repo"
              className="w-80 px-4 py-2.5 bg-white/[0.03] border border-neutral-800 rounded-lg text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 focus:bg-white/[0.05] transition-all duration-200 font-light"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-5 py-2.5 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:text-white hover:border-neutral-500 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
            >
              Open
            </button>
          </form>
        </div>

        {error && (
          <div className="px-5 py-4 bg-red-500/[0.06] border border-red-500/20 rounded-lg text-neutral-300 text-xs animate-fade-in max-w-lg text-center leading-relaxed">
            <p className="mb-2">{error}</p>
            {error.includes('rate limit') && (
              <p className="text-neutral-500">
                Tip: set <code className="bg-white/[0.06] px-1.5 py-0.5 rounded">GITHUB_TOKEN</code> env variable for 5000 req/hour
              </p>
            )}
          </div>
        )}

        <p className="text-[10px] text-neutral-700 mt-2 font-light">
          AI summaries powered by NVIDIA NIM &mdash; bring your own API key
        </p>
      </div>
    </div>
  )
}
