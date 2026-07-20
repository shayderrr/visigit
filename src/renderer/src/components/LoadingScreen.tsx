import type { Progress } from '../hooks/useGitData'

export default function LoadingScreen({ progress }: { progress?: Progress | null }) {
  const percent = progress?.percent ?? 0
  const message = progress?.message ?? 'Loading repository'

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 border border-[#1a1a24] rounded-full" />
        <div className="absolute inset-0 border-2 border-t-white/80 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
        <div className="absolute inset-2 bg-white/[0.02] rounded-full animate-pulse-slow" />
      </div>

      <div className="text-center">
        <p className="text-sm text-[#999999] font-light tracking-wide">{message}</p>
        {progress && (
          <p className="text-[11px] text-[#555560] mt-1.5">{percent}%</p>
        )}
      </div>

      <div className="w-64 mt-2">
        <div className="h-[2px] bg-[#1a1a24] rounded-full overflow-hidden">
          <div
            className="h-full bg-white/50 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
