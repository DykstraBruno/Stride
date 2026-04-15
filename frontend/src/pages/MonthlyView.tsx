import { useState } from 'react'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { TaskCard } from '../components/TaskCard'
import { TaskForm } from '../components/TaskForm'
import { ChecklistProgress } from '../components/ChecklistProgress'
import { Task, TaskPriority } from '../types/task'
import {
  startOfMonth, endOfMonth, eachWeekOfInterval,
  startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay,
  addMonths, subMonths, getDate,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

const PRIORITY_DOT: Record<TaskPriority, string> = {
  urgent: '#ef4444',
  high:   '#f97316',
  medium: '#5865f2',
  low:    '#80848e',
}

export function MonthlyView() {
  const [monthStart, setMonthStart]   = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showForm, setShowForm]       = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()

  const { data: tasks = [], isLoading } = useTasks('monthly', monthStart)

  const monthEnd = endOfMonth(monthStart)
  const weeks    = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 0 })

  const getTasksForDay   = (day: Date) => tasks.filter((t) => isSameDay(new Date(t.dueDate), day))
  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : []

  const openEdit = (t: Task) => { setEditingTask(t); setShowForm(true) }

  return (
    <div className="space-y-5 max-w-[928px]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight capitalize"
              style={{ color: 'var(--c-text)' }}>
            {format(monthStart, 'MMMM yyyy', { locale: ptBR })}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--c-muted)' }}>
            {tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} no mês
          </p>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg p-1"
             style={{ backgroundColor: 'var(--c-hover)', border: '1px solid var(--c-border)' }}>
          <button onClick={() => setMonthStart((m) => subMonths(m, 1))} className="btn-icon w-7 h-7">
            <ChevronLeft size={15} />
          </button>
          <button onClick={() => setMonthStart(startOfMonth(new Date()))}
            className="px-2.5 py-1 text-xs font-medium transition-colors"
            style={{ color: 'var(--c-muted)' }}>
            Este mês
          </button>
          <button onClick={() => setMonthStart((m) => addMonths(m, 1))} className="btn-icon w-7 h-7">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {tasks.length > 0 && <ChecklistProgress tasks={tasks} />}

      {/* ── Calendar grid ── */}
      <div className="rounded-lg overflow-hidden"
           style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
        {/* Day headers */}
        <div className="grid grid-cols-7"
             style={{ backgroundColor: 'var(--c-hover)', borderBottom: '1px solid var(--c-border)' }}>
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div key={d} className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide"
                 style={{ color: 'var(--c-muted)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((ws) => {
          const days = eachDayOfInterval({
            start: startOfWeek(ws, { weekStartsOn: 0 }),
            end:   endOfWeek(ws,   { weekStartsOn: 0 }),
          })
          return (
            <div key={ws.toISOString()} className="grid grid-cols-7"
                 style={{ borderBottom: '1px solid var(--c-border)' }}>
              {days.map((day) => {
                const dayTasks   = getTasksForDay(day)
                const inMonth    = isSameMonth(day, monthStart)
                const isNow      = isSameDay(day, new Date())
                const isSelected = selectedDay && isSameDay(day, selectedDay)
                const dots       = dayTasks.slice(0, 3)

                return (
                  <button key={day.toISOString()}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className="min-h-[52px] p-1.5 flex flex-col items-center gap-1
                               transition-colors duration-100"
                    style={{
                      opacity: !inMonth ? 0.25 : 1,
                      backgroundColor: isSelected ? 'rgba(88,101,242,0.12)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--c-hover)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <span className="text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full"
                          style={{
                            backgroundColor: isNow ? '#5865f2' : 'transparent',
                            color: isNow ? '#ffffff' : 'var(--c-soft)',
                          }}>
                      {getDate(day)}
                    </span>
                    {dots.length > 0 && (
                      <div className="flex gap-0.5 justify-center">
                        {dots.map((t, i) => (
                          <div key={i} className="w-1 h-1 rounded-full"
                               style={{
                                 backgroundColor: PRIORITY_DOT[t.priority],
                                 opacity: t.status === 'completed' ? 0.3 : 1,
                               }} />
                        ))}
                        {dayTasks.length > 3 && (
                          <span className="text-[8px] leading-none" style={{ color: 'var(--c-muted)' }}>
                            +{dayTasks.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* ── Selected day tasks ── */}
      {selectedDay && (
        <section className="space-y-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            <h2 className="section-title capitalize">
              {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
              <span className="ml-2 normal-case font-normal tracking-normal"
                    style={{ color: 'var(--c-border)' }}>
                ({selectedDayTasks.length} tarefa{selectedDayTasks.length !== 1 ? 's' : ''})
              </span>
            </h2>
          </div>
          {selectedDayTasks.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--c-muted)' }}>
              Nenhuma tarefa neste dia.
            </p>
          ) : (
            selectedDayTasks.map((t) => <TaskCard key={t.id} task={t} onEdit={openEdit} />)
          )}
        </section>
      )}

      {/* ── All month tasks ── */}
      {!selectedDay && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--c-border)' }} />
            <h2 className="section-title">Todas do mês</h2>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg skeleton" />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center gap-3">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                   style={{ backgroundColor: 'var(--c-hover)', border: '1px solid var(--c-border)' }}>
                🗓️
              </div>
              <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
                Nenhuma tarefa este mês
              </p>
            </div>
          ) : (
            <>
              {tasks.slice(0, 10).map((t) => <TaskCard key={t.id} task={t} onEdit={openEdit} />)}
              {tasks.length > 10 && (
                <p className="text-xs text-center" style={{ color: 'var(--c-muted)' }}>
                  +{tasks.length - 10} tarefas — clique em um dia para filtrar
                </p>
              )}
            </>
          )}
        </section>
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
        <TaskForm task={editingTask} defaultPeriod="monthly"
          onClose={() => { setShowForm(false); setEditingTask(undefined) }} />
      )}
    </div>
  )
}
