import { useState } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { Calendar, CalendarDays, LayoutGrid, Zap, Sparkles, Sun, Moon } from 'lucide-react'
import { DailyView }   from './pages/DailyView'
import { WeeklyView }  from './pages/WeeklyView'
import { MonthlyView } from './pages/MonthlyView'
import { AIAssistant } from './components/AIAssistant'
import { useTheme }    from './hooks/useTheme'

const navItems = [
  { to: '/',        label: 'Hoje',   icon: Calendar,     exact: true  },
  { to: '/weekly',  label: 'Semana', icon: CalendarDays, exact: false },
  { to: '/monthly', label: 'Mês',    icon: LayoutGrid,   exact: false },
]

export default function App() {
  const [showAI, setShowAI] = useState(false)
  const { isDark, toggle }  = useTheme()

  return (
    <div className="flex h-full">

      {/* ── Sidebar — desktop ── */}
      <aside
        className="hidden md:flex w-[284px] flex-shrink-0 flex-col h-full"
        style={{ backgroundColor: 'var(--c-sidebar)', borderRight: '1px solid var(--c-border)' }}
      >
        {/* Logo */}
        <div className="px-4 py-4 flex items-center gap-2.5"
             style={{ borderBottom: '1px solid var(--c-border)' }}>
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
            <Zap size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm" style={{ color: 'var(--c-text)' }}>Stride</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest"
             style={{ color: 'var(--c-muted)' }}>
            Visualizações
          </p>
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink key={to} to={to} end={exact}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Icon size={16} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 space-y-1.5"
             style={{ borderTop: '1px solid var(--c-border)' }}>
          <button onClick={() => setShowAI(true)}
            className="btn-primary w-full text-xs py-2">
            <Sparkles size={13} />
            Stride AI
          </button>
          <button onClick={toggle}
            className="btn-ghost w-full justify-start text-xs">
            {isDark
              ? <Sun  size={14} className="text-amber-400" />
              : <Moon size={14} />}
            {isDark ? 'Modo claro' : 'Modo escuro'}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">

        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 h-12 flex-shrink-0"
                style={{ backgroundColor: 'var(--c-sidebar)', borderBottom: '1px solid var(--c-border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
              <Zap size={13} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--c-text)' }}>Stride</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggle} className="btn-icon">
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <button onClick={() => setShowAI(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                         bg-primary-500 hover:bg-primary-600 text-white transition-colors">
              <Sparkles size={13} />
              IA
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto py-6 pr-6 pl-[120px]">
          <Routes>
            <Route path="/"        element={<DailyView  />} />
            <Route path="/weekly"  element={<WeeklyView />} />
            <Route path="/monthly" element={<MonthlyView />} />
          </Routes>
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex flex-shrink-0"
             style={{ backgroundColor: 'var(--c-sidebar)', borderTop: '1px solid var(--c-border)' }}>
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink key={to} to={to} end={exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium
                 transition-colors ${
                  isActive
                    ? 'text-primary-500'
                    : 'text-[color:var(--c-muted)] hover:text-[color:var(--c-soft)]'
                }`
              }>
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {showAI && <AIAssistant onClose={() => setShowAI(false)} />}
    </div>
  )
}
