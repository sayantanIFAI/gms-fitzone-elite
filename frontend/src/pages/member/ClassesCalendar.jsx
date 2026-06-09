import { useState, useEffect, useCallback } from 'react'
import { useUser } from '../../context/UserContext'
import { ChevronLeft, ChevronRight, Clock, MapPin, Users, X, CalendarCheck } from 'lucide-react'

const API = 'http://localhost:3001/api'
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getMondayOf(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getWeekDates(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

function isTodayDate(date) {
  const today = new Date()
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth()    === today.getMonth()    &&
         date.getDate()     === today.getDate()
}

async function apiFetch(url, options = {}) {
  const r = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`)
  return data
}

export default function ClassesCalendar() {
  const { user } = useUser()
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()))
  const [classes, setClasses]         = useState([])
  const [bookingCounts, setBookingCounts] = useState({})
  const [myBookings, setMyBookings]       = useState({})
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [toast, setToast]       = useState(null)

  const weekDates = getWeekDates(weekStart)
  const startStr  = toDateStr(weekDates[0])
  const endStr    = toDateStr(weekDates[6])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [classesData, countsData, myData] = await Promise.all([
        apiFetch(`${API}/classes`),
        apiFetch(`${API}/classes/booking-counts?startDate=${startStr}&endDate=${endStr}`),
        apiFetch(`${API}/classes/member/${user.id}?startDate=${startStr}&endDate=${endStr}`),
      ])
      setClasses(classesData)

      const countMap = {}
      countsData.forEach(r => { countMap[`${r.class_id}_${r.booking_date}`] = r.booked_count })
      setBookingCounts(countMap)

      const myMap = {}
      myData.forEach(b => { myMap[`${b.class_id}_${b.booking_date}`] = b.id })
      setMyBookings(myMap)
    } catch (err) {
      console.error('Calendar load error:', err)
    } finally {
      setLoading(false)
    }
  }, [startStr, endStr, user.id])

  useEffect(() => { loadData() }, [loadData])

  function getClassesForDay(date) {
    const dayIdx = date.getDay() === 0 ? 6 : date.getDay() - 1
    const dayName = DAYS[dayIdx]
    return classes.filter(c =>
      c.schedule_days.split(',').map(d => d.trim()).includes(dayName)
    )
  }

  function getCardStatus(cls, dateStr) {
    const key = `${cls.id}_${dateStr}`
    if (myBookings[key]) return 'booked'
    const booked = bookingCounts[key] || 0
    if (booked >= cls.capacity) return 'full'
    return 'available'
  }

  function getSeatsLeft(cls, dateStr) {
    const booked = bookingCounts[`${cls.id}_${dateStr}`] || 0
    return Math.max(0, cls.capacity - booked)
  }

  async function handleBook(cls, dateStr) {
    setActionBusy(true)
    try {
      await apiFetch(`${API}/classes/${cls.id}/book`, {
        method: 'POST',
        body: JSON.stringify({ memberId: user.id, bookingDate: dateStr }),
      })
      await loadData()
      setModal(null)
      showToast(`Booked: ${cls.name} · ${new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`)
    } catch (err) {
      showToast(err.message || 'Booking failed', 'error')
    } finally {
      setActionBusy(false)
    }
  }

  async function handleCancel(cls, dateStr) {
    const bookingId = myBookings[`${cls.id}_${dateStr}`]
    if (!bookingId) return
    setActionBusy(true)
    try {
      await apiFetch(`${API}/classes/booking/${bookingId}`, { method: 'DELETE' })
      await loadData()
      setModal(null)
      showToast(`Cancelled: ${cls.name}`, 'info')
    } catch (err) {
      showToast(err.message || 'Cancellation failed', 'error')
    } finally {
      setActionBusy(false)
    }
  }

  const cardStyle = {
    booked:    'bg-violet-500/15 border-violet-500/40 hover:bg-violet-500/25 cursor-pointer',
    available: 'bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/18 cursor-pointer',
    full:      'bg-red-500/8 border-red-500/25 opacity-70',
  }

  return (
    <div className="p-6 space-y-5 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl border ${
          toast.type === 'error' ? 'bg-red-500/20 border-red-500/40 text-red-300'
          : toast.type === 'info' ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
          : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarCheck size={20} className="text-violet-400" /> Class Schedule
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Click any class to book or manage your reservation</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {[
            { color: 'bg-violet-500', label: 'Your booking' },
            { color: 'bg-emerald-500', label: 'Available' },
            { color: 'bg-red-500', label: 'Full' },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5 text-slate-400">
              <span className={`w-2.5 h-2.5 rounded-full ${l.color}`}></span> {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Week Nav */}
      <div className="flex items-center justify-between bg-surface-hover border border-surface-border rounded-xl px-4 py-3">
        <button
          onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })}
          className="p-1.5 rounded-lg hover:bg-surface-border transition-colors text-slate-400 hover:text-white"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-sm font-semibold text-white text-center">
          {weekDates[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} —{' '}
          {weekDates[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <button
          onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })}
          className="p-1.5 rounded-lg hover:bg-surface-border transition-colors text-slate-400 hover:text-white"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Loading schedule…</div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {weekDates.map((date, i) => {
            const isToday = isTodayDate(date)
            return (
              <div key={i} className={`text-center pb-2.5 border-b-2 ${isToday ? 'border-violet-500' : 'border-surface-border'}`}>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-violet-400' : 'text-slate-500'}`}>
                  {DAYS[i]}
                </div>
                <div className={`text-base font-bold mt-0.5 ${isToday ? 'text-violet-300' : 'text-slate-200'}`}>
                  {date.getDate()}
                </div>
                {isToday && <div className="text-[9px] text-violet-400 font-semibold tracking-widest">TODAY</div>}
              </div>
            )
          })}

          {/* Class cards per day */}
          {weekDates.map((date, i) => {
            const dateStr    = toDateStr(date)
            const dayClasses = getClassesForDay(date)
            const isPast     = date < new Date() && !isTodayDate(date)

            return (
              <div key={i} className={`min-h-48 space-y-1.5 pt-1 ${isPast ? 'opacity-50' : ''}`}>
                {dayClasses.length === 0 ? (
                  <div className="h-full flex items-start pt-6 justify-center text-slate-700 text-xs select-none">—</div>
                ) : dayClasses.sort((a, b) => a.schedule_time.localeCompare(b.schedule_time)).map(cls => {
                  const status    = getCardStatus(cls, dateStr)
                  const seatsLeft = getSeatsLeft(cls, dateStr)

                  return (
                    <div
                      key={cls.id}
                      className={`rounded-lg border p-2 transition-all text-left ${cardStyle[status]} ${isPast ? '!cursor-default' : ''}`}
                      onClick={() => !isPast && setModal({ cls, dateStr, status, seatsLeft })}
                    >
                      <div className="text-[11px] font-bold text-white leading-tight truncate">{cls.name}</div>
                      <div className={`text-[10px] mt-0.5 font-medium ${
                        cls.category === 'hiit'    ? 'text-red-400' :
                        cls.category === 'strength' ? 'text-amber-400' :
                        cls.category === 'cardio'   ? 'text-blue-400' :
                        cls.category === 'wellness' ? 'text-cyan-400' : 'text-slate-400'
                      }`}>
                        {formatTime(cls.schedule_time)}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{cls.trainer_name || 'TBC'}</div>
                      <div className={`text-[10px] mt-1.5 font-semibold ${
                        status === 'booked' ? 'text-violet-300' :
                        status === 'full'   ? 'text-red-400'    : 'text-emerald-400'
                      }`}>
                        {status === 'booked' ? '✓ Booked' : status === 'full' ? 'Full' : `${seatsLeft} free`}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* Booking Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-[#0f172a] border border-slate-700 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                  modal.status === 'booked' ? 'text-violet-400' :
                  modal.status === 'full'   ? 'text-red-400'    : 'text-emerald-400'
                }`}>
                  {modal.status === 'booked' ? 'Your Booking' : modal.status === 'full' ? 'Class Full' : 'Book Class'}
                </div>
                <h3 className="text-lg font-bold text-white">{modal.cls.name}</h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  {new Date(modal.dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
              <button onClick={() => setModal(null)} className="text-slate-600 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 mb-5">
              <div className="flex items-center gap-2.5 text-sm text-slate-300">
                <Clock size={14} className="text-slate-500 flex-shrink-0" />
                {formatTime(modal.cls.schedule_time)} · {modal.cls.duration_minutes} min
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-300">
                <MapPin size={14} className="text-slate-500 flex-shrink-0" />
                {modal.cls.location}
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-300">
                <Users size={14} className="text-slate-500 flex-shrink-0" />
                {modal.status === 'booked'
                  ? `You're booked · ${modal.seatsLeft} seat${modal.seatsLeft !== 1 ? 's' : ''} remaining`
                  : modal.status === 'full'
                    ? `0 of ${modal.cls.capacity} seats available`
                    : `${modal.seatsLeft} of ${modal.cls.capacity} seats available`
                }
              </div>
              {modal.cls.trainer_name && (
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <span className="w-3.5 text-center text-slate-500 flex-shrink-0">👤</span>
                  {modal.cls.trainer_name}
                </div>
              )}
            </div>

            {modal.cls.description && (
              <p className="text-xs text-slate-500 mb-5 leading-relaxed border-t border-slate-700/50 pt-4">
                {modal.cls.description}
              </p>
            )}

            {modal.status === 'booked' ? (
              <button
                disabled={actionBusy}
                onClick={() => handleCancel(modal.cls, modal.dateStr)}
                className="w-full py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/25 transition-all disabled:opacity-40"
              >
                {actionBusy ? 'Cancelling…' : 'Cancel Booking'}
              </button>
            ) : modal.status === 'full' ? (
              <div className="w-full py-2.5 rounded-xl bg-red-500/8 border border-red-500/20 text-red-500 text-sm font-medium text-center select-none">
                Class Full — No spots available
              </div>
            ) : (
              <button
                disabled={actionBusy}
                onClick={() => handleBook(modal.cls, modal.dateStr)}
                className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/30 transition-all disabled:opacity-40"
              >
                {actionBusy ? 'Booking…' : 'Confirm Booking'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
