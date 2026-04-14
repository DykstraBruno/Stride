import { Task, TaskPeriod, TaskPriority, TaskCategory, RecurringConfig } from '../../domain/entities/Task'
import { ITaskRepository } from '../../domain/repositories/ITaskRepository'

export interface CreateTaskInput {
  title: string
  description?: string
  period: TaskPeriod
  priority: TaskPriority
  timeLimitMinutes: number
  scheduledAt?: Date
  dueDate: Date
  category: TaskCategory
  isRecurring?: boolean
  recurringConfig?: RecurringConfig
  tags?: string[]
}

export class CreateTask {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    const task = new Task({
      title: input.title,
      description: input.description,
      period: input.period,
      priority: input.priority,
      timeLimitMinutes: input.timeLimitMinutes,
      scheduledAt: input.scheduledAt,
      dueDate: input.dueDate,
      category: input.category,
      isRecurring: input.isRecurring,
      recurringConfig: input.recurringConfig,
      tags: input.tags,
    })

    return this.taskRepository.save(task)
  }
}
