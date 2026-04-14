import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { TaskCard } from '../components/TaskCard'
import { TaskForm } from '../components/TaskForm'
import { ChecklistProgress } from '../components/ChecklistProgress'
import { Task, CATEGORY_LABEL, TaskCategory } from '../types/task'
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  addWeeks,
  subWeeks,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function WeeklyView() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }))
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [groupBy, setGroupBy] = useState<'day' | 'category'>('day')

  const { data: tasks = [], isLoading } = useTasks('weekly', weekStart)

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const weekLabel = `${format(weekStart, "d 'de' MMM", { locale: ptBR })} – ${format(weekEnd, "d 'de' MMM", { locale: ptBR })}`

  const getTasksForDay = (day: Date) =>
    tasks.filter((t) => isSameDay(new Date(t.dueDate), day))

  const getTasksByCategory = () => {
    const grouped: Record<string, Task[]> = {}
    tasks.forEach((t) => {
      const key = t.category
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(t)
    })
    return grouped
  }

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Semana</h1>
          <p className="text-xs text-gray-400">{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart((w) => subWeeks(w, 1))}
            className="btn-ghost px-2 py-1 text-sm"
          >
            ‹
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
            className="btn-ghost px-3 py-1 text-xs"
          >
            Esta semana
          </button>
          <button
            onClick={() => setWeekStart((w) => addWeeks(w, 1))}
            className="btn-ghost px-2 py-1 text-sm"
          >
            ›
          </button>
        </div>
      </div>

      {/* Progress */}
      {tasks.length > 0 && <ChecklistProgress tasks={tasks} />}

      {/* Group toggle */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setGroupBy('day')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            groupBy === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          Por dia
        </button>
        <button
          onClick={() => setGroupBy('category')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            groupBy === 'category' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          Por categoria
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse h-20 bg-gray-50" />
          ))}
        </div>
      ) : groupBy === 'day' ? (
        <div className="space-y-4">
          {days.map((day) => {
            const dayTasks = getTasksForDay(day)
            const isCurrentDay = isSameDay(day, new Date())
            return (
              <section key={day.toISOString()}>
                <h2
                  className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                    isCurrentDay ? 'text-stride-600' : 'text-gray-500'
                  }`}
                >
                  {format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  {isCurrentDay && (
                    <span className="ml-2 badge bg-stride-100 text-stride-700 normal-case tracking-normal">
                      hoje
                    </span>
                  )}
                  <span className="ml-2 text-gray-300 font-normal normal-case tracking-normal">
                    {dayTasks.length} tarefa{dayTasks.length !== 1 ? 's' : ''}
                  </span>
                </h2>
                {dayTasks.length === 0 ? (
                  <p className="text-xs text-gray-300 pl-1">Sem tarefas</p>
                ) : (
                  <div className="space-y-2">
                    {dayTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={(t) => {
                          setEditingTask(t)
                          setShowForm(true)
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(getTasksByCategory()).map(([category, catTasks]) => (
            <section key={category}>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {CATEGORY_LABEL[category as TaskCategory] ?? category} ({catTasks.length})
              </h2>
              <div className="space-y-2">
                {catTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={(t) => {
                      setEditingTask(t)
                      setShowForm(true)
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-sm">Nenhuma tarefa esta semana.</p>
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => {
          setEditingTask(undefined)
          setShowForm(true)
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-stride-600 text-white rounded-full shadow-lg
                   flex items-center justify-center hover:bg-stride-700 active:bg-stride-800
                   transition-colors focus:outline-none focus:ring-4 focus:ring-stride-300"
      >
        <Plus size={24} />
      </button>

      {showForm && (
        <TaskForm
          task={editingTask}
          defaultPeriod="weekly"
          onClose={() => {
            setShowForm(false)
            setEditingTask(undefined)
          }}
        />
      )}
    </div>
  )
}
