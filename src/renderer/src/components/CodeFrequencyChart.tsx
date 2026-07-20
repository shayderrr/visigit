import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { GitData } from '../types'

interface CodeFrequencyChartProps {
  data: GitData
}

export default function CodeFrequencyChart({ data }: CodeFrequencyChartProps) {
  const chartData = data.codeFrequency.map((d) => ({
    date: d.date,
    additions: d.additions,
    deletions: -d.deletions,
  }))

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#555560] text-sm font-light">
        No code frequency data to display
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-sm text-[#d0d0d0] font-light">Code Frequency</h3>
        <p className="text-[11px] text-[#555560] mt-0.5 font-light">
          Additions and deletions per week over time
        </p>
      </div>

      <div className="card p-5">
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="addGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f0f0f0" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f0f0f0" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="delGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#555560" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#555560" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#555560' }}
              tickLine={{ stroke: '#1a1a24' }}
              axisLine={{ stroke: '#1a1a24' }}
              tickFormatter={(val) => {
                const d = new Date(val)
                return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
              }}
              interval={Math.floor(chartData.length / 10)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#555560' }}
              tickLine={{ stroke: '#1a1a24' }}
              axisLine={{ stroke: '#1a1a24' }}
              tickFormatter={(val) => Math.abs(val).toLocaleString()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0e0e14',
                border: '1px solid #2a2a35',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#f0f0f0',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
              formatter={(value: number, name: string) => [
                Math.abs(value).toLocaleString(),
                name === 'additions' ? 'Additions' : 'Deletions',
              ]}
              labelFormatter={(label) =>
                new Date(label).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })
              }
            />
            <Area
              type="monotone"
              dataKey="additions"
              stroke="#f0f0f0"
              strokeWidth={1}
              fill="url(#addGrad)"
            />
            <Area
              type="monotone"
              dataKey="deletions"
              stroke="#555560"
              strokeWidth={1}
              fill="url(#delGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 text-[10px] text-[#555560]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-px bg-[#f0f0f0]" />
          <span className="font-light">Additions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-px bg-[#555560]" />
          <span className="font-light">Deletions</span>
        </div>
      </div>
    </div>
  )
}
