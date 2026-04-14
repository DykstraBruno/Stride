import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { TaskCard } from '../components/TaskCard'
import { TaskForm } from '../components/TaskForm'
import { ChecklistProgress } from '../components/ChecklistProgress'
import { Task, TaskPriority, PRIORITY_COLOR } from '../types/task'
import {
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDate,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function MonthlyView() {
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()

  const { data: tasks = [], isLoading } = useTasks('monthly', monthStart)

  const monthEnd = endOfMonth(monthStart)
  const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 0 })

  const getTasksForDay = (day: Date) =>
    tasks.filter((t) => isSameDay(new Date(t.dueDate), day))

  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : []

  const priorityDot: Record<TaskPriority, string> = {
    low: 'bg-gray-300',
    medium: 'bg-blue-400',
    high: 'bg-orange-400',
    urgent: 'bg-red-500',
  }

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 capitalize">
            {format(monthStart, 'MMMM yyyy', { locale: ptBR })}
          </h1>
          <p className="text-xs text-gray-400">{tasks.length} tarefas no mês</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthStart((m) => subMonths(m, 1))}
            className="btn-ghost px-2 py-1 text-sm"
          >
            ‹
          </button>
          <button
            onClick={() => setMonthStart(startOfMonth(new Date()))}
            className="btn-ghost px-3 py-1 text-xs"
          >
            Mês atual
          </button>
          <button
            onClick={() => setMonthStart((m) => addMonths(m, 1))}
            className="btn-ghost px-2 py-1 text-sm"
          >
            ›
          </button>
        </div>
      </div>

      {/* Progress */}
      {tasks.length > 0 && <ChecklistProgress tasks={tasks} />}

      {/* Calendar grid */}
      <div className="card overflow-hidden p-0">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-gray-400">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((weekStart) => {
          const days = eachDayOfInterval({
            start: startOfWeek(weekStart, { weekStartsOn: 0 }),
            end: endOfWeek(weekStart, { weekStartsOn: 0 }),
          })

          return (
            <div key={weekStart.toISOString()} className="grid grid-cols-7 border-b border-gray-50">
              {days.map((day) => {
                const dayTasks = getTasksForDay(day)
                const isCurrentMonth = isSameMonth(day, monthStart)
                const isToday = isSameDay(day, new Date())
                const isSelected = selectedDay && isSameDay(day, selectedDay)
                const maxDots = Math.min(3, dayTasks.length)
                const highestPriority = dayTasks.reduce<TaskPriority | null>((acc, t) => {
                  const order: TaskPriority[] = ['urgent', 'high', 'medium', 'low']
                  if (!acc) return t.priority
                  return order.indexOf(t.priority) < order.indexOf(acc) ? t.priority : acc
                }, null)

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`min-h-[52px] p-1 flex flex-col items-center gap-0.5 transition-colors
                      ${!isCurrentMonth ? 'opacity-30' : ''}
                      ${isSelected ? 'bg-stride-50' : 'hover:bg-gray-50'}
                    `}
                  >
                    <span
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                        ${isToday ? 'bg-stride-600 text-white' : isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}
                      `}
                    >
                      {getDate(day)}
                    </span>

                    {dayTasks.length > 0 && (
                      <div className="flex gap-0.5 justify-center">
                        {Array.from({ length: maxDots }).map((_, i) => {
                          const t = dayTasks[i]
                          return (
                            <div
                              key={i}
                              className={`w-1 h-1 rounded-full ${t ? priorityDot[t.priority] : 'bg-gray-200'} ${t?.status === 'completed' ? 'opacity-40' : ''}`}
                            />
                          )
                        })}
                        {dayTasks.length > 3 && (
                          <span className="text-[8px] text-gray-400 leading-none">+{dayTasks.length - 3}</span>
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

      {/* Selected day tasks */}
      {selectedDay && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
            <span className="ml-2 text-xs font-normal text-gray-400">
              ({selectedDayTasks.length} tarefa{selectedDayTasks.length !== 1 ? 's' : ''})
            </span>
          </h2>
          {selectedDayTasks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Nenhuma tarefa neste dia.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDayTasks.map((task) => (
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
      )}

      {/* All monthly tasks when no day selected */}
      {!selectedDay && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Todas as tarefas do mês
          </h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse h-16 bg-gray-50" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">🗓️</p>
              <p className="text-sm">Nenhuma tarefa este mês.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 10).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={(t) => {
                    setEditingTask(t)
                    setShowForm(true)
                  }}
                />
              ))}
              {tasks.length > 10 && (
                <p className="text-xs text-center text-gray-400">
                  +{tasks.length - 10} tarefas. Clique em um dia para ver.
                </p>
              )}
            </div>
          )}
        </section>
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
          defaultPeriod="monthly"
          onClose={() => {
            setShowForm(false)
            setEditingTask(undefined)
          }}
        />
      )}
    </div>
  )
}
