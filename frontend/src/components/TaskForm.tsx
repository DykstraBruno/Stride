import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Sparkles } from 'lucide-react'
import { Task, CreateTaskPayload, TaskPeriod, TaskPriority, TaskCategory } from '../types/task'
import { useCreateTask, useUpdateTask } from '../hooks/useTasks'
import { format } from 'date-fns'

interface TaskFormProps {
  task?: Task
  defaultPeriod?: TaskPeriod
  onClose: () => void
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function TaskForm({ task, defaultPeriod = 'daily', onClose }: TaskFormProps) {
  const isEditing = Boolean(task)
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const [form, setForm] = useState({
    title:            task?.title ?? '',
    description:      task?.description ?? '',
    period:           task?.period ?? defaultPeriod,
    priority:         task?.priority ?? ('medium' as TaskPriority),
    timeLimitHours:   task ? Math.floor(task.timeLimitMinutes / 60) : 0,
    timeLimitMins:    task ? task.timeLimitMinutes % 60             : 30,
    scheduledAt:      task?.scheduledAt
      ? format(new Date(task.scheduledAt), "yyyy-MM-dd'T'HH:mm") : '',
    category:         task?.category ?? ('work' as TaskCategory),
    isRecurring:      task?.isRecurring ?? false,
    recurringDays:    task?.recurringConfig?.daysOfWeek ?? [] as number[],
    tags:             task?.tags.join(', ') ?? '',
  })

  const [error, setError] = useState('')

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      recurringDays: prev.recurringDays.includes(day)
        ? prev.recurringDays.filter((d) => d !== day)
        : [...prev.recurringDays, day].sort((a, b) => a - b),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Título é obrigatório'); return }
    if (form.timeLimitHours * 60 + form.timeLimitMins < 1) {
      setError('Defina ao menos 1 minuto de duração'); return
    }
    if (form.isRecurring && form.recurringDays.length === 0) {
      setError('Selecione ao menos um dia para a recorrência'); return
    }

    const payload: CreateTaskPayload = {
      title:            form.title.trim(),
      description:      form.description || undefined,
      period:           form.period as TaskPeriod,
      priority:         form.priority,
      timeLimitMinutes: form.timeLimitHours * 60 + form.timeLimitMins,
      scheduledAt:      form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
      category:         form.category,
      isRecurring:      form.isRecurring,
      recurringConfig:  form.isRecurring
        ? { frequency: form.period as TaskPeriod, daysOfWeek: form.recurringDays }
        : undefined,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    }

    try {
      if (isEditing && task) {
        await updateTask.mutateAsync({ id: task.id, payload })
      } else {
        await createTask.mutateAsync(payload)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const isPending = createTask.isPending || updateTask.isPending

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                    p-0 sm:p-4 backdrop-blur-sm animate-fade-in"
         style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-t-2xl sm:rounded-xl shadow-2xl
                      w-full sm:max-w-lg max-h-[92vh] overflow-y-auto animate-slide-up"
           style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4"
             style={{ borderBottom: '1px solid var(--c-border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-500/15 flex items-center justify-center">
              <Sparkles size={13} className="text-primary-500" />
            </div>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>
              {isEditing ? 'Editar tarefa' : 'Nova tarefa'}
            </h2>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400
                            bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40
                            px-3.5 py-2.5 rounded-xl">
              <span>⚠</span> {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-500 dark:text-surface-400">
              Título <span className="text-rose-400">*</span>
            </label>
            <input className="input" autoFocus
              placeholder="Ex: Fazer exercício, Reunião com equipe..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-500 dark:text-surface-400">
              Descrição
            </label>
            <textarea className="input resize-none" rows={2}
              placeholder="Detalhes opcionais..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          {/* Period + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-surface-500 dark:text-surface-400">Período</label>
              <select className="input"
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value as TaskPeriod })}>
                <option value="daily">📅 Diária</option>
                <option value="weekly">📆 Semanal</option>
                <option value="monthly">🗓️ Mensal</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-surface-500 dark:text-surface-400">Prioridade</label>
              <select className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                <option value="low">🔵 Baixa</option>
                <option value="medium">🟣 Média</option>
                <option value="high">🟠 Alta</option>
                <option value="urgent">🔴 Urgente</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-500 dark:text-surface-400">Categoria</label>
            <select className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as TaskCategory })}>
              <option value="work">💼 Trabalho</option>
              <option value="personal">👤 Pessoal</option>
              <option value="health">🏃 Saúde</option>
              <option value="leisure">🎮 Lazer</option>
              <option value="household">🏠 Casa</option>
              <option value="food">🍽️ Alimentação</option>
              <option value="hygiene">🚿 Higiene</option>
              <option value="other">📌 Outro</option>
            </select>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-500 dark:text-surface-400">
              Duração
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center flex-1 gap-1.5">
                <input className="input text-center w-full" type="number" min={0} max={23}
                  placeholder="0"
                  value={form.timeLimitHours || ''}
                  onChange={(e) =>
                    setForm({ ...form, timeLimitHours: Math.min(23, Math.max(0, parseInt(e.target.value) || 0)) })} />
                <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--c-muted)' }}>h</span>
              </div>
              <div className="flex items-center flex-1 gap-1.5">
                <input className="input text-center w-full" type="number" min={0} max={59}
                  placeholder="0"
                  value={form.timeLimitMins || ''}
                  onChange={(e) =>
                    setForm({ ...form, timeLimitMins: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)) })} />
                <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--c-muted)' }}>min</span>
              </div>
            </div>
          </div>

          {/* Scheduled */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-500 dark:text-surface-400">
              Início agendado
            </label>
            <input className="input" type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
            <p className="text-xs text-surface-400 dark:text-surface-500">
              O prazo é calculado automaticamente: início + tempo limite
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-500 dark:text-surface-400">Tags</label>
            <input className="input"
              placeholder="manhã, foco, reunião  (separadas por vírgula)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>

          {/* Recurring toggle */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`relative w-9 h-5 rounded-full transition-colors duration-200
                              ${form.isRecurring
                                ? 'bg-primary-500'
                                : 'bg-surface-200 dark:bg-surface-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm
                                 transition-transform duration-200
                                 ${form.isRecurring ? 'translate-x-4' : 'translate-x-0.5'}`} />
                <input type="checkbox" className="sr-only"
                  checked={form.isRecurring}
                  onChange={(e) => setForm({ ...form, isRecurring: e.target.checked, recurringDays: [] })} />
              </div>
              <span className="text-sm text-surface-700 dark:text-surface-300">Tarefa recorrente</span>
            </label>

            {/* Day picker — shown only when recurring */}
            {form.isRecurring && (
              <div className="space-y-2 pl-1">
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400">
                  Repetir nos dias <span className="text-rose-400">*</span>
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS.map((label, idx) => {
                    const active = form.recurringDays.includes(idx)
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={`w-10 h-10 rounded-xl text-xs font-semibold transition-all duration-150
                                    ${active
                                      ? 'bg-primary-500 text-white shadow-glow-sm'
                                      : 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                                    }`}>
                        {label}
                      </button>
                    )
                  })}
                </div>

                {/* Quick select helpers */}
                <div className="flex gap-2">
                  <button type="button"
                    onClick={() => setForm({ ...form, recurringDays: [1, 2, 3, 4, 5] })}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                    Dias úteis
                  </button>
                  <span className="text-surface-300 dark:text-surface-600">·</span>
                  <button type="button"
                    onClick={() => setForm({ ...form, recurringDays: [0, 6] })}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                    Fim de semana
                  </button>
                  <span className="text-surface-300 dark:text-surface-600">·</span>
                  <button type="button"
                    onClick={() => setForm({ ...form, recurringDays: [0, 1, 2, 3, 4, 5, 6] })}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                    Todos
                  </button>
                  <span className="text-surface-300 dark:text-surface-600">·</span>
                  <button type="button"
                    onClick={() => setForm({ ...form, recurringDays: [] })}
                    className="text-xs text-surface-400 dark:text-surface-500 hover:underline">
                    Limpar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-2.5 pt-2" style={{ borderTop: '1px solid var(--c-border)' }}>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="btn-primary flex-1">
              {isPending ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Criar tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
