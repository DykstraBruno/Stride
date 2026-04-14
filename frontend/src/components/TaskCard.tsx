import { useState } from 'react'
import { Check, Play, SkipForward, Trash2, Clock, Edit2 } from 'lucide-react'
import { Task, PRIORITY_COLOR, PRIORITY_LABEL, CATEGORY_EMOJI, STATUS_LABEL } from '../types/task'
import { useCompleteTask, useStartTask, useSkipTask, useDeleteTask } from '../hooks/useTasks'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const complete = useCompleteTask()
  const start = useStartTask()
  const skip = useSkipTask()
  const del = useDeleteTask()

  const isCompleted = task.status === 'completed'
  const isOverdue = task.status === 'overdue'
  const isInProgress = task.status === 'in_progress'
  const isPending = task.status === 'pending'

  const dueDate = parseISO(task.dueDate)
  const timeLabel = formatDistanceToNow(dueDate, { addSuffix: true, locale: ptBR })

  const cardBorder = isCompleted
    ? 'border-l-4 border-l-green-400'
    : isOverdue
      ? 'border-l-4 border-l-red-400'
      : isInProgress
        ? 'border-l-4 border-l-blue-400'
        : 'border-l-4 border-l-gray-200'

  return (
    <div className={`card animate-slide-in ${cardBorder} ${isCompleted ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        {/* Checkbox / status icon */}
        <button
          onClick={() => !isCompleted && complete.mutate(task.id)}
          disabled={isCompleted || complete.isPending}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
            ${isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'}`}
        >
          {isCompleted && <Check size={12} className="text-white" strokeWidth={3} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm">{CATEGORY_EMOJI[task.category]}</span>
            <h3
              className={`font-medium text-sm leading-tight ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}
            >
              {task.title}
            </h3>
            <span className={`badge ${PRIORITY_COLOR[task.priority]}`}>
              {PRIORITY_LABEL[task.priority]}
            </span>
            {isOverdue && (
              <span className="badge bg-red-100 text-red-700">Atrasada</span>
            )}
            {isInProgress && (
              <span className="badge bg-blue-100 text-blue-700">Em andamento</span>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {task.timeLimitMinutes}min limite
            </span>
            <span>{timeLabel}</span>
            {task.tags.length > 0 && (
              <div className="flex gap-1">
                {task.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Time progress bar when in_progress */}
          {isInProgress && (
            <TimerBar timeLimitMinutes={task.timeLimitMinutes} dueDate={task.dueDate} />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isPending && (
            <button
              onClick={() => start.mutate(task.id)}
              disabled={start.isPending}
              title="Iniciar"
              className="btn-ghost p-1.5 text-blue-600"
            >
              <Play size={14} />
            </button>
          )}
          {!isCompleted && (
            <button
              onClick={() => skip.mutate(task.id)}
              disabled={skip.isPending}
              title="Pular"
              className="btn-ghost p-1.5 text-gray-400"
            >
              <SkipForward size={14} />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              title="Editar"
              className="btn-ghost p-1.5 text-gray-400"
            >
              <Edit2 size={14} />
            </button>
          )}
          {confirmDelete ? (
            <div className="flex gap-1">
              <button
                onClick={() => del.mutate(task.id)}
                className="text-xs text-red-600 font-medium px-2 py-1 bg-red-50 rounded"
              >
                Sim
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded"
              >
                Não
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Excluir"
              className="btn-ghost p-1.5 text-gray-300 hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function TimerBar({ timeLimitMinutes, dueDate }: { timeLimitMinutes: number; dueDate: string }) {
  const due = parseISO(dueDate).getTime()
  const startEstimate = due - timeLimitMinutes * 60000
  const now = Date.now()
  const elapsed = now - startEstimate
  const progress = Math.min(100, Math.max(0, (elapsed / (timeLimitMinutes * 60000)) * 100))

  const color = progress > 80 ? 'bg-red-400' : progress > 60 ? 'bg-orange-400' : 'bg-blue-400'

  return (
    <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
