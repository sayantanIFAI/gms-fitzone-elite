export default function StatCard({ label, value, sub, icon, color = '#7c3aed', trend }) {
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-500'
  return (
    <div className="card flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: color + '22', border: `1px solid ${color}44` }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">{label}</div>
        <div className="text-2xl font-bold text-white leading-none">{value}</div>
        {sub && <div className={`text-xs mt-0.5 ${trendColor}`}>{sub}</div>}
      </div>
    </div>
  )
}
