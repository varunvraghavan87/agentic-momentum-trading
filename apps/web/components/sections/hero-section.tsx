'use client'

import { ArrowDown } from 'lucide-react'
import { useEffect, useRef } from 'react'

export function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number

    const initCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    initCanvas()

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
    }> = []

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
      })
    }

    function animate() {
      if (!ctx || !canvas) return

      ctx.fillStyle = 'rgba(10, 14, 26, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#3b82f6'
      ctx.strokeStyle = '#3b82f6'

      particles.forEach((particle, i) => {
        particle.x += particle.vx
        particle.y += particle.vy

        // Keep particles within bounds after resize
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.vx *= -1
          particle.x = Math.max(0, Math.min(canvas.width, particle.x))
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.vy *= -1
          particle.y = Math.max(0, Math.min(canvas.height, particle.y))
        }

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()

        particles.forEach((otherParticle, j) => {
          if (i === j) return
          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 * (1 - distance / 150)})`
            ctx.stroke()
          }
        })
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      const oldWidth = canvas.width
      const oldHeight = canvas.height
      
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Scale particle positions to new canvas size
      particles.forEach((particle) => {
        particle.x = (particle.x / oldWidth) * canvas.width
        particle.y = (particle.y / oldHeight) * canvas.height
      })
    }

    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: '#0a0e1a' }}
      />
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className="inline-block mb-6 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-sm text-primary font-mono">Implementation Guide v1.0</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">
          Agentic Momentum Trading Framework
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-4 text-balance">
          AI-Powered Systematic Trading for Indian Equities
        </p>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-12 text-pretty">
          A comprehensive implementation guide for building production-ready algorithmic trading systems using the Nifty Velocity Alpha framework, multi-agent AI orchestration, and cloud-native architecture.
        </p>
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="px-4 py-2 rounded-lg bg-card border border-border">
              <span className="text-sm text-muted-foreground">Multi-Agent AI</span>
            </div>
            <div className="px-4 py-2 rounded-lg bg-card border border-border">
              <span className="text-sm text-muted-foreground">SEBI Compliant</span>
            </div>
            <div className="px-4 py-2 rounded-lg bg-card border border-border">
              <span className="text-sm text-muted-foreground">Cloud-Native</span>
            </div>
            <div className="px-4 py-2 rounded-lg bg-card border border-border">
              <span className="text-sm text-muted-foreground">Real-Time Execution</span>
            </div>
          </div>
          <div className="mt-8 animate-bounce">
            <ArrowDown className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>
    </section>
  )
}
