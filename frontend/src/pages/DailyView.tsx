import { useState } from 'react'
import { Plus, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { TaskCard } from '../components/TaskCard'
import { TaskForm } from '../components/TaskForm'
import { ChecklistProgress } from '../components/ChecklistProgress'
import { DayTimeline } from '../components/DayTimeline'
import { Task } from '../types/task'
import { format, isToday, isTomorrow, isYesterday, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function DailyView() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showForm, setShowForm]         = useState(false)
  const [editingTask, setEditingTask]   = useState<Task | undefined>()
  const { data: tasks = [], isLoading, refetch } = useTasks('daily', selectedDate)

  const dateLabel = isToday(selectedDate)     ? 'Hoje'
                  : isTomorrow(selectedDate)  ? 'Amanhã'
                  : isYesterday(selectedDate) ? 'Ontem'
                  : format(selectedDate, "EEEE", { locale: ptBR })

  const dateSubLabel = format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })

  const overdue = tasks.filter((t) => t.status === 'overdue')
  const active  = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')
  const done    = tasks.filter((t) => t.status === 'completed' || t.status === 'skipped')

  const openEdit = (t: Task) => { setEditingTask(t); setShowForm(true) }

  return (
    <div className="space-y-5 max-w-[928px]">

      {/* ── Date header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold capitalize tracking-tight"
              style={{ color: 'var(--c-text)' }}>
            {dateLabel}
          </h1>
          <p className="text-sm capitalize mt-0.5" style={{ color: 'var(--c-muted)' }}>
            {dateSubLabel}
          </p>
        </div>

        <div className="flex items-center gap-0.5 rounded-lg p-1"
             style={{ backgroundColor: 'var(--c-hover)', border: '1px solid var(--c-border)' }}>
          <button onClick={() => setSelectedDate((d) => subDays(d, 1))} className="btn-icon w-7 h-7">
            <ChevronLeft size={15} />
          </button>
          <button onClick={() => setSelectedDate(new Date())}
            className="px-2.5 py-1 text-xs font-medium rounded-md transition-colors"
            style={{
              backgroundColor: isToday(selectedDate) ? 'var(--c-card)' : 'transparent',
              color: isToday(selectedDate) ? 'var(--c-text)' : 'var(--c-muted)',
            }}>
            Hoje
          </button>
          <button onClick={() => setSelectedDate((d) => addDays(d, 1))} className="btn-icon w-7 h-7">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ── Progress ── */}
      {tasks.length > 0 && <ChecklistProgress tasks={tasks} />}

      {/* ── Overdue ── */}
      {overdue.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse-soft" />
            <h2 className="section-title text-rose-500">Atrasadas ({overdue.length})</h2>
          </div>
          {overdue.map((t) => <TaskCard key={t.id} task={t} onEdit={openEdit} />)}
        </section>
      )}

      {/* ── Day timeline ── */}
      <DayTimeline tasks={tasks} date={selectedDate} />

      {/* ── Active tasks ── */}
      {(tasks.length > 0 || isLoading) && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              <h2 className="section-title">
                Tarefas{active.length > 0 ? ` (${active.length})` : ''}
              </h2>
            </div>
            <button onClick={() => refetch()} className="btn-icon w-6 h-6">
              <RefreshCw size={12} />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg skeleton" />)}
            </div>
          ) : active.length > 0 ? (
            <div className="space-y-2">
              {active.map((t) => <TaskCard key={t.id} task={t} onEdit={openEdit} />)}
            </div>
          ) : null}
        </section>
      )}

      {/* ── Done ── */}
      {done.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <h2 className="section-title text-emerald-500">Concluídas ({done.length})</h2>
          </div>
          <div className="space-y-2">
            {done.map((t) => <TaskCard key={t.id} task={t} onEdit={openEdit} />)}
          </div>
        </section>
      )}

      {/* ── FAB ── */}
      <button onClick={() => { setEditingTask(undefined); setShowForm(true) }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-xl
                   bg-primary-500 hover:bg-primary-600 active:scale-95
                   text-white shadow-lg shadow-primary-500/25
                   flex items-center justify-center transition-all duration-150
                   focus:outline-none focus:ring-2 focus:ring-primary-400">
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {showForm && (
        <TaskForm task={editingTask} defaultPeriod="daily"
          onClose={() => { setShowForm(false); setEditingTask(undefined) }} />
      )}
    </div>
  )
}

