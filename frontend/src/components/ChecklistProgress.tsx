import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { Task, TaskStatus } from '../types/task'

interface ChecklistProgressProps {
  tasks: Task[]
}

export function ChecklistProgress({ tasks }: ChecklistProgressProps) {
  const counts = tasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] ?? 0) + 1
      return acc
    },
    {} as Record<TaskStatus, number>,
  )

  const total = tasks.length
  const completed = counts['completed'] ?? 0
  const inProgress = counts['in_progress'] ?? 0
  const overdue = counts['overdue'] ?? 0
  const pending = counts['pending'] ?? 0
  const skipped = counts['skipped'] ?? 0

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  if (total === 0) return null

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Progresso do dia</h3>
        <span className="text-lg font-bold text-stride-600">{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-stride-500 to-stride-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <Stat icon={<CheckCircle2 size={12} className="text-green-500" />} label="Concluídas" count={completed} color="text-green-700" />
        <Stat icon={<Clock size={12} className="text-blue-500" />} label="Em andamento" count={inProgress} color="text-blue-700" />
        <Stat icon={<Circle size={12} className="text-gray-400" />} label="Pendentes" count={pending + skipped} color="text-gray-600" />
        {overdue > 0 && (
          <Stat icon={<Clock size={12} className="text-red-500" />} label="Atrasadas" count={overdue} color="text-red-700" />
        )}
      </div>

      {pct === 100 && (
        <div className="mt-3 text-center text-sm text-green-600 bg-green-50 rounded-lg py-2 font-medium">
          Parabéns! Todas as tarefas concluídas!
        </div>
      )}
    </div>
  )
}

function Stat({
  icon,
  label,
  count,
  color,
}: {
  icon: React.ReactNode
  label: string
  count: number
  color: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className={`font-semibold ${color}`}>{count}</span>
      <span className="text-gray-400">{label}</span>
    </div>
  )
}
