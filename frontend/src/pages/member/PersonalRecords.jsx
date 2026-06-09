import { useState, useEffect } from 'react'
import { useUser } from '../../context/UserContext'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'
import { Plus, Dumbbell, Timer, Trophy, X, Zap, ArrowUpRight } from 'lucide-react'

const API = 'http://localhost:3001/api'

const DIGITAL_EXERCISES = [
  'Treadmill 5km', 'Treadmill 10km',
  'Stationary Bike 10km', 'Stationary Bike 20km',
  'Rowing Machine 2km',
]
const ANALOG_EXERCISES = [
  'Bench Press', 'Back Squat', 'Deadlift',
  'Overhead Press', 'Barbell Row', 'Pull-up (weighted)',
  'Leg Press', 'Hip Thrust',
]

function formatDuration(secs) {
  if (secs == null) return '—'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function parseDuration(str) {
  if (!str) return null
  const parts = str.split(':')
  if (parts.length !== 2) return null
  const m = parseInt(parts[0], 10)
  const s = parseInt(parts[1], 10)
  if (isNaN(m) || isNaN(s) || s > 59) return null
  return m * 60 + s
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-1">{label}</div>
      <div className="text-white font-bold">{d?.label}</div>
    </div>
  )
}

export default function PersonalRecords() {
  const { user } = useUser()
  const [records, setRecords]     = useState([])
  const [selected, setSelected]   = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [lastVitals, setLastVitals] = useState(null)

  const [formExercise, setFormExercise] = useState('')
  const [formType, setFormType]         = useState('analog')
  const [formWeight, setFormWeight]     = useState('')
  const [formReps, setFormReps]         = useState('')
  const [formDistance, setFormDistance] = useState('')
  const [formTime, setFormTime]         = useState('')
  const [formNotes, setFormNotes]       = useState('')

  const loadRecords = async (keepSelected) => {
    setLoading(true)
    try {
      const r    = await fetch(`${API}/records/${user.id}`)
      const data = await r.json()
      setRecords(data)
      if (data.length > 0 && !keepSelected) {
        const first = [...new Set(data.map(r => r.exercise))][0]
        setSelected(first)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRecords(false) }, [user.id])

  const fetchLastVitals = async () => {
    try {
      const r    = await fetch(`${API}/vitals/${user.id}/summary`)
      const data = await r.json()
      setLastVitals(data)
    } catch {
      setLastVitals(null)
    }
  }

  const handleExercisePick = (ex) => {
    const isDigital = DIGITAL_EXERCISES.includes(ex)
    setFormExercise(ex)
    setFormType(isDigital ? 'digital' : 'analog')
    if (isDigital) {
      const km = ex.match(/(\d+)km/)
      if (km) setFormDistance(km[1])
      fetchLastVitals()
    }
  }

  const handleAutoFill = () => {
    if (lastVitals?.avg_cardio_mins) {
      setFormTime(`${lastVitals.avg_cardio_mins}:00`)
    }
  }

  const handleSave = async () => {
    if (!formExercise) return
    setSaving(true)
    try {
      const body = { exercise: formExercise, machine_type: formType, notes: formNotes || undefined }
      if (formType === 'analog') {
        body.weight_kg = parseFloat(formWeight) || undefined
        body.reps      = parseInt(formReps, 10)  || undefined
      } else {
        body.distance_km      = parseFloat(formDistance) || undefined
        body.duration_seconds = parseDuration(formTime)  || undefined
      }
      const r = await fetch(`${API}/records/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        const err = await r.json()
        throw new Error(err.error || 'Save failed')
      }
      const savedEx = formExercise
      setFormExercise(''); setFormWeight(''); setFormReps('')
      setFormDistance(''); setFormTime(''); setFormNotes('')
      setShowModal(false)
      await loadRecords(true)
      setSelected(savedEx)
    } catch (err) {
      alert(err.message || 'Failed to save record')
    } finally {
      setSaving(false)
    }
  }

  const exercises       = [...new Set(records.map(r => r.exercise))]
  const exerciseRecords = records
    .filter(r => r.exercise === selected)
    .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))
  const latestPR        = exerciseRecords[exerciseRecords.length - 1]
  const prevPR          = exerciseRecords[exerciseRecords.length - 2]
  const isDigitalSel    = selected ? DIGITAL_EXERCISES.includes(selected) : false

  const improvement = (() => {
    if (!latestPR || !prevPR) return null
    if (isDigitalSel) {
      if (!latestPR.duration_seconds || !prevPR.duration_seconds) return null
      const diff = prevPR.duration_seconds - latestPR.duration_seconds
      if (diff <= 0) return null
      return `−${formatDuration(diff)} vs previous`
    } else {
      if (!latestPR.weight_kg || !prevPR.weight_kg) return null
      const diff = latestPR.weight_kg - prevPR.weight_kg
      if (diff <= 0) return null
      return `+${diff}kg vs previous`
    }
  })()

  const chartData = exerciseRecords.map(r => {
    const val = isDigitalSel
      ? (r.duration_seconds ? parseFloat((r.duration_seconds / 60).toFixed(1)) : null)
      : r.weight_kg
    return {
      date:  new Date(r.recorded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      value: val,
      label: isDigitalSel
        ? `${formatDuration(r.duration_seconds)} for ${r.distance_km}km`
        : `${r.weight_kg}kg × ${r.reps} reps`,
    }
  })

  const numericalVals = exerciseRecords.map(r =>
    isDigitalSel ? (r.duration_seconds ? r.duration_seconds / 60 : null) : r.weight_kg
  ).filter(Boolean)
  const bestVal = isDigitalSel
    ? (numericalVals.length ? Math.min(...numericalVals) : null)
    : (numericalVals.length ? Math.max(...numericalVals) : null)

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy size={20} className="text-amber-400" /> Personal Records
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Track your strength and endurance milestones</p>
        </div>
        <button
          onClick={() => { setFormExercise(''); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 text-primary-light rounded-xl text-sm font-semibold hover:bg-primary/30 transition-all"
        >
          <Plus size={14} /> Log New Record
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-20 text-sm">Loading records…</div>
      ) : exercises.length === 0 ? (
        <div className="text-center text-slate-500 py-20 text-sm">
          No records yet. Hit <strong className="text-slate-300">Log New Record</strong> to get started.
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4">

          {/* Exercise sidebar */}
          <div className="col-span-12 md:col-span-3 space-y-1.5">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold px-1 mb-2">
              Your Exercises
            </div>
            {exercises.map(ex => {
              const exRecs  = records.filter(r => r.exercise === ex)
                                     .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))
              const latest  = exRecs[exRecs.length - 1]
              const isDig   = DIGITAL_EXERCISES.includes(ex)
              const active  = selected === ex
              return (
                <button
                  key={ex}
                  onClick={() => setSelected(ex)}
                  className={`w-full text-left px-3 py-3 rounded-xl border transition-all ${
                    active
                      ? 'bg-primary/20 border-primary/40 text-white shadow-sm'
                      : 'bg-surface-hover border-surface-border text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {isDig
                      ? <Timer size={11} className={active ? 'text-cyan-400' : 'text-slate-500'} />
                      : <Dumbbell size={11} className={active ? 'text-violet-400' : 'text-slate-500'} />
                    }
                    <span className="text-xs font-semibold truncate">{ex}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pl-4">
                    {isDig
                      ? `Best: ${formatDuration(latest?.duration_seconds)}`
                      : `Best: ${latest?.weight_kg ?? '—'}kg × ${latest?.reps ?? '—'}`
                    }
                  </div>
                  <div className="text-[9px] text-slate-600 pl-4">{exRecs.length} sessions</div>
                </button>
              )
            })}
          </div>

          {/* Detail panel */}
          <div className="col-span-12 md:col-span-9 space-y-4">
            {selected && latestPR && (
              <>
                {/* PR banner */}
                <div className="bg-surface-hover border border-surface-border rounded-xl p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Trophy size={14} className="text-amber-400" />
                        <span className="text-sm font-bold text-white">{selected}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          isDigitalSel
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-violet-500/20 text-violet-400'
                        }`}>
                          {isDigitalSel ? 'Digital Machine' : 'Analog / Free Weight'}
                        </span>
                      </div>
                      {isDigitalSel ? (
                        <div className="flex items-end gap-2">
                          <span className="text-4xl font-black text-white">{formatDuration(latestPR.duration_seconds)}</span>
                          <span className="text-base text-slate-400 mb-1">for {latestPR.distance_km}km</span>
                        </div>
                      ) : (
                        <div className="flex items-end gap-2">
                          <span className="text-4xl font-black text-white">{latestPR.weight_kg}</span>
                          <span className="text-base text-slate-400 mb-1">kg</span>
                          <span className="text-xl font-bold text-slate-400 mb-0.5">× {latestPR.reps} reps</span>
                        </div>
                      )}
                      <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
                        <span>
                          Set {new Date(latestPR.recorded_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </span>
                        {improvement && (
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                            <ArrowUpRight size={11} /> {improvement}
                          </span>
                        )}
                      </div>
                      {latestPR.notes && (
                        <div className="text-xs text-slate-500 mt-1 italic">&ldquo;{latestPR.notes}&rdquo;</div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black text-slate-600">{exerciseRecords.length}</div>
                      <div className="text-xs text-slate-600">sessions</div>
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div className="bg-surface-hover border border-surface-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-1">
                    {isDigitalSel ? 'Time Progression' : 'Weight Progression'}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    {isDigitalSel ? 'Lower is better' : 'Progressive overload over time'}
                  </p>
                  <ResponsiveContainer width="100%" height={190}>
                    <LineChart data={chartData} margin={{ left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => isDigitalSel ? `${v}m` : `${v}kg`} />
                      <Tooltip content={<ChartTooltip />} />
                      {bestVal != null && (
                        <ReferenceLine
                          y={bestVal}
                          stroke={isDigitalSel ? '#06b6d450' : '#7c3aed50'}
                          strokeDasharray="5 5"
                          label={{ value: 'Current PR', fill: isDigitalSel ? '#06b6d4' : '#7c3aed', fontSize: 9, position: 'insideTopRight' }}
                        />
                      )}
                      <Line
                        type="monotone" dataKey="value"
                        stroke={isDigitalSel ? '#06b6d4' : '#7c3aed'}
                        strokeWidth={2.5}
                        dot={{ r: 4.5, fill: isDigitalSel ? '#06b6d4' : '#7c3aed', stroke: '#0f172a', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* History table */}
                <div className="bg-surface-hover border border-surface-border rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-surface-border">
                    <h3 className="text-sm font-semibold text-white">Session Log</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-surface-border bg-surface-border/30">
                          <th className="px-4 py-2.5 text-left text-slate-400 font-medium">Date</th>
                          {isDigitalSel ? <>
                            <th className="px-4 py-2.5 text-right text-slate-400 font-medium">Distance</th>
                            <th className="px-4 py-2.5 text-right text-slate-400 font-medium">Time</th>
                          </> : <>
                            <th className="px-4 py-2.5 text-right text-slate-400 font-medium">Weight</th>
                            <th className="px-4 py-2.5 text-right text-slate-400 font-medium">Reps</th>
                          </>}
                          <th className="px-4 py-2.5 text-left text-slate-400 font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...exerciseRecords].reverse().map((r, i) => (
                          <tr key={r.id} className={`border-b border-surface-border/50 transition-colors ${i === 0 ? 'bg-primary/5' : 'hover:bg-surface-border/20'}`}>
                            <td className="px-4 py-2.5 text-slate-300 font-medium whitespace-nowrap">
                              {new Date(r.recorded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {i === 0 && <span className="ml-2 text-[9px] text-primary-light font-bold uppercase tracking-wide">PR</span>}
                            </td>
                            {isDigitalSel ? <>
                              <td className="px-4 py-2.5 text-right text-cyan-400">{r.distance_km}km</td>
                              <td className="px-4 py-2.5 text-right text-white font-bold">{formatDuration(r.duration_seconds)}</td>
                            </> : <>
                              <td className="px-4 py-2.5 text-right text-violet-400 font-bold">{r.weight_kg}kg</td>
                              <td className="px-4 py-2.5 text-right text-slate-300">{r.reps}</td>
                            </>}
                            <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate">{r.notes || <span className="text-slate-700">—</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Log New Record</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-600 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Step 1 – exercise picker */}
            {!formExercise ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase font-semibold tracking-widest mb-2">
                    <Dumbbell size={10} /> Analog / Free Weights
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ANALOG_EXERCISES.map(ex => (
                      <button key={ex} onClick={() => handleExercisePick(ex)}
                        className="px-3 py-2 bg-slate-800 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-violet-500/20 border border-transparent hover:border-violet-500/30 transition-all text-left">
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase font-semibold tracking-widest mb-2">
                    <Timer size={10} /> Digital / Cardio Machines
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DIGITAL_EXERCISES.map(ex => (
                      <button key={ex} onClick={() => handleExercisePick(ex)}
                        className="px-3 py-2 bg-slate-800 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-cyan-500/20 border border-transparent hover:border-cyan-500/30 transition-all text-left">
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Step 2 – data entry */
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 rounded-xl">
                  {formType === 'digital'
                    ? <Timer size={13} className="text-cyan-400" />
                    : <Dumbbell size={13} className="text-violet-400" />
                  }
                  <span className="text-sm font-semibold text-white flex-1">{formExercise}</span>
                  <button onClick={() => { setFormExercise(''); setFormType('analog') }}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    change
                  </button>
                </div>

                {formType === 'analog' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Weight (kg)</label>
                      <input type="number" step="0.5" min="0" placeholder="e.g. 92.5"
                        value={formWeight} onChange={e => setFormWeight(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60 placeholder-slate-600" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Reps</label>
                      <input type="number" min="1" placeholder="e.g. 5"
                        value={formReps} onChange={e => setFormReps(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60 placeholder-slate-600" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Distance (km)</label>
                        <input type="number" step="0.1" min="0" placeholder="e.g. 5"
                          value={formDistance} onChange={e => setFormDistance(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/60 placeholder-slate-600" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Time (mm:ss)</label>
                        <input type="text" placeholder="e.g. 25:48"
                          value={formTime} onChange={e => setFormTime(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/60 placeholder-slate-600" />
                      </div>
                    </div>
                    <button onClick={handleAutoFill}
                      className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                      <Zap size={11} />
                      Auto-fill from last cardio session
                      {lastVitals?.avg_cardio_mins != null && (
                        <span className="text-slate-500">({lastVitals.avg_cardio_mins} min avg)</span>
                      )}
                    </button>
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Notes (optional)</label>
                  <input type="text" placeholder="e.g. New PB – felt explosive!"
                    value={formNotes} onChange={e => setFormNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 placeholder-slate-600" />
                </div>

                <button onClick={handleSave}
                  disabled={saving || (formType === 'analog' ? (!formWeight && !formReps) : !formTime)}
                  className="w-full py-2.5 bg-primary/20 border border-primary/30 text-primary-light rounded-xl text-sm font-semibold hover:bg-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {saving ? 'Saving…' : 'Save Record'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
