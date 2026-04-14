import { v4 as uuidv4 } from 'uuid'

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
  daysOfWeek?: number[] // 0=Sun, 6=Sat (for weekly)
  dayOfMonth?: number   // 1-31 (for monthly)
  timeOfDay?: string    // "HH:MM" format
}

export interface TaskProps {
  id?: string
  title: string
  description?: string
  period: TaskPeriod
  priority: TaskPriority
  timeLimitMinutes: number
  scheduledAt?: Date
  dueDate: Date
  completedAt?: Date
  status?: TaskStatus
  category: TaskCategory
  isRecurring?: boolean
  recurringConfig?: RecurringConfig
  tags?: string[]
  createdAt?: Date
  updatedAt?: Date
}

export class Task {
  readonly id: string
  title: string
  description: string | undefined
  period: TaskPeriod
  priority: TaskPriority
  timeLimitMinutes: number
  scheduledAt: Date | undefined
  dueDate: Date
  completedAt: Date | undefined
  status: TaskStatus
  category: TaskCategory
  isRecurring: boolean
  recurringConfig: RecurringConfig | undefined
  tags: string[]
  readonly createdAt: Date
  updatedAt: Date

  constructor(props: TaskProps) {
    this.validateTitle(props.title)
    this.validateTimeLimitMinutes(props.timeLimitMinutes)
    this.validateDueDate(props.dueDate)

    this.id = props.id ?? uuidv4()
    this.title = props.title.trim()
    this.description = props.description
    this.period = props.period
    this.priority = props.priority
    this.timeLimitMinutes = props.timeLimitMinutes
    this.scheduledAt = props.scheduledAt
    this.dueDate = props.dueDate
    this.completedAt = props.completedAt
    this.status = props.status ?? 'pending'
    this.category = props.category
    this.isRecurring = props.isRecurring ?? false
    this.recurringConfig = props.recurringConfig
    this.tags = props.tags ?? []
    this.createdAt = props.createdAt ?? new Date()
    this.updatedAt = props.updatedAt ?? new Date()
  }

  private validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Task title cannot be empty')
    }
    if (title.trim().length > 200) {
      throw new Error('Task title cannot exceed 200 characters')
    }
  }

  private validateTimeLimitMinutes(minutes: number): void {
    if (!Number.isInteger(minutes) || minutes <= 0) {
      throw new Error('Time limit must be a positive integer (minutes)')
    }
    if (minutes > 1440) {
      throw new Error('Time limit cannot exceed 1440 minutes (24 hours)')
    }
  }

  private validateDueDate(date: Date): void {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Due date must be a valid Date')
    }
  }

  complete(): void {
    if (this.status === 'completed') {
      throw new Error('Task is already completed')
    }
    this.status = 'completed'
    this.completedAt = new Date()
    this.updatedAt = new Date()
  }

  start(): void {
    if (this.status !== 'pending') {
      throw new Error(`Cannot start a task with status "${this.status}"`)
    }
    this.status = 'in_progress'
    this.updatedAt = new Date()
  }

  skip(): void {
    if (this.status === 'completed') {
      throw new Error('Cannot skip a completed task')
    }
    this.status = 'skipped'
    this.updatedAt = new Date()
  }

  markOverdue(): void {
    if (this.status === 'completed' || this.status === 'skipped') return
    this.status = 'overdue'
    this.updatedAt = new Date()
  }

  isOverdue(now: Date = new Date()): boolean {
    return now > this.dueDate && this.status !== 'completed' && this.status !== 'skipped'
  }

  getRemainingMinutes(now: Date = new Date()): number {
    const diffMs = this.dueDate.getTime() - now.getTime()
    return Math.floor(diffMs / 60000)
  }

  toPlainObject() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      period: this.period,
      priority: this.priority,
      timeLimitMinutes: this.timeLimitMinutes,
      scheduledAt: this.scheduledAt,
      dueDate: this.dueDate,
      completedAt: this.completedAt,
      status: this.status,
      category: this.category,
      isRecurring: this.isRecurring,
      recurringConfig: this.recurringConfig,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
