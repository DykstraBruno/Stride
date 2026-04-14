import { useState } from 'react'
import { X } from 'lucide-react'
import { Task, CreateTaskPayload, TaskPeriod, TaskPriority, TaskCategory } from '../types/task'
import { useCreateTask, useUpdateTask } from '../hooks/useTasks'
import { format, addHours } from 'date-fns'

interface TaskFormProps {
  task?: Task
  defaultPeriod?: TaskPeriod
  onClose: () => void
}

export function TaskForm({ task, defaultPeriod = 'daily', onClose }: TaskFormProps) {
  const isEditing = Boolean(task)
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const defaultDue = format(addHours(new Date(), 2), "yyyy-MM-dd'T'HH:mm")

  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    period: task?.period ?? defaultPeriod,
    priority: task?.priority ?? ('medium' as TaskPriority),
    timeLimitMinutes: task?.timeLimitMinutes ?? 30,
    scheduledAt: task?.scheduledAt ? format(new Date(task.scheduledAt), "yyyy-MM-dd'T'HH:mm") : '',
    dueDate: task?.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : defaultDue,
    category: task?.category ?? ('work' as TaskCategory),
    isRecurring: task?.isRecurring ?? false,
    tags: task?.tags.join(', ') ?? '',
  })

  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) {
      setError('Título é obrigatório')
      return
    }

    const payload: CreateTaskPayload = {
      title: form.title.trim(),
      description: form.description || undefined,
      period: form.period as TaskPeriod,
      priority: form.priority,
      timeLimitMinutes: Number(form.timeLimitMinutes),
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
      dueDate: new Date(form.dueDate).toISOString(),
      category: form.category,
      isRecurring: form.isRecurring,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }

    try {
      if (isEditing && task) {
        await updateTask.mutateAsync({ id: task.id, payload })
      } else {
        await createTask.mutateAsync(payload)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar tarefa')
    }
  }

  const field = (
    label: string,
    children: React.ReactNode,
    hint?: string,
  ) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {isEditing ? 'Editar tarefa' : 'Nova tarefa'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {field(
            'Título *',
            <input
              className="input"
              placeholder="Ex: Fazer exercício, Reunião com equipe..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              autoFocus
            />,
          )}

          {field(
            'Descrição',
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Detalhes opcionais..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />,
          )}

          <div className="grid grid-cols-2 gap-3">
            {field(
              'Período',
              <select
                className="input"
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value as TaskPeriod })}
              >
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>,
            )}

            {field(
              'Prioridade',
              <select
                className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>,
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field(
              'Categoria',
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as TaskCategory })}
              >
                <option value="work">💼 Trabalho</option>
                <option value="personal">👤 Pessoal</option>
                <option value="health">🏃 Saúde</option>
                <option value="leisure">🎮 Lazer</option>
                <option value="household">🏠 Casa</option>
                <option value="food">🍽️ Alimentação</option>
                <option value="hygiene">🚿 Higiene</option>
                <option value="other">📌 Outro</option>
              </select>,
            )}

            {field(
              'Tempo limite (min)',
              <input
                className="input"
                type="number"
                min={1}
                max={1440}
                value={form.timeLimitMinutes}
                onChange={(e) =>
                  setForm({ ...form, timeLimitMinutes: parseInt(e.target.value) || 30 })
                }
              />,
              'Máx. por sessão',
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field(
              'Horário agendado',
              <input
                className="input"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              />,
            )}

            {field(
              'Prazo *',
              <input
                className="input"
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />,
            )}
          </div>

          {field(
            'Tags',
            <input
              className="input"
              placeholder="manhã, foco, reunião (separadas por vírgula)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />,
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
              className="rounded border-gray-300 text-stride-600 focus:ring-stride-500"
            />
            <span className="text-sm text-gray-700">Tarefa recorrente</span>
          </label>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createTask.isPending || updateTask.isPending}
              className="btn-primary flex-1"
            >
              {createTask.isPending || updateTask.isPending
                ? 'Salvando...'
                : isEditing
                  ? 'Salvar alterações'
                  : 'Criar tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
