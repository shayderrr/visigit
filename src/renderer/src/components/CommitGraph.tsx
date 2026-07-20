import { useMemo, useState, useCallback, useRef } from 'react'
import type { GitData } from '../types'

interface CommitGraphProps {
  data: GitData
  onSelectCommit: (hash: string) => void
}

interface GraphNode {
  hash: string
  message: string
  author: string
  date: string
  column: number
  y: number
}

const BRANCH_COLORS = ['#d0d0d0', '#888888', '#555560', '#cccccc', '#333340', '#aaaaaa', '#666666', '#eeeeee']

const ROW_HEIGHT = 48
const COL_WIDTH = 32
const PADDING_LEFT = 40
const PADDING_TOP = 30
const NODE_RADIUS = 5

function buildGraph(commits: GitData['commits']): GraphNode[] {
  if (commits.length === 0) return []

  const sorted = [...commits]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-200)

  const nodes: GraphNode[] = sorted.map((c, i) => ({
    hash: c.hash,
    message: c.message,
    author: c.author,
    date: c.date,
    column: 0,
    y: PADDING_TOP + i * ROW_HEIGHT,
  }))

  const activeColumns = new Map<number, string>()
  let nextCol = 0

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    let assigned = false
    for (const [col, lastHash] of activeColumns) {
      if (lastHash === node.hash) {
        node.column = col
        assigned = true
        break
      }
    }

    if (!assigned) {
      let freeCol = -1
      for (let c = 0; c < nextCol; c++) {
        if (!activeColumns.has(c)) {
          freeCol = c
          break
        }
      }
      node.column = freeCol >= 0 ? freeCol : nextCol++
    }

    activeColumns.set(node.column, node.hash)
  }

  return nodes
}

export default function CommitGraph({ data, onSelectCommit }: CommitGraphProps) {
  const [hoveredHash, setHoveredHash] = useState<string | null>(null)
  const [selectedHash, setSelectedHash] = useState<string | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number } | null>(null)

  const nodes = useMemo(() => buildGraph(data.commits), [data.commits])

  const maxCol = useMemo(() => Math.max(...nodes.map((n) => n.column), 0), [nodes])

  const svgWidth = PADDING_LEFT + (maxCol + 1) * COL_WIDTH + 500
  const svgHeight = PADDING_TOP + nodes.length * ROW_HEIGHT + 20

  const handleClick = useCallback(
    (hash: string) => {
      setSelectedHash(hash)
      onSelectCommit(hash)
    },
    [onSelectCommit]
  )

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, offsetX: offset.x, offsetY: offset.y }
    e.preventDefault()
  }, [offset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setOffset({ x: dragRef.current.offsetX + dx, y: dragRef.current.offsetY + dy })
  }, [])

  const handleMouseUp = useCallback(() => {
    dragRef.current = null
  }, [])

  if (data.commits.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#555560] text-sm font-light">
        No commits to display
      </div>
    )
  }

  return (
    <div
      className="w-full h-full overflow-hidden select-none"
      style={{ background: '#050508', cursor: dragRef.current ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        width={Math.max(svgWidth, 800)}
        height={svgHeight}
        style={{
          fontFamily: '-apple-system, system-ui, sans-serif',
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
      >
        {nodes.map((node, i) => {
          const cx = PADDING_LEFT + node.column * COL_WIDTH
          const cy = node.y
          const color = BRANCH_COLORS[node.column % BRANCH_COLORS.length]
          const isHovered = hoveredHash === node.hash
          const isSelected = selectedHash === node.hash
          const shortHash = node.hash.slice(0, 7)
          const dateStr = node.date ? new Date(node.date).toLocaleDateString() : ''
          const maxMsgLen = 60
          const msg =
            node.message.length > maxMsgLen
              ? node.message.slice(0, maxMsgLen) + '...'
              : node.message

          const nextNode = i < nodes.length - 1 ? nodes[i + 1] : null
          const lineX2 = nextNode ? PADDING_LEFT + nextNode.column * COL_WIDTH : cx
          const lineY2 = nextNode ? nextNode.y : cy + ROW_HEIGHT

          return (
            <g key={node.hash}>
              {nextNode && (
                <line
                  x1={cx}
                  y1={cy + NODE_RADIUS}
                  x2={lineX2}
                  y2={lineY2 - NODE_RADIUS}
                  stroke={color}
                  strokeWidth={1.2}
                  strokeOpacity={0.4}
                />
              )}

              <circle
                cx={cx}
                cy={cy}
                r={isHovered || isSelected ? NODE_RADIUS + 2 : NODE_RADIUS}
                fill={isSelected ? '#ffffff' : color}
                stroke={isHovered ? '#ffffff' : '#1a1a24'}
                strokeWidth={isHovered || isSelected ? 2 : 1.5}
                style={{
                  cursor: 'pointer',
                  transition: 'r 0.15s ease, fill 0.15s ease, stroke 0.15s ease',
                }}
                onMouseEnter={() => setHoveredHash(node.hash)}
                onMouseLeave={() => setHoveredHash(null)}
                onClick={(e) => { e.stopPropagation(); handleClick(node.hash) }}
              />

              <text
                x={cx + NODE_RADIUS + 12}
                y={cy - 6}
                fill={isHovered || isSelected ? '#ffffff' : '#d0d0d0'}
                fontSize={12}
                fontFamily="SF Mono, Monaco, 'Cascadia Code', monospace"
                style={{ cursor: 'pointer', transition: 'fill 0.15s ease' }}
                onMouseEnter={() => setHoveredHash(node.hash)}
                onMouseLeave={() => setHoveredHash(null)}
                onClick={(e) => { e.stopPropagation(); handleClick(node.hash) }}
              >
                <tspan fontWeight="500" fill={isHovered || isSelected ? '#ffffff' : '#999'}>
                  {shortHash}
                </tspan>
                <tspan dx={8} fill={isHovered || isSelected ? '#cccccc' : '#d0d0d0'} fontSize={11}>
                  {msg}
                </tspan>
              </text>

              <text
                x={cx + NODE_RADIUS + 12}
                y={cy + 10}
                fill="#555560"
                fontSize={10}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredHash(node.hash)}
                onMouseLeave={() => setHoveredHash(null)}
                onClick={(e) => { e.stopPropagation(); handleClick(node.hash) }}
              >
                {node.author} · {dateStr}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
