import { useState, useEffect } from 'react'
import { useUser } from '../../context/UserContext'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'
import { Activity, Heart, Flame, Clock, Wind, Droplets } from 'lucide-react'

const API = 'http://localhost:3001/api'

function KpiCard({ icon: Icon, label, value, unit, color, sub, trend }) {
  return (
    <div className="bg-surface-hover border border-surface-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-lg" style={{ background: `${color}22` }}>
          <Icon size={15} style={{ color }} />
        </div>
        {trend !== undefined && trend !== null && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            trend > 0 ? 'bg-emerald-500/20 text-emerald-400'
            : trend < 0 ? 'bg-red-500/20 text-red-400'
            : 'text-slate-500'
          }`}>
            {trend > 0 ? `+${trend}` : trend}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-black text-white leading-none">
          {value !== null && value !== undefined ? value : '—'}
          {value !== null && value !== undefined && unit &&
            <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
          }
        </div>
        <div className="text-xs text-slate-500 mt-1">{label}</div>
        {sub && <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-1.5 font-medium">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }}></div>
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-bold">{p.value}{p.unit || ''}</span>
        </div>
      ))}
    </div>
  )
}

export default function VitalsCardio() {
  const { user } = useUser()
  const [vitals, setVitals]   = useState([])
  const [weeks, setWeeks]     = useState(12)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/vitals/${user.id}?weeks=${weeks}`)
      .then(r => r.json())
      .then(data => setVitals(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [user.id, weeks])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-slate-500 text-sm">
        Loading vitals…
      </div>
    )
  }

  const sorted = [...vitals].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))
  const latest = sorted[sorted.length - 1]
  const prev   = sorted[sorted.length - 2]

  const chartData = sorted.map(v => ({
    date:   new Date(v.recorded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    hr_max: v.heart_rate_max,
    hr_avg: v.heart_rate_avg,
    cardio: v.cardio_duration_minutes,
    steps:  v.steps,
    vo2:    v.vo2_max != null ? parseFloat(Number(v.vo2_max).toFixed(1)) : null,
    spo2:   v.spo2,
  }))

  const now30 = Date.now() - 30 * 86400000
  const totalCalories30d = sorted
    .filter(v => new Date(v.recorded_at).getTime() >= now30)
    .reduce((s, v) => s + (v.calories_burned || 0), 0)
  const totalCardio30d = sorted
    .filter(v => new Date(v.recorded_at).getTime() >= now30)
    .reduce((s, v) => s + (v.cardio_duration_minutes || 0), 0)

  const vo2Trend = latest?.vo2_max != null && prev?.vo2_max != null
    ? parseFloat((latest.vo2_max - prev.vo2_max).toFixed(1)) : null
  const hrTrend = latest?.heart_rate_max && prev?.heart_rate_max
    ? latest.heart_rate_max - prev.heart_rate_max : null

  const hasVo2  = sorted.some(v => v.vo2_max != null)
  const hasSpo2 = sorted.some(v => v.spo2 != null)

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity size={20} className="text-cyan-400" /> Vitals &amp; Cardio
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Health metrics from your gym sessions</p>
        </div>
        <div className="flex gap-1 bg-surface-hover border border-surface-border rounded-xl p-1">
          {[4, 8, 12].map(w => (
            <button
              key={w}
              onClick={() => setWeeks(w)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                weeks === w
                  ? 'bg-primary/25 text-primary-light border border-primary/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {w}W
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center text-slate-500 py-20">No vitals data found for this period.</div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard icon={Wind}     label="VO₂ Max"        color="#7c3aed"
              value={latest?.vo2_max != null ? Number(latest.vo2_max).toFixed(1) : null}
              unit="ml/kg/min" sub="Aerobic capacity" trend={vo2Trend}
            />
            <KpiCard icon={Droplets} label="O₂ Saturation"  color="#06b6d4"
              value={latest?.spo2}  unit="%" sub="SpO₂"
            />
            <KpiCard icon={Heart}    label="Max Heart Rate"  color="#ef4444"
              value={latest?.heart_rate_max} unit="bpm" sub="Latest session" trend={hrTrend}
            />
            <KpiCard icon={Heart}    label="Avg Heart Rate"  color="#f59e0b"
              value={latest?.heart_rate_avg} unit="bpm" sub="Latest session"
            />
            <KpiCard icon={Flame}    label="Calories Burned" color="#f97316"
              value={totalCalories30d.toLocaleString()} unit="kcal" sub="Last 30 days"
            />
            <KpiCard icon={Clock}    label="Cardio Time"     color="#10b981"
              value={totalCardio30d} unit="min" sub="Last 30 days"
            />
          </div>

          {/* HR trend */}
          <div className="bg-surface-hover border border-surface-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Heart Rate Trend</h3>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={chartData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis domain={[100, 200]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={180} stroke="#ef444440" strokeDasharray="4 4" label={{ value: 'Max zone', fill: '#ef4444', fontSize: 9 }} />
                <Line type="monotone" dataKey="hr_max" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} name="Max HR" unit=" bpm" />
                <Line type="monotone" dataKey="hr_avg" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} name="Avg HR" unit=" bpm" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* VO2 + SpO2 */}
          {(hasVo2 || hasSpo2) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hasVo2 && (
                <div className="bg-surface-hover border border-surface-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">VO₂ Max Progression</h3>
                    <span className="text-xs text-slate-500">ml/kg/min</span>
                  </div>
                  <ResponsiveContainer width="100%" height={165}>
                    <AreaChart data={chartData} margin={{ left: -10 }}>
                      <defs>
                        <linearGradient id="vo2g" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis domain={[38, 52]} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="vo2" stroke="#7c3aed" fill="url(#vo2g)" strokeWidth={2.5} dot={{ r: 3.5, fill: '#7c3aed' }} name="VO₂ Max" unit=" ml/kg/min" connectNulls />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
              {hasSpo2 && (
                <div className="bg-surface-hover border border-surface-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">O₂ Saturation (SpO₂)</h3>
                    <span className="text-xs text-slate-500">normal: 95–100%</span>
                  </div>
                  <ResponsiveContainer width="100%" height={165}>
                    <AreaChart data={chartData} margin={{ left: -10 }}>
                      <defs>
                        <linearGradient id="spo2g" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis domain={[93, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <ReferenceLine y={95} stroke="#f59e0b50" strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="spo2" stroke="#06b6d4" fill="url(#spo2g)" strokeWidth={2.5} dot={{ r: 3.5, fill: '#06b6d4' }} name="SpO₂" unit="%" connectNulls />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Cardio + steps */}
          <div className="bg-surface-hover border border-surface-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Cardio Duration &amp; Steps</h3>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={chartData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis yAxisId="l" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <Line yAxisId="l" type="monotone" dataKey="cardio" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} name="Cardio" unit=" min" />
                <Line yAxisId="r" type="monotone" dataKey="steps"  stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} name="Steps" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Session history table */}
          <div className="bg-surface-hover border border-surface-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-border">
              <h3 className="text-sm font-semibold text-white">Session History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-border/30">
                    {['Date', 'VO₂ Max', 'SpO₂', 'Max HR', 'Avg HR', 'Calories', 'Cardio', 'Steps'].map(h => (
                      <th key={h} className={`px-4 py-2.5 text-slate-400 font-medium ${h === 'Date' ? 'text-left' : 'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...sorted].reverse().map(v => (
                    <tr key={v.id} className="border-b border-surface-border/50 hover:bg-surface-border/20 transition-colors">
                      <td className="px-4 py-2.5 text-slate-300 font-medium whitespace-nowrap">
                        {new Date(v.recorded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-2.5 text-right text-violet-400 font-bold">
                        {v.vo2_max != null ? Number(v.vo2_max).toFixed(1) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-cyan-400 font-bold">
                        {v.spo2 != null ? `${v.spo2}%` : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-red-400">{v.heart_rate_max}</td>
                      <td className="px-4 py-2.5 text-right text-amber-400">{v.heart_rate_avg}</td>
                      <td className="px-4 py-2.5 text-right text-orange-400">{v.calories_burned?.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-emerald-400">{v.cardio_duration_minutes} min</td>
                      <td className="px-4 py-2.5 text-right text-blue-400">{v.steps?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
