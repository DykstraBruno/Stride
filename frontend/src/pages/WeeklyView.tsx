import { useState } from 'react'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { TaskCard } from '../components/TaskCard'
import { TaskForm } from '../components/TaskForm'
import { ChecklistProgress } from '../components/ChecklistProgress'
import { Task, CATEGORY_LABEL, TaskCategory } from '../types/task'
import {
  startOfWeek, endOfWeek, eachDayOfInterval, format,
  isSameDay, addWeeks, subWeeks, isToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function WeeklyView() {
  const [weekStart, setWeekStart]     = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }))
  const [showForm, setShowForm]       = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [groupBy, setGroupBy]         = useState<'day' | 'category'>('day')

  const { data: tasks = [], isLoading } = useTasks('weekly', weekStart)

  const weekEnd   = endOfWeek(weekStart, { weekStartsOn: 0 })
  const days      = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const weekLabel = `${format(weekStart, "d 'de' MMM", { locale: ptBR })} – ${format(weekEnd, "d 'de' MMM", { locale: ptBR })}`

  const getTasksForDay = (day: Date) =>
    tasks.filter((t) => isSameDay(new Date(t.scheduledAt ?? t.dueDate), day))

  const grouped = tasks.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {} as Record<string, Task[]>)

  const openEdit = (t: Task) => { setEditingTask(t); setShowForm(true) }

  return (
    <div className="space-y-5 max-w-[928px]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--c-text)' }}>
            Semana
          </h1>
          <p className="text-sm mt-0.5 capitalize" style={{ color: 'var(--c-muted)' }}>
            {weekLabel}
          </p>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg p-1"
             style={{ backgroundColor: 'var(--c-hover)', border: '1px solid var(--c-border)' }}>
          <button onClick={() => setWeekStart((w) => subWeeks(w, 1))} className="btn-icon w-7 h-7">
            <ChevronLeft size={15} />
          </button>
          <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
            className="px-2.5 py-1 text-xs font-medium transition-colors"
            style={{ color: 'var(--c-muted)' }}>
            Esta semana
          </button>
          <button onClick={() => setWeekStart((w) => addWeeks(w, 1))} className="btn-icon w-7 h-7">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {tasks.length > 0 && <ChecklistProgress tasks={tasks} />}

      {/* ── Group toggle ── */}
      <div className="flex gap-1 p-1 rounded-lg w-fit"
           style={{ backgroundColor: 'var(--c-hover)', border: '1px solid var(--c-border)' }}>
        {(['day', 'category'] as const).map((g) => (
          <button key={g} onClick={() => setGroupBy(g)}
            className="px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors"
            style={{
              backgroundColor: groupBy === g ? 'var(--c-card)' : 'transparent',
              color: groupBy === g ? 'var(--c-text)' : 'var(--c-muted)',
              boxShadow: groupBy === g ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            }}>
            {g === 'day' ? 'Por dia' : 'Por categoria'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg skeleton" />)}
        </div>
      ) : groupBy === 'day' ? (
        <div className="space-y-5">
          {days.map((day) => {
            const dayTasks = getTasksForDay(day)
            const current  = isToday(day)
            return (
              <section key={day.toISOString()} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${current ? 'bg-primary-500' : ''}`}
                        style={!current ? { backgroundColor: 'var(--c-border)' } : {}} />
                  <h2 className={`section-title capitalize !text-sm ${current ? 'text-primary-500' : ''}`}>
                    {format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    {current && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px]
                                       bg-primary-500/15 text-primary-500 border border-primary-500/30
                                       normal-case tracking-normal font-medium">
                        hoje
                      </span>
                    )}
                    <span className="ml-2 normal-case font-normal tracking-normal"
                          style={{ color: 'var(--c-border)' }}>
                      {dayTasks.length} tarefa{dayTasks.length !== 1 ? 's' : ''}
                    </span>
                  </h2>
                </div>
                {dayTasks.length === 0
                  ? <p className="text-xs pl-3" style={{ color: 'var(--c-muted)' }}>Sem tarefas</p>
                  : dayTasks.map((t) => <TaskCard key={t.id} task={t} onEdit={openEdit} />)
                }
              </section>
            )
          })}
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([cat, catTasks]) => (
            <section key={cat} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: 'var(--c-border)' }} />
                <h2 className="section-title">
                  {CATEGORY_LABEL[cat as TaskCategory] ?? cat}
                  <span className="ml-2 normal-case font-normal tracking-normal"
                        style={{ color: 'var(--c-border)' }}>
                    ({catTasks.length})
                  </span>
                </h2>
              </div>
              {catTasks.map((t) => <TaskCard key={t.id} task={t} onEdit={openEdit} />)}
            </section>
          ))}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center py-16 text-center gap-3">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                   style={{ backgroundColor: 'var(--c-hover)', border: '1px solid var(--c-border)' }}>
                📅
              </div>
              <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
                Nenhuma tarefa esta semana
              </p>
            </div>
          )}
        </div>
      )}

      <button onClick={() => { setEditingTask(undefined); setShowForm(true) }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-xl
                   bg-primary-500 hover:bg-primary-600 active:scale-95
                   text-white shadow-lg shadow-primary-500/25
                   flex items-center justify-center transition-all duration-150
                   focus:outline-none focus:ring-2 focus:ring-primary-400">
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {showForm && (
        <TaskForm task={editingTask} defaultPeriod="weekly"
          onClose={() => { setShowForm(false); setEditingTask(undefined) }} />
      )}
    </div>
  )
}
