import { useState } from 'react'
import { Check, Play, SkipForward, Trash2, Clock, Edit2, AlertCircle, Timer } from 'lucide-react'
import { Task, CATEGORY_EMOJI, TaskPriority } from '../types/task'
import { useCompleteTask, useStartTask, useSkipTask, useDeleteTask } from '../hooks/useTasks'
import { formatDistanceToNow, parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  urgent: 'priority-urgent',
  high:   'priority-high',
  medium: 'priority-medium',
  low:    'priority-low',
}

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  urgent: 'Urgente',
  high:   'Alta',
  medium: 'Média',
  low:    'Baixa',
}

const STATUS_BORDER: Record<string, string> = {
  completed:   '#10b981',
  overdue:     '#ef4444',
  in_progress: '#5865f2',
  pending:     'var(--c-border)',
  skipped:     'var(--c-border)',
}

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const complete = useCompleteTask()
  const start    = useStartTask()
  const skip     = useSkipTask()
  const del      = useDeleteTask()

  const isCompleted  = task.status === 'completed'
  const isOverdue    = task.status === 'overdue'
  const isInProgress = task.status === 'in_progress'
  const isPending    = task.status === 'pending'

  const dueDate   = parseISO(task.dueDate)
  const timeLabel = formatDistanceToNow(dueDate, { addSuffix: true, locale: ptBR })
  const timeStr   = task.scheduledAt
    ? format(parseISO(task.scheduledAt), 'HH:mm')
    : format(dueDate, 'HH:mm')

  return (
    <div
      className={`rounded-lg border-l-4 transition-all duration-150 animate-slide-in ${isCompleted ? 'opacity-50' : ''}`}
      style={{
        backgroundColor: 'var(--c-card)',
        borderColor: 'var(--c-border)',
        borderLeftColor: STATUS_BORDER[task.status] ?? STATUS_BORDER.pending,
        borderStyle: 'solid',
        borderWidth: '1px',
        borderLeftWidth: '4px',
      }}
    >
      <div className="p-3.5">
        <div className="flex items-start gap-3">

          {/* Checkbox */}
          <button
            onClick={() => !isCompleted && complete.mutate(task.id)}
            disabled={isCompleted || complete.isPending}
            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2
                        flex items-center justify-center transition-all duration-200 ${
              isCompleted
                ? 'bg-emerald-500 border-emerald-500'
                : isOverdue
                  ? 'border-rose-500 hover:border-emerald-400'
                  : 'hover:border-primary-500'
            }`}
            style={!isCompleted && !isOverdue ? { borderColor: 'var(--c-border)' } : {}}
          >
            {isCompleted && <Check size={11} className="text-white" strokeWidth={3} />}
            {isOverdue && !isCompleted && (
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse-soft" />
            )}
          </button>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <span className="text-base leading-none">{CATEGORY_EMOJI[task.category]}</span>
              <h3 className={`font-semibold text-sm leading-snug ${isCompleted ? 'line-through' : ''}`}
                  style={{ color: isCompleted ? 'var(--c-muted)' : 'var(--c-text)' }}>
                {task.title}
              </h3>
            </div>

            {task.description && (
              <p className="text-xs mt-1 line-clamp-2 leading-relaxed"
                 style={{ color: 'var(--c-muted)' }}>
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`badge text-[11px] ${PRIORITY_STYLES[task.priority]}`}>
                {PRIORITY_LABEL[task.priority]}
              </span>

              <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--c-muted)' }}>
                <Clock size={10} strokeWidth={2} />{task.timeLimitMinutes}min
              </span>

              <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--c-muted)' }}>
                <Timer size={10} strokeWidth={2} />{timeStr}
              </span>

              {isOverdue && (
                <span className="flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                  <AlertCircle size={10} strokeWidth={2} />{timeLabel}
                </span>
              )}
              {!isOverdue && !isCompleted && (
                <span className="text-[11px]" style={{ color: 'var(--c-muted)' }}>{timeLabel}</span>
              )}

              {task.isRecurring && (
                <span className="text-[11px] text-primary-500">↻ recorrente</span>
              )}

              {task.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="badge text-[11px]">{tag}</span>
              ))}
            </div>

            {isInProgress && (
              <TimerBar timeLimitMinutes={task.timeLimitMinutes} dueDate={task.dueDate} />
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {isPending && (
              <button onClick={() => start.mutate(task.id)} disabled={start.isPending}
                title="Iniciar"
                className="btn-icon w-7 h-7 !text-primary-500 hover:!bg-primary-500/15">
                <Play size={13} strokeWidth={2.5} />
              </button>
            )}
            {!isCompleted && (
              <button onClick={() => skip.mutate(task.id)} disabled={skip.isPending}
                title="Pular" className="btn-icon w-7 h-7">
                <SkipForward size={13} strokeWidth={2} />
              </button>
            )}
            {onEdit && (
              <button onClick={() => onEdit(task)} title="Editar" className="btn-icon w-7 h-7">
                <Edit2 size={13} strokeWidth={2} />
              </button>
            )}
            {confirmDelete ? (
              <div className="flex items-center gap-1 ml-1">
                <button onClick={() => del.mutate(task.id)}
                  className="text-[11px] text-rose-500 font-semibold
                             px-2 py-1 bg-rose-500/10 rounded-lg
                             hover:bg-rose-500/20 transition-colors border border-rose-500/30">
                  Sim
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="text-[11px] px-2 py-1 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--c-hover)', color: 'var(--c-soft)' }}>
                  Não
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} title="Excluir"
                className="btn-icon w-7 h-7 hover:!text-rose-500 hover:!bg-rose-500/10">
                <Trash2 size={13} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TimerBar({ timeLimitMinutes, dueDate }: { timeLimitMinutes: number; dueDate: string }) {
  const due      = parseISO(dueDate).getTime()
  const startEst = due - timeLimitMinutes * 60000
  const elapsed  = Date.now() - startEst
  const progress = Math.min(100, Math.max(0, (elapsed / (timeLimitMinutes * 60000)) * 100))
  const color    = progress > 80 ? 'from-rose-500 to-rose-400'
                 : progress > 60 ? 'from-amber-500 to-orange-400'
                 : 'from-primary-600 to-primary-400'

  return (
    <div className="mt-3 space-y-1">
      <div className="flex justify-between text-[10px]" style={{ color: 'var(--c-muted)' }}>
        <span>Em andamento</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--c-hover)' }}>
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000`}
          style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
