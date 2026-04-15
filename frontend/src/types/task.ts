export type TaskPeriod = 'daily' | 'weekly' | 'monthly'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'skipped'
export type TaskCategory =
  | 'work'
  | 'personal'
  | 'health'
  | 'leisure'
  | 'household'
  | 'food'
  | 'hygiene'
  | 'other'

export interface RecurringConfig {
  frequency: TaskPeriod
  daysOfWeek?: number[]
  dayOfMonth?: number
  timeOfDay?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  period: TaskPeriod
  priority: TaskPriority
  timeLimitMinutes: number
  scheduledAt?: string
  dueDate: string
  completedAt?: string
  status: TaskStatus
  category: TaskCategory
  isRecurring: boolean
  recurringConfig?: RecurringConfig
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateTaskPayload {
  title: string
  description?: string
  period: TaskPeriod
  priority: TaskPriority
  timeLimitMinutes: number
  scheduledAt?: string
  category: TaskCategory
  isRecurring?: boolean
  recurringConfig?: RecurringConfig
  tags?: string[]
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {}

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
}

export const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

export const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluída',
  overdue: 'Atrasada',
  skipped: 'Ignorada',
}

export const CATEGORY_LABEL: Record<TaskCategory, string> = {
  work: 'Trabalho',
  personal: 'Pessoal',
  health: 'Saúde',
  leisure: 'Lazer',
  household: 'Casa',
  food: 'Alimentação',
  hygiene: 'Higiene',
  other: 'Outro',
}

export const CATEGORY_EMOJI: Record<TaskCategory, string> = {
  work: '💼',
  personal: '👤',
  health: '🏃',
  leisure: '🎮',
  household: '🏠',
  food: '🍽️',
  hygiene: '🚿',
  other: '📌',
}

export const PERIOD_LABEL: Record<TaskPeriod, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
}
