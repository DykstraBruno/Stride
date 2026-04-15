import { CheckCircle2, Circle, AlertCircle, TrendingUp } from 'lucide-react'
import { Task, TaskStatus } from '../types/task'

interface ChecklistProgressProps {
  tasks: Task[]
}

export function ChecklistProgress({ tasks }: ChecklistProgressProps) {
  if (tasks.length === 0) return null

  const counts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1
    return acc
  }, {} as Record<TaskStatus, number>)

  const total      = tasks.length
  const completed  = counts['completed']   ?? 0
  const inProgress = counts['in_progress'] ?? 0
  const overdue    = counts['overdue']     ?? 0
  const pending    = counts['pending']     ?? 0
  const skipped    = counts['skipped']     ?? 0
  const pct        = Math.round((completed / total) * 100)

  const ringColor = pct === 100 ? '#10b981'
                  : pct >= 60   ? '#5865f2'
                  : pct >= 30   ? '#f59e0b'
                  : '#ef4444'

  const circumference = 2 * Math.PI * 26
  const strokeDash    = circumference - (pct / 100) * circumference

  return (
    <div className="card">
      <div className="flex items-center gap-4">

        {/* Circular progress */}
        <div className="relative flex-shrink-0 w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="26" fill="none"
              stroke="var(--c-hover)" strokeWidth="5" />
            <circle cx="30" cy="30" r="26" fill="none"
              stroke={ringColor} strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDash}
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold" style={{ color: 'var(--c-text)' }}>{pct}%</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={13} className="text-primary-500" />
            <h3 className="text-xs font-semibold" style={{ color: 'var(--c-soft)' }}>
              Progresso do dia
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <StatRow icon={<CheckCircle2 size={11} className="text-emerald-500" />}
              label="Concluídas" count={completed} color="#10b981" />
            <StatRow icon={<Circle size={11} className="text-primary-500" />}
              label="Em andamento" count={inProgress} color="#5865f2" />
            <StatRow icon={<Circle size={11} style={{ color: 'var(--c-muted)' }} />}
              label="Pendentes" count={pending + skipped} color="var(--c-soft)" />
            {overdue > 0 && (
              <StatRow icon={<AlertCircle size={11} className="text-rose-500" />}
                label="Atrasadas" count={overdue} color="#ef4444" />
            )}
          </div>
        </div>
      </div>

      {pct === 100 && (
        <div className="mt-3 flex items-center justify-center gap-2
                        bg-emerald-500/10 border border-emerald-500/20
                        rounded-lg py-2.5 px-3">
          <span className="text-lg">🎉</span>
          <span className="text-sm font-semibold text-emerald-500">
            Parabéns! Todas as tarefas concluídas!
          </span>
        </div>
      )}
    </div>
  )
}

function StatRow({
  icon, label, count, color,
}: {
  icon: React.ReactNode
  label: string
  count: number
  color: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs font-semibold" style={{ color }}>{count}</span>
      <span className="text-xs truncate" style={{ color: 'var(--c-muted)' }}>{label}</span>
    </div>
  )
}
