import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import StatCard from '../components/StatCard'
import { Bot, Wrench, CreditCard, AlertTriangle, CheckCircle, Lock, Unlock, RefreshCw } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const D = 'http://localhost:3001/api'
const A = 'http://localhost:3002/api'

const statusConfig = {
  operational: { label: 'Operational', cls: 'badge-green',  dot: '#10b981' },
  fault:       { label: 'FAULT',       cls: 'badge-red',    dot: '#ef4444' },
  maintenance: { label: 'Maintenance', cls: 'badge-amber',  dot: '#f59e0b' },
}

const failureCodes = {
  ADDACS: { label: 'ADDACS', desc: 'Account details changed / cancelled',   color: '#f59e0b' },
  ARUCS:  { label: 'ARUCS',  desc: 'Insufficient funds',                     color: '#ef4444' },
  MS03:   { label: 'MS03',   desc: 'Insufficient funds (SEPA)',               color: '#ef4444' },
}

export default function AdminDashboard() {
  const { user } = useUser()
  const [machines, setMachines] = useState([])
  const [machineStats, setMachineStats] = useState(null)
  const [defaulters, setDefaulters] = useState([])
  const [memberStats, setMemberStats] = useState(null)
  const [paymentStats, setPaymentStats] = useState(null)
  const [aiInsights, setAiInsights] = useState(null)
  const [machineAI, setMachineAI] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingMachine, setUpdatingMachine] = useState(null)

  async function loadAll() {
    setLoading(true)
    const [mRes, msRes, dRes, memRes, psRes] = await Promise.all([
      fetch(`${D}/machines`).then(r => r.json()),
      fetch(`${D}/machines/stats`).then(r => r.json()),
      fetch(`${D}/payments/defaulters`).then(r => r.json()),
      fetch(`${D}/members/stats`).then(r => r.json()),
      fetch(`${D}/payments/stats`).then(r => r.json()),
    ])
    setMachines(mRes)
    setMachineStats(msRes)
    setDefaulters(dRes)
    setMemberStats(memRes)
    setPaymentStats(psRes)
    setLoading(false)

    // AI (non-blocking)
    Promise.all([
      fetch(`${A}/insights/gym`).then(r => r.json()),
      fetch(`${A}/machine-health`).then(r => r.json()),
    ]).then(([ins, mh]) => {
      setAiInsights(ins)
      setMachineAI(mh)
    }).catch(() => {})
  }

  useEffect(() => { loadAll() }, [])

  async function toggleLock(member) {
    const newLocked = member.access_locked ? 0 : 1
    await fetch(`${D}/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: member.payment_status, access_locked: newLocked }),
    })
    loadAll()
  }

  async function clearFault(machineId) {
    setUpdatingMachine(machineId)
    await fetch(`${D}/machines/${machineId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'maintenance', fault_code: null, fault_description: 'Cleared by admin — awaiting engineer sign-off' }),
    })
    const mRes = await fetch(`${D}/machines`).then(r => r.json())
    setMachines(mRes)
    setUpdatingMachine(null)
  }

  const zoneOrder = ['Cardio Floor', 'Free Weights', 'Resistance Zone']
  const machinesByZone = zoneOrder.reduce((acc, z) => {
    acc[z] = machines.filter(m => m.zone === z)
    return acc
  }, {})

  const criticalAlerts = machineAI?.alerts?.filter(a => a.severity === 'critical') || []
  const warningAlerts  = machineAI?.alerts?.filter(a => a.severity === 'warning')  || []

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-slate-500 text-sm animate-pulse">Loading admin dashboard…</div>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Admin Console <span style={{ color: user.avatar_color }}>⚡</span>
          </h1>
          <p className="text-slate-500 mt-1">FitZone Elite — Operations & Management Dashboard</p>
        </div>
        <button onClick={loadAll} className="btn-secondary flex items-center gap-2 text-xs">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Members" value={memberStats?.active ?? '—'} icon="👥" color="#10b981"
          sub={`${memberStats?.total ?? '—'} total`} />
        <StatCard label="Machine Uptime" value={machineStats ? `${machineStats.uptime}%` : '—'} icon="⚙️"
          color={machineStats?.uptime >= 85 ? '#10b981' : '#ef4444'}
          sub={`${machineStats?.operational}/${machineStats?.total} operational`} />
        <StatCard label="DD Success Rate" value={paymentStats ? `${paymentStats.successRate}%` : '—'} icon="💳"
          color={paymentStats?.successRate >= 95 ? '#10b981' : '#f59e0b'}
          sub={`${paymentStats?.failedCount ?? 0} failed this month`} />
        <StatCard label="Monthly Revenue" value={paymentStats ? `£${paymentStats.totalRevenue.toFixed(0)}` : '—'} icon="£" color="#7c3aed" />
      </div>

      {/* AI Overview */}
      {(aiInsights?.aiInsight || aiInsights?.flags?.length > 0) && (
        <div className="card border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-transparent">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bot size={18} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-1.5 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AI Business Intelligence
              </div>
              {aiInsights.aiInsight && (
                <p className="text-sm text-slate-300 leading-relaxed">{aiInsights.aiInsight}</p>
              )}
            </div>
          </div>
          {aiInsights.flags?.length > 0 && (
            <div className="space-y-2">
              {aiInsights.flags.map((flag, i) => (
                <div key={i} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${
                  flag.severity === 'critical' ? 'bg-red-500/10 text-red-300' :
                  flag.severity === 'warning'  ? 'bg-amber-500/10 text-amber-300' :
                  'bg-cyan-500/10 text-cyan-300'
                }`}>
                  {flag.severity === 'critical' ? '🚨' : flag.severity === 'warning' ? '⚠️' : 'ℹ️'}
                  {flag.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Machines & Defaulters */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Machine Health */}
        <div className="lg:col-span-3 space-y-4">
          <div className="section-title flex items-center gap-2"><Wrench size={13} /> Equipment Health</div>

          {/* AI Machine insight */}
          {machineAI?.aiInsight && (
            <div className="p-3 rounded-xl bg-surface-card border border-surface-border text-xs text-slate-400 italic">
              🤖 {machineAI.aiInsight}
            </div>
          )}

          {zoneOrder.map(zone => (
            machinesByZone[zone]?.length > 0 && (
              <div key={zone}>
                <div className="text-xs text-slate-600 font-semibold uppercase tracking-wider mb-2">{zone}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {machinesByZone[zone].map(m => {
                    const cfg = statusConfig[m.status] || statusConfig.operational
                    return (
                      <div key={m.id} className={`card ${m.status === 'fault' ? 'border-red-500/30' : m.status === 'maintenance' ? 'border-amber-500/20' : ''}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-sm font-semibold text-white">{m.name}</div>
                            <div className="text-xs text-slate-500">{m.manufacturer} · {m.model_number}</div>
                          </div>
                          <span className={cfg.cls}>{cfg.label}</span>
                        </div>

                        {m.fault_description && (
                          <div className="text-xs text-red-300 bg-red-500/10 rounded-lg px-2.5 py-1.5 mb-2 flex items-start gap-1.5">
                            <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
                            {m.fault_description}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{m.total_usage_hours.toLocaleString()} hrs total</span>
                          <span>Last service: {m.last_maintenance}</span>
                        </div>

                        {m.status === 'fault' && (
                          <button
                            onClick={() => clearFault(m.id)}
                            disabled={updatingMachine === m.id}
                            className="mt-2 w-full text-xs py-1.5 rounded-lg bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-colors font-medium"
                          >
                            {updatingMachine === m.id ? 'Updating…' : 'Mark as Under Maintenance'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          ))}
        </div>

        {/* Direct Debit Defaulters */}
        <div className="lg:col-span-2">
          <div className="section-title flex items-center gap-2"><CreditCard size={13} /> Direct Debit Defaulters</div>

          {defaulters.length > 0 ? (
            <div className="space-y-3">
              {defaulters.map(m => {
                const codes = (m.failure_codes || '').split(',').filter(Boolean)
                return (
                  <div key={m.id} className={`card border-red-500/20 ${m.access_locked ? 'bg-red-500/5' : ''}`}>
                    {/* Member info */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                           style={{ backgroundColor: m.avatar_color + '33', color: m.avatar_color }}>
                        {m.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{m.name}</div>
                        <div className="text-xs text-slate-500 truncate">{m.email}</div>
                      </div>
                      {m.access_locked ? (
                        <span className="badge-red flex items-center gap-1"><Lock size={10} /> Locked</span>
                      ) : (
                        <span className="badge-amber">Active</span>
                      )}
                    </div>

                    {/* Failure details */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Failed payments</span>
                        <span className="font-semibold text-red-400">{m.failed_count}× failure{m.failed_count > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Amount owed</span>
                        <span className="font-bold text-white">£{(m.total_owed || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Mandate ref</span>
                        <span className="text-slate-400 font-mono">{m.mandate_ref || '—'}</span>
                      </div>
                      {codes.map(code => {
                        const cfg = failureCodes[code] || { label: code, desc: 'Unknown error', color: '#ef4444' }
                        return (
                          <div key={code} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
                               style={{ backgroundColor: cfg.color + '18', color: cfg.color }}>
                            <span className="font-mono font-bold">{cfg.label}</span>
                            <span className="opacity-80">— {cfg.desc}</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleLock(m)}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                          m.access_locked
                            ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                            : 'bg-red-500/15 text-red-300 hover:bg-red-500/25'
                        }`}
                      >
                        {m.access_locked ? <><Unlock size={11} /> Restore Access</> : <><Lock size={11} /> Lock Access</>}
                      </button>
                      <button className="flex-1 text-xs py-1.5 rounded-lg bg-surface-border text-slate-400 hover:bg-surface-hover font-medium transition-colors">
                        Send BACS Retry
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card text-center py-8">
              <CheckCircle size={24} className="text-emerald-400 mx-auto mb-2" />
              <div className="text-sm text-slate-400">No payment defaulters</div>
              <div className="text-xs text-slate-600 mt-1">All Direct Debits collected successfully</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
