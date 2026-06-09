import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import StatCard from '../components/StatCard'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { Users, TrendingDown, Bot, AlertTriangle, CheckCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const D = 'http://localhost:3001/api'
const A = 'http://localhost:3002/api'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}

const riskColors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }
const riskBadge  = { high: 'badge-red', medium: 'badge-amber', low: 'badge-green' }
const trendIcons = { dropped: '⬇️', declining: '📉', stable: '➡️', improving: '📈', inactive: '💤' }

export default function TrainerDashboard() {
  const { user } = useUser()
  const [classes, setClasses] = useState([])
  const [atRisk, setAtRisk] = useState([])
  const [aiInsight, setAiInsight] = useState(null)
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [churnLoading, setChurnLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [clRes, atRes] = await Promise.all([
        fetch(`${D}/classes?trainerId=${user.id}`).then(r => r.json()),
        fetch(`${D}/classes/trainer-attendance?trainerId=${user.id}`).then(r => r.json()),
      ])
      setClasses(clRes)

      // Build weekly chart data grouped by week
      const weekMap = {}
      atRes.forEach(row => {
        if (!weekMap[row.week]) weekMap[row.week] = { week: row.week }
        weekMap[row.week][row.class_name] = (weekMap[row.week][row.class_name] || 0) + row.attended
      })
      setAttendanceData(
        Object.values(weekMap)
          .sort((a, b) => a.week.localeCompare(b.week))
          .slice(-8)
          .map(w => ({ ...w, week: w.week.replace(/^\d{4}-/, '') }))
      )
      setLoading(false)
    }
    load()

    // Load AI churn data separately (can be slow)
    fetch(`${A}/churn?trainerId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        setAtRisk(data.atRisk || [])
        setAiInsight(data.aiInsight)
        setChurnLoading(false)
      })
      .catch(() => setChurnLoading(false))
  }, [user.id])

  const highRisk = atRisk.filter(m => m.riskLevel === 'high')
  const medRisk  = atRisk.filter(m => m.riskLevel === 'medium')

  const classColors = classes.reduce((acc, c) => { acc[c.name] = c.color; return acc }, {})

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-slate-500 text-sm animate-pulse">Loading trainer hub…</div>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">
          Good session, <span style={{ color: user.avatar_color }}>Akalla</span> 🎯
        </h1>
        <p className="text-slate-500 mt-1">Monitor class attendance and member engagement across your sessions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My Classes" value={classes.length} icon="🏋️" color="#f59e0b" />
        <StatCard label="At-Risk Members" value={churnLoading ? '…' : atRisk.length} icon="⚠️" color="#ef4444"
          sub={`${highRisk.length} high, ${medRisk.length} medium`} />
        <StatCard label="High Risk" value={churnLoading ? '…' : highRisk.length} icon="🔴" color="#ef4444" />
        <StatCard label="Avg Capacity" value={classes.length > 0 ? `${Math.round(classes.reduce((s,c) => s + (c.total_bookings / c.capacity * 100), 0) / classes.length)}%` : '—'} icon="📊" color="#7c3aed" />
      </div>

      {/* AI Insight Banner */}
      {aiInsight && (
        <div className="card border-amber-500/20 bg-gradient-to-r from-amber-500/8 to-transparent">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bot size={18} className="text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-1.5 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                AI Retention Intelligence
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{aiInsight}</p>
            </div>
          </div>
        </div>
      )}

      {/* Charts & Risk table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Class attendance chart */}
        <div className="lg:col-span-3 card">
          <div className="section-title">Weekly Class Attendance (Last 8 Weeks)</div>
          {attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={attendanceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                {classes.map(c => (
                  <Bar key={c.id} dataKey={c.name} name={c.name} fill={c.color} radius={[3,3,0,0]} stackId="a" />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-slate-600 text-sm">No attendance data available</div>
          )}
        </div>

        {/* My classes list */}
        <div className="lg:col-span-2 card">
          <div className="section-title">My Classes</div>
          <div className="space-y-3">
            {classes.map(c => (
              <div key={c.id} className="p-3 rounded-xl bg-surface-hover">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm font-semibold text-white">{c.name}</span>
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  {c.schedule_days} · {c.schedule_time} · {c.duration_minutes}min · {c.location}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    {c.total_bookings || 0} total bookings
                  </div>
                  <div className="text-xs font-medium" style={{ color: c.color }}>
                    {c.capacity} cap
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* At-Risk Members Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div className="section-title flex items-center gap-2 mb-0">
            <TrendingDown size={13} /> Members Requiring Attention
          </div>
          {churnLoading && <div className="text-xs text-slate-500 animate-pulse">Analysing…</div>}
        </div>

        {atRisk.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="text-xs text-slate-500 font-medium pb-3 pr-4">Member</th>
                  <th className="text-xs text-slate-500 font-medium pb-3 pr-4">Last 14 Days</th>
                  <th className="text-xs text-slate-500 font-medium pb-3 pr-4">Prev 14 Days</th>
                  <th className="text-xs text-slate-500 font-medium pb-3 pr-4">Last Visit</th>
                  <th className="text-xs text-slate-500 font-medium pb-3 pr-4">Trend</th>
                  <th className="text-xs text-slate-500 font-medium pb-3 pr-4">Churn Risk</th>
                  <th className="text-xs text-slate-500 font-medium pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {atRisk.map(m => (
                  <tr key={m.id} className="border-t border-surface-border/50">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                             style={{ backgroundColor: m.avatar_color + '33', color: m.avatar_color }}>
                          {m.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-white">{m.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={m.last14Days === 0 ? 'text-red-400 font-semibold' : 'text-slate-300'}>
                        {m.last14Days} visit{m.last14Days !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-400">{m.prev14Days} visits</td>
                    <td className="py-3 pr-4 text-slate-400 text-xs">
                      {m.lastVisit ? format(parseISO(m.lastVisit), 'dd MMM') : 'Never'}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm">{trendIcons[m.trend] || '—'}</span>
                      <span className="text-xs text-slate-500 ml-1 capitalize">{m.trend}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-surface-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${m.churnScore}%`, backgroundColor: riskColors[m.riskLevel] }} />
                        </div>
                        <span className={riskBadge[m.riskLevel]}>{m.churnScore}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <button className="text-xs px-3 py-1.5 rounded-lg bg-primary/15 text-primary-light hover:bg-primary/25 font-medium transition-colors">
                        Send Message
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : churnLoading ? (
          <div className="text-center py-8 text-slate-500 text-sm animate-pulse">Running AI attendance analysis…</div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle size={16} />
            All members are showing healthy attendance patterns!
          </div>
        )}
      </div>
    </div>
  )
}
