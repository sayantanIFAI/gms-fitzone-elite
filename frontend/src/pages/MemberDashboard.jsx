import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import StatCard from '../components/StatCard'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { Calendar, Dumbbell, Flame, TrendingUp, CheckCircle, Clock, MapPin, Bot, AlertTriangle } from 'lucide-react'
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

export default function MemberDashboard() {
  const { user } = useUser()
  const [attendanceWeekly, setAttendanceWeekly] = useState([])
  const [attendanceStats, setAttendanceStats] = useState(null)
  const [vitals, setVitals] = useState([])
  const [vitalsSummary, setVitalsSummary] = useState(null)
  const [records, setRecords] = useState([])
  const [prHistory, setPrHistory] = useState([])
  const [classes, setClasses] = useState([])
  const [upcomingBookings, setUpcomingBookings] = useState([])
  const [aiRec, setAiRec] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bookingClass, setBookingClass] = useState(null)
  const [bookingSuccess, setBookingSuccess] = useState('')

  const firstName = user.name.split(' ')[0]

  useEffect(() => {
    async function load() {
      try {
        const [wkRes, stRes, vtRes, vsRes, recRes, clRes, bkRes] = await Promise.all([
          fetch(`${D}/attendance/weekly?memberId=${user.id}&weeks=12`).then(r => r.json()),
          fetch(`${D}/attendance/stats?memberId=${user.id}`).then(r => r.json()),
          fetch(`${D}/vitals/${user.id}?weeks=12`).then(r => r.json()),
          fetch(`${D}/vitals/${user.id}/summary`).then(r => r.json()),
          fetch(`${D}/records/${user.id}`).then(r => r.json()),
          fetch(`${D}/classes`).then(r => r.json()),
          fetch(`${D}/classes/member/${user.id}?status=booked`).then(r => r.json()),
        ])
        setAttendanceWeekly(wkRes)
        setAttendanceStats(stRes)
        setVitals(vtRes.map(v => ({
          ...v,
          date: format(parseISO(v.recorded_at), 'MMM d'),
        })))
        setVitalsSummary(vsRes)
        // Group records by exercise for chart
        const grouped = {}
        recRes.forEach(r => {
          if (!grouped[r.exercise]) grouped[r.exercise] = []
          grouped[r.exercise].push({ date: format(parseISO(r.recorded_at), 'MMM d'), weight: r.weight_kg, reps: r.reps })
        })
        setRecords(recRes)
        setPrHistory(grouped)
        setClasses(clRes)
        setUpcomingBookings(bkRes)
        // AI recommendations (non-blocking)
        fetch(`${A}/recommendations/${user.id}`)
          .then(r => r.json())
          .then(data => setAiRec(data))
          .catch(() => {})
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.id])

  async function handleBookClass(classId, date) {
    const res = await fetch(`${D}/classes/${classId}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: user.id, bookingDate: date }),
    })
    const data = await res.json()
    if (data.success) {
      setBookingSuccess(`Class booked for ${format(parseISO(date), 'EEE dd MMM')}! 🎉`)
      setBookingClass(null)
      setTimeout(() => setBookingSuccess(''), 4000)
      const bkRes = await fetch(`${D}/classes/member/${user.id}?status=booked`).then(r => r.json())
      setUpcomingBookings(bkRes)
    }
  }

  const latestPRs = {}
  records.forEach(r => {
    if (!latestPRs[r.exercise] || r.recorded_at > latestPRs[r.exercise].recorded_at) {
      latestPRs[r.exercise] = r
    }
  })

  const daysSinceVisit = attendanceStats?.lastVisit
    ? Math.floor((Date.now() - new Date(attendanceStats.lastVisit)) / 86400000)
    : null

  const churnRisk = aiRec?.churnScore >= 75

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-slate-500 text-sm animate-pulse">Loading your dashboard…</div>
    </div>
  )

  // Next upcoming class dates (next 7 days)
  const today = new Date()
  const upcomingClassSlots = classes.slice(0, 4).map(cls => {
    const days = (cls.schedule_days || '').split(',')
    const dayMap = { Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:0 }
    const upcoming = []
    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]
      if (days.includes(dayName)) {
        upcoming.push(d.toISOString().split('T')[0])
        if (upcoming.length === 2) break
      }
    }
    return { ...cls, nextDates: upcoming }
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Welcome back, <span style={{ color: user.avatar_color }}>{firstName}</span> 👋
          </h1>
          <p className="text-slate-500 mt-1">
            {daysSinceVisit === 0 ? "You're in the gym today — great start!" :
             daysSinceVisit !== null ? `Last visit: ${daysSinceVisit} day${daysSinceVisit !== 1 ? 's' : ''} ago` :
             'No visits recorded yet'}
          </p>
        </div>
        {churnRisk && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2">
            <AlertTriangle size={15} className="text-amber-400" />
            <span className="text-sm text-amber-300 font-medium">Your AI coach has a message for you</span>
          </div>
        )}
      </div>

      {bookingSuccess && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-300 text-sm font-medium">
          <CheckCircle size={16} />
          {bookingSuccess}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Visits This Month" value={attendanceStats?.thisMonth ?? '—'} icon="📅" color="#7c3aed"
          sub={attendanceStats ? (attendanceStats.thisMonth > attendanceStats.lastMonth ? '↑ vs last month' : attendanceStats.thisMonth < attendanceStats.lastMonth ? '↓ vs last month' : '= last month') : ''} />
        <StatCard label="Classes Attended" value={records.length > 0 ? upcomingBookings.length + (attendanceStats?.thisMonth || 0) : '—'} icon="🏃" color="#06b6d4" />
        <StatCard label="Avg Cardio Time" value={vitalsSummary?.avg_cardio_mins ? `${vitalsSummary.avg_cardio_mins}m` : '—'} icon="❤️" color="#ef4444"
          sub={vitalsSummary?.avg_hr ? `Avg HR: ${vitalsSummary.avg_hr} bpm` : ''} />
        <StatCard label="Calories Burned" value={vitalsSummary?.total_calories ? vitalsSummary.total_calories.toLocaleString() : '—'} icon="🔥" color="#f59e0b"
          sub="Last 90 days" />
      </div>

      {/* AI Coach Banner */}
      {aiRec?.aiMessage && (
        <div className="card border-primary/30 bg-gradient-to-r from-primary/10 to-cyan-500/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bot size={18} className="text-primary-light" />
            </div>
            <div>
              <div className="text-xs font-semibold text-primary-light uppercase tracking-wide mb-1.5 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                AI Coach · FitZone Intelligence
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{aiRec.aiMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance chart */}
        <div className="card">
          <div className="section-title flex items-center gap-2"><TrendingUp size={13} /> Weekly Attendance</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={attendanceWeekly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="visits" name="Visits" fill="#7c3aed" radius={[4,4,0,0]}
                   label={false} />
            </BarChart>
          </ResponsiveContainer>
          {attendanceStats?.last14Days === 0 && (
            <div className="mt-3 text-xs text-amber-400 flex items-center gap-1.5">
              <AlertTriangle size={12} />
              No visits in last 14 days — AI churn risk: {aiRec?.churnScore ?? '…'}%
            </div>
          )}
        </div>

        {/* Vitals chart */}
        <div className="card">
          <div className="section-title flex items-center gap-2"><Flame size={13} /> Cardio & Heart Rate</div>
          {vitals.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={vitals} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis yAxisId="left"  tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Line yAxisId="left"  type="monotone" dataKey="cardio_duration_minutes" name="Cardio (min)" stroke="#06b6d4" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="heart_rate_avg" name="Avg HR" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">No vitals data recorded yet</div>
          )}
        </div>
      </div>

      {/* Personal Records & Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PRs */}
        <div className="card">
          <div className="section-title flex items-center gap-2"><Dumbbell size={13} /> Personal Records</div>
          {Object.keys(latestPRs).length > 0 ? (
            <>
              <div className="space-y-3 mb-5">
                {Object.entries(latestPRs).map(([exercise, pr]) => {
                  const history = prHistory[exercise] || []
                  const prev = history[history.length - 2]
                  const delta = prev ? pr.weight_kg - prev.weight : 0
                  return (
                    <div key={exercise} className="flex items-center justify-between p-3 bg-surface-hover rounded-xl">
                      <div>
                        <div className="text-sm font-semibold text-white">{exercise}</div>
                        <div className="text-xs text-slate-500">{format(parseISO(pr.recorded_at), 'dd MMM yyyy')}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{pr.weight_kg}<span className="text-xs text-slate-500 ml-1">kg × {pr.reps}</span></div>
                        {delta > 0 && <div className="text-xs text-emerald-400">↑ +{delta}kg</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* PR progression chart for bench */}
              {prHistory['Bench Press'] && (
                <>
                  <div className="text-xs text-slate-500 mb-2">Bench Press Progression</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={prHistory['Bench Press']} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 9 }} domain={['dataMin - 5', 'dataMax + 5']} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="weight" name="kg" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              )}
            </>
          ) : (
            <div className="text-slate-600 text-sm">No personal records logged yet</div>
          )}
        </div>

        {/* Book a Class */}
        <div className="card">
          <div className="section-title flex items-center gap-2"><Calendar size={13} /> Book a Class</div>

          {/* Upcoming bookings */}
          {upcomingBookings.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-slate-500 mb-2">Your upcoming sessions</div>
              <div className="space-y-2">
                {upcomingBookings.slice(0, 3).map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-hover">
                    <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: b.color || '#7c3aed' }} />
                    <div>
                      <div className="text-sm font-medium text-white">{b.class_name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <Clock size={10} /> {b.schedule_time}
                        <MapPin size={10} /> {b.location || 'Studio A'}
                        · {format(parseISO(b.booking_date), 'EEE dd MMM')}
                      </div>
                    </div>
                    <span className="ml-auto badge-green">Booked</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Class list to book */}
          <div className="text-xs text-slate-500 mb-2">Available classes</div>
          <div className="space-y-2">
            {upcomingClassSlots.map(cls => (
              <div key={cls.id} className="p-3 rounded-xl bg-surface-hover">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: cls.color }} />
                      {cls.name}
                    </div>
                    <div className="text-xs text-slate-500">{cls.schedule_time} · {cls.duration_minutes}min · {cls.location}</div>
                  </div>
                  <div className="text-xs text-slate-500">{(cls.trainer_name) || 'Various'}</div>
                </div>
                <div className="flex gap-2">
                  {cls.nextDates.map(date => (
                    <button
                      key={date}
                      onClick={() => handleBookClass(cls.id, date)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary-light hover:bg-primary/30 font-medium transition-colors"
                    >
                      {format(parseISO(date), 'EEE dd')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
