import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { TaskCard } from '../components/TaskCard'
import { TaskForm } from '../components/TaskForm'
import { ChecklistProgress } from '../components/ChecklistProgress'
import { Task } from '../types/task'
import { format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function DailyView() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const { data: tasks = [], isLoading, refetch } = useTasks('daily', selectedDate)

  const dateLabel = isToday(selectedDate)
    ? 'Hoje'
    : isTomorrow(selectedDate)
      ? 'Amanhã'
      : isYesterday(selectedDate)
        ? 'Ontem'
        : format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })

  const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')
  const doneTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'skipped')
  const overdueTasks = tasks.filter((t) => t.status === 'overdue')

  return (
    <div className="space-y-4">
      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 capitalize">{dateLabel}</h1>
          <p className="text-xs text-gray-400">
            {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setSelectedDate((d) => new Date(d.getTime() - 86400000))
            }
            className="btn-ghost px-2 py-1 text-sm"
          >
            ‹
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="btn-ghost px-3 py-1 text-xs"
          >
            Hoje
          </button>
          <button
            onClick={() =>
              setSelectedDate((d) => new Date(d.getTime() + 86400000))
            }
            className="btn-ghost px-2 py-1 text-sm"
          >
            ›
          </button>
        </div>
      </div>

      {/* Progress */}
      {tasks.length > 0 && <ChecklistProgress tasks={tasks} />}

      {/* Overdue */}
      {overdueTasks.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">
            ⚠ Atrasadas ({overdueTasks.length})
          </h2>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
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
      )}

      {/* Pending */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Tarefas ({pendingTasks.length})
          </h2>
          <button
            onClick={() => refetch()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw size={12} />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse h-16 bg-gray-50" />
            ))}
          </div>
        ) : pendingTasks.length === 0 && doneTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">Nenhuma tarefa para hoje.</p>
            <p className="text-xs mt-1">Clique em + para adicionar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map((task) => (
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

      {/* Done */}
      {doneTasks.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Concluídas / Ignoradas ({doneTasks.length})
          </h2>
          <div className="space-y-2">
            {doneTasks.map((task) => (
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
          defaultPeriod="daily"
          onClose={() => {
            setShowForm(false)
            setEditingTask(undefined)
          }}
        />
      )}
    </div>
  )
}
