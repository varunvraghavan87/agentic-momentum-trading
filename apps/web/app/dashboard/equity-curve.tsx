'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

interface EquityCurvePoint {
  date: string
  equity: number
  drawdown: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function EquityCurve() {
  const [data, setData] = useState<EquityCurvePoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_URL}/api/dashboard/equity-curve`, {
          cache: 'no-store',
        })
        if (res.ok) {
          const json = await res.json()
          setData(Array.isArray(json) ? json : json.data || [])
        }
      } catch {
        // API not available — show placeholder
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Loading chart...</p>
      </div>
    )
  }

  if (data.length === 0) {
    // Show placeholder with sample data
    const sampleData = generateSampleData()
    return (
      <div>
        <p className="text-xs text-muted-foreground mb-2">
          Sample data — connect API for live equity curve
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={sampleData}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 11%)" />
            <XAxis
              dataKey="date"
              stroke="hsl(215, 20%, 65%)"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis
              stroke="hsl(215, 20%, 65%)"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222, 47%, 11%)',
                border: '1px solid hsl(217, 33%, 17%)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [
                `₹${value.toLocaleString('en-IN')}`,
                'Equity',
              ]}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="hsl(217, 91%, 60%)"
              fill="url(#equityGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="equityGradientLive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 11%)" />
        <XAxis
          dataKey="date"
          stroke="hsl(215, 20%, 65%)"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => v.slice(5)}
        />
        <YAxis
          stroke="hsl(215, 20%, 65%)"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(222, 47%, 11%)',
            border: '1px solid hsl(217, 33%, 17%)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number) => [
            `₹${value.toLocaleString('en-IN')}`,
            'Equity',
          ]}
        />
        <Area
          type="monotone"
          dataKey="equity"
          stroke="hsl(217, 91%, 60%)"
          fill="url(#equityGradientLive)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function generateSampleData(): EquityCurvePoint[] {
  const data: EquityCurvePoint[] = []
  let equity = 1_000_000
  const startDate = new Date('2025-01-01')

  for (let i = 0; i < 60; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    // Simulate modest growth with some drawdowns
    const dailyReturn = (Math.random() - 0.48) * 0.015
    equity = equity * (1 + dailyReturn)

    data.push({
      date: date.toISOString().split('T')[0],
      equity: Math.round(equity),
      drawdown: 0,
    })
  }

  return data
}
