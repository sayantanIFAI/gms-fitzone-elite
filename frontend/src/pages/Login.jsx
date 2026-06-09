import { useNavigate } from 'react-router-dom'
import { useUser, PERSONAS } from '../context/UserContext'
import { Zap, ChevronRight } from 'lucide-react'

export default function Login() {
  const { setUser } = useUser()
  const navigate = useNavigate()

  function handleSelect(persona) {
    setUser(persona)
    navigate('/dashboard')
  }

  const roleColors = {
    member: '#7c3aed',
    trainer: '#f59e0b',
    admin: '#10b981',
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] flex flex-col items-center justify-center px-4">
      {/* Glow bg */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-4xl animate-in">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
            <Zap size={13} className="text-primary-light" />
            <span className="text-xs font-semibold text-primary-light tracking-wide">AI-POWERED GYM MANAGEMENT</span>
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-3 tracking-tight">
            FitZone <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-cyan-400">Elite</span>
          </h1>
          <p className="text-slate-400 text-lg">Next-Generation Omnichannel Gym Platform · UK & EU</p>
          <p className="text-slate-600 text-sm mt-2">Select a persona to explore the platform</p>
        </div>

        {/* Persona cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PERSONAS.map((persona) => {
            const color = roleColors[persona.role] || '#7c3aed'
            return (
              <button
                key={persona.id}
                onClick={() => handleSelect(persona)}
                className="group relative text-left p-5 bg-surface-card border border-surface-border rounded-2xl hover:border-primary/40 transition-all duration-200 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 active:scale-98"
              >
                {/* Role badge */}
                <div
                  className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: color + '22', color }}
                >
                  {persona.role}
                </div>

                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4"
                  style={{ backgroundColor: color + '20', border: `1px solid ${color}40` }}
                >
                  {persona.emoji}
                </div>

                {/* Info */}
                <div className="font-bold text-white text-base mb-0.5">{persona.name}</div>
                <div className="text-xs font-medium mb-3" style={{ color }}>{persona.sub}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{persona.description}</div>

                {/* CTA */}
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
                  Continue
                  <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-700 text-xs mt-8">
          Demo platform · No authentication required · EU & UK GDPR compliant architecture
        </p>
      </div>
    </div>
  )
}
