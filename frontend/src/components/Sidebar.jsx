import { useNavigate, useLocation, NavLink } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import {
  LayoutDashboard, Calendar, Activity, Dumbbell, CreditCard,
  Settings, LogOut, Zap, Wrench, Users, ClipboardList,
  Sparkles, Heart
} from 'lucide-react'

function Avatar({ user, size = 'md' }) {
  const sz = size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'
  return (
    <div
      className={`${sz} rounded-xl flex items-center justify-center font-bold flex-shrink-0`}
      style={{ backgroundColor: user.avatar_color + '33', color: user.avatar_color, border: `1px solid ${user.avatar_color}40` }}
    >
      {user.initials || user.name?.split(' ').map(n => n[0]).join('')}
    </div>
  )
}

const NAV = {
  member: [
    { icon: LayoutDashboard, label: 'My Dashboard',    path: '/dashboard',          exact: true  },
    { icon: Calendar,        label: 'Classes',          path: '/dashboard/classes',  exact: false },
    { icon: Activity,        label: 'Vitals & Cardio',  path: '/dashboard/vitals',   exact: false },
    { icon: Dumbbell,        label: 'Personal Records', path: '/dashboard/records',  exact: false },
  ],
  trainer: [
    { icon: LayoutDashboard, label: 'Trainer Hub',      path: '/dashboard', exact: true },
    { icon: Users,           label: 'My Classes',        path: '/dashboard', exact: true },
    { icon: ClipboardList,   label: 'Attendance',        path: '/dashboard', exact: true },
    { icon: Sparkles,        label: 'AI Insights',       path: '/dashboard', exact: true },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Admin Overview',   path: '/dashboard', exact: true },
    { icon: Wrench,          label: 'Equipment',         path: '/dashboard', exact: true },
    { icon: CreditCard,      label: 'Payments',          path: '/dashboard', exact: true },
    { icon: Users,           label: 'Members',           path: '/dashboard', exact: true },
    { icon: Sparkles,        label: 'AI Alerts',         path: '/dashboard', exact: true },
  ],
  wellness: [
    { icon: Heart,           label: 'Wellness',          path: '/dashboard', exact: true },
    { icon: Calendar,        label: 'My Bookings',       path: '/dashboard', exact: true },
    { icon: Sparkles,        label: 'Services',          path: '/dashboard', exact: true },
  ],
}

export default function Sidebar() {
  const { user, setUser } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) return null

  const navKey = user.role === 'member' && user.id === 'mem_002' ? 'wellness' : user.role
  const navItems = NAV[navKey] || NAV.member

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="w-64 flex flex-col border-r border-surface-border bg-surface flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-surface-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-primary-light" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">FitZone Elite</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">AI Platform</div>
          </div>
        </div>
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b border-surface-border">
        <div className="flex items-center gap-3 p-3 bg-surface-hover rounded-xl">
          <Avatar user={user} />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user.name}</div>
            <div className="text-xs text-slate-500 truncate">{user.sub}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ icon: Icon, label, path, exact }) => {
          const active = isActive(path, exact)
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-primary/20 text-white border border-primary/20'
                  : 'text-slate-400 hover:text-white hover:bg-surface-hover border border-transparent'
              }`}
            >
              <Icon size={16} className={`flex-shrink-0 ${active ? 'text-primary-light' : ''}`} />
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-light"></span>}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-surface-border space-y-0.5">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-300 hover:bg-surface-hover transition-all duration-150">
          <Settings size={15} />
          Settings
        </button>
        <button
          onClick={() => { setUser(null); navigate('/') }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150"
        >
          <LogOut size={15} />
          Switch User
        </button>
      </div>
    </aside>
  )
}
