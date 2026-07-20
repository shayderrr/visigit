import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { GitData } from '../types'

interface ContributorStatsProps {
  data: GitData
}

export default function ContributorStats({ data }: ContributorStatsProps) {
  const topContributors = data.contributors.slice(0, 15)

  const commitData = topContributors.map((c) => ({
    name: c.name.length > 14 ? c.name.slice(0, 14) + '...' : c.name,
    commits: c.commits,
  }))

  const codeData = topContributors.map((c) => ({
    name: c.name.length > 14 ? c.name.slice(0, 14) + '...' : c.name,
    additions: c.additions,
    deletions: c.deletions,
  }))

  const shades = [
    '#f0f0f0',
    '#d0d0d0',
    '#bbbbbb',
    '#aaaaaa',
    '#999999',
    '#888888',
    '#777777',
    '#666666',
    '#555560',
    '#444450',
  ]

  const tooltipStyle = {
    backgroundColor: '#0e0e14',
    border: '1px solid #2a2a35',
    borderRadius: '8px',
    fontSize: '11px',
    color: '#f0f0f0',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  }

  const labelStyle = { color: '#999999' }
  const itemStyle = { color: '#f0f0f0' }

  if (topContributors.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#555560] text-sm font-light">
        No contributor data available
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-sm text-[#d0d0d0] font-light">Contributor Statistics</h3>
        <p className="text-[11px] text-[#555560] mt-0.5 font-light">
          Commit activity and code contributions by author
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card p-5">
          <h4 className="text-[9px] text-[#555560] uppercase tracking-[0.15em] mb-3">
            Commits per Author
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={commitData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#555560' }}
                tickLine={{ stroke: '#1a1a24' }}
                axisLine={{ stroke: '#1a1a24' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: '#888888' }}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={labelStyle}
                itemStyle={itemStyle}
                formatter={(value: number) => [value, 'Commits']}
              />
              <Bar dataKey="commits" radius={[0, 4, 4, 0]}>
                {commitData.map((_, i) => (
                  <Cell key={i} fill={shades[i % shades.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h4 className="text-[9px] text-[#555560] uppercase tracking-[0.15em] mb-3">
            Lines Changed
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={codeData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#555560' }}
                tickLine={{ stroke: '#1a1a24' }}
                axisLine={{ stroke: '#1a1a24' }}
                tickFormatter={(val) =>
                  Math.abs(val) > 1000
                    ? (Math.abs(val) / 1000).toFixed(0) + 'K'
                    : Math.abs(val)
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: '#888888' }}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={labelStyle}
                itemStyle={itemStyle}
                formatter={(value: number, name: string) => [
                  Math.abs(value).toLocaleString(),
                  name === 'additions' ? 'Additions' : 'Deletions',
                ]}
              />
              <Bar dataKey="additions" stackId="a" fill="#d0d0d0" />
              <Bar dataKey="deletions" stackId="a" fill="#444450" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h4 className="text-[9px] text-[#555560] uppercase tracking-[0.15em] mb-3">
          Contributor Table
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#1a1a24]">
                <th className="text-left py-2 text-[#555560] font-medium">Author</th>
                <th className="text-right py-2 text-[#555560] font-medium">Commits</th>
                <th className="text-right py-2 text-[#555560] font-medium">Additions</th>
                <th className="text-right py-2 text-[#555560] font-medium">Deletions</th>
                <th className="text-right py-2 text-[#555560] font-medium">Total Lines</th>
              </tr>
            </thead>
            <tbody>
              {topContributors.map((c, i) => (
                <tr
                  key={`${c.name}-${i}`}
                  className="border-b border-[#1a1a24]/50 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-2 text-[#d0d0d0] font-light">{c.name}</td>
                  <td className="py-2 text-[#999999] text-right font-mono">{c.commits}</td>
                  <td className="py-2 text-right font-mono text-[#888888]">
                    +{c.additions.toLocaleString()}
                  </td>
                  <td className="py-2 text-right font-mono text-[#555560]">
                    -{c.deletions.toLocaleString()}
                  </td>
                  <td className="py-2 text-[#666666] text-right font-mono">
                    {(c.additions + c.deletions).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
