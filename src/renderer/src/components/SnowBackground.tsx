import { useEffect, useRef } from 'react'

export default function SnowBackground({ density = 60 }: { density?: number }) {
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
      drift: number
    }[] = []

    for (let i = 0; i < density; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.8 + 0.3,
        dx: (Math.random() - 0.5) * 0.15,
        dy: Math.random() * 0.4 + 0.1,
        opacity: Math.random() * 0.35 + 0.05,
        swing: Math.random() * Math.PI * 2,
        swingSpeed: Math.random() * 0.015 + 0.003,
        drift: (Math.random() - 0.5) * 0.2,
      })
    }

    let frame: number
    function draw() {
      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        p.swing += p.swingSpeed
        p.x += p.dx + Math.sin(p.swing) * p.drift
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
  }, [density])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  )
}
