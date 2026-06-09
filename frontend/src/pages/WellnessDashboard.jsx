import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import StatCard from '../components/StatCard'
import { Calendar, Clock, User, CheckCircle, X, Sparkles } from 'lucide-react'
import { format, parseISO, addDays } from 'date-fns'

const D = 'http://localhost:3001/api'

export default function WellnessDashboard() {
  const { user } = useUser()
  const [services, setServices] = useState([])
  const [bookings, setBookings] = useState([])
  const [attendanceStats, setAttendanceStats] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [availability, setAvailability] = useState([])
  const [notes, setNotes] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [svcRes, bkRes, stRes] = await Promise.all([
        fetch(`${D}/services`).then(r => r.json()),
        fetch(`${D}/services/bookings?memberId=${user.id}`).then(r => r.json()),
        fetch(`${D}/attendance/stats?memberId=${user.id}`).then(r => r.json()),
      ])
      setServices(svcRes)
      setBookings(bkRes)
      setAttendanceStats(stRes)
      setLoading(false)
    }
    load()
  }, [user.id])

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetch(`${D}/services/availability?serviceId=${selectedService.id}&date=${selectedDate}`)
        .then(r => r.json())
        .then(d => setAvailability(d.available || []))
    }
  }, [selectedService, selectedDate])

  async function handleBook() {
    if (!selectedService || !selectedDate || !selectedSlot) return
    const bookingDatetime = `${selectedDate}T${selectedSlot}:00.000Z`
    const res = await fetch(`${D}/services/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId: selectedService.id, memberId: user.id, bookingDatetime, notes }),
    })
    const data = await res.json()
    if (data.success) {
      setBookingSuccess({ service: selectedService.name, date: selectedDate, slot: selectedSlot })
      setSelectedService(null); setSelectedDate(''); setSelectedSlot(''); setNotes('')
      const bkRes = await fetch(`${D}/services/bookings?memberId=${user.id}`).then(r => r.json())
      setBookings(bkRes)
      setTimeout(() => setBookingSuccess(null), 5000)
    }
  }

  async function handleCancel(bookingId) {
    await fetch(`${D}/services/bookings/${bookingId}`, { method: 'DELETE' })
    const bkRes = await fetch(`${D}/services/bookings?memberId=${user.id}`).then(r => r.json())
    setBookings(bkRes)
  }

  const upcoming = bookings.filter(b => b.status === 'confirmed' && b.booking_datetime > new Date().toISOString())
  const past = bookings.filter(b => b.status === 'completed' || b.booking_datetime <= new Date().toISOString())

  const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const maxDate = format(addDays(new Date(), 30), 'yyyy-MM-dd')

  const categoryIcons = { massage: '💆', physio: '🩺', wellness: '💧' }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-slate-500 text-sm animate-pulse">Loading wellness hub…</div></div>

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">
          Hello, <span style={{ color: user.avatar_color }}>Susan</span> 💆
        </h1>
        <p className="text-slate-500 mt-1">Your personal wellness & recovery hub</p>
      </div>

      {/* Success toast */}
      {bookingSuccess && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-300 text-sm font-medium">
          <CheckCircle size={16} />
          {bookingSuccess.service} booked for {format(parseISO(bookingSuccess.date), 'EEEE dd MMM')} at {bookingSuccess.slot} 🎉
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Visits This Month" value={attendanceStats?.thisMonth ?? '—'} icon="🏃" color="#06b6d4" />
        <StatCard label="Total Sessions" value={bookings.length} icon="💆" color="#7c3aed" />
        <StatCard label="Upcoming" value={upcoming.length} icon="📅" color="#10b981" />
        <StatCard label="Next Visit" value={upcoming.length > 0 ? format(parseISO(upcoming[0].booking_datetime), 'dd MMM') : '—'} icon="⏰" color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Service Booking */}
        <div className="lg:col-span-3 space-y-4">
          <div className="section-title flex items-center gap-2"><Sparkles size={13} /> Book a Wellness Service</div>

          {/* Service Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map(svc => (
              <button
                key={svc.id}
                onClick={() => { setSelectedService(svc); setSelectedSlot(''); setSelectedDate('') }}
                className={`text-left p-4 rounded-2xl border transition-all duration-200 ${
                  selectedService?.id === svc.id
                    ? 'border-cyan-500/60 bg-cyan-500/10'
                    : 'border-surface-border bg-surface-card hover:border-surface-hover'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-2xl">{categoryIcons[svc.category] || '✨'}</div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">£{svc.price}</div>
                    <div className="text-xs text-slate-500">{svc.duration_minutes} min</div>
                  </div>
                </div>
                <div className="font-semibold text-white text-sm mb-1">{svc.name}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{svc.description}</div>
                <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                  <User size={10} /> {svc.provider}
                </div>
              </button>
            ))}
          </div>

          {/* Booking form */}
          {selectedService && (
            <div className="card border-cyan-500/20 animate-in">
              <div className="text-sm font-semibold text-white mb-4">
                Book: <span className="text-cyan-400">{selectedService.name}</span>
                <span className="text-slate-500 font-normal ml-2">with {selectedService.provider}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Select Date</label>
                  <input
                    type="date" min={minDate} max={maxDate} value={selectedDate}
                    onChange={e => { setSelectedDate(e.target.value); setSelectedSlot('') }}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Notes (optional)</label>
                  <input
                    type="text" placeholder="Any special requests…" value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="input text-sm"
                  />
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div className="mb-4">
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-1"><Clock size={11} /> Available times on {format(parseISO(selectedDate), 'EEEE dd MMM')}</div>
                  {availability.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {availability.map(slot => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                            selectedSlot === slot
                              ? 'bg-cyan-500 text-white'
                              : 'bg-surface-hover text-slate-300 hover:bg-surface-border'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">No available slots on this date</div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleBook}
                  disabled={!selectedDate || !selectedSlot}
                  className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirm Booking — £{selectedService.price}
                </button>
                <button onClick={() => setSelectedService(null)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* My Bookings */}
        <div className="lg:col-span-2 space-y-4">
          {/* Upcoming */}
          <div>
            <div className="section-title flex items-center gap-2"><Calendar size={13} /> Upcoming Bookings</div>
            {upcoming.length > 0 ? (
              <div className="space-y-3">
                {upcoming.map(b => (
                  <div key={b.id} className="card-hover relative">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                           style={{ backgroundColor: b.color + '22' }}>
                        {categoryIcons[b.category] || '✨'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">{b.service_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {format(parseISO(b.booking_datetime), 'EEE dd MMM · HH:mm')} · {b.duration_minutes} min
                        </div>
                        <div className="text-xs text-slate-500">with {b.provider}</div>
                      </div>
                      <button onClick={() => handleCancel(b.id)} className="text-slate-600 hover:text-red-400 transition-colors mt-0.5">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="badge-cyan">Confirmed</span>
                      <span className="text-sm font-bold text-white">£{b.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-8">
                <div className="text-3xl mb-2">📅</div>
                <div className="text-sm text-slate-500">No upcoming bookings</div>
                <div className="text-xs text-slate-600 mt-1">Select a service on the left to book</div>
              </div>
            )}
          </div>

          {/* Past */}
          <div>
            <div className="section-title">Recent Sessions</div>
            <div className="space-y-2">
              {past.slice(0, 4).map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-hover">
                  <div className="text-lg">{categoryIcons[b.category] || '✨'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-300 truncate">{b.service_name}</div>
                    <div className="text-xs text-slate-500">
                      {b.booking_datetime ? format(parseISO(b.booking_datetime), 'dd MMM yyyy') : '—'}
                    </div>
                  </div>
                  <span className="badge-gray">Completed</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
