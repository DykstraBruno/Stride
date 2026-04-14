import { useState } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Calendar, CalendarDays, LayoutGrid, Bot, Zap } from 'lucide-react'
import { DailyView } from './pages/DailyView'
import { WeeklyView } from './pages/WeeklyView'
import { MonthlyView } from './pages/MonthlyView'
import { AIAssistant } from './components/AIAssistant'

export default function App() {
  const [showAI, setShowAI] = useState(false)
  const location = useLocation()

  const navItems = [
    { to: '/', label: 'Hoje', icon: Calendar, exact: true },
    { to: '/weekly', label: 'Semana', icon: CalendarDays, exact: false },
    { to: '/monthly', label: 'Mês', icon: LayoutGrid, exact: false },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-stride-500 to-stride-700 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Stride</span>
          </div>

          <button
            onClick={() => setShowAI(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-stride-600
                       hover:bg-stride-50 px-3 py-1.5 rounded-full transition-colors"
          >
            <Bot size={16} />
            <span>IA</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="max-w-2xl mx-auto px-4 flex gap-1 pb-0">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-stride-600 text-stride-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <Routes>
          <Route path="/" element={<DailyView />} />
          <Route path="/weekly" element={<WeeklyView />} />
          <Route path="/monthly" element={<MonthlyView />} />
        </Routes>
      </main>

      {/* AI Assistant modal */}
      {showAI && <AIAssistant onClose={() => setShowAI(false)} />}
    </div>
  )
}
