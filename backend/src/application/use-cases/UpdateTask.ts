import { Task, TaskPeriod, TaskPriority, TaskCategory, RecurringConfig } from '../../domain/entities/Task'
import { ITaskRepository } from '../../domain/repositories/ITaskRepository'

export interface UpdateTaskInput {
  title?: string
  description?: string
  period?: TaskPeriod
  priority?: TaskPriority
  timeLimitMinutes?: number
  scheduledAt?: Date
  dueDate?: Date
  category?: TaskCategory
  isRecurring?: boolean
  recurringConfig?: RecurringConfig
  tags?: string[]
}

export class UpdateTask {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(taskId: string, input: UpdateTaskInput): Promise<Task> {
    const task = await this.taskRepository.findById(taskId)
    if (!task) throw new Error(`Task not found: ${taskId}`)

    if (input.title !== undefined) {
      // Delegate validation back to the entity
      const tempTask = new Task({ ...task.toPlainObject(), title: input.title })
      task.title = tempTask.title
    }
    if (input.description !== undefined) task.description = input.description
    if (input.period !== undefined) task.period = input.period
    if (input.priority !== undefined) task.priority = input.priority
    if (input.timeLimitMinutes !== undefined) task.timeLimitMinutes = input.timeLimitMinutes
    if (input.scheduledAt !== undefined) task.scheduledAt = input.scheduledAt
    if (input.dueDate !== undefined) task.dueDate = input.dueDate
    if (input.category !== undefined) task.category = input.category
    if (input.isRecurring !== undefined) task.isRecurring = input.isRecurring
    if (input.recurringConfig !== undefined) task.recurringConfig = input.recurringConfig
    if (input.tags !== undefined) task.tags = input.tags

    task.updatedAt = new Date()

    return this.taskRepository.update(task)
  }
}
