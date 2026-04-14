import { Task, TaskPeriod, TaskPriority } from '../../domain/entities/Task'
import { ITaskRepository } from '../../domain/repositories/ITaskRepository'

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export class GetTasksByPeriod {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(period: TaskPeriod, date: Date): Promise<Task[]> {
    const tasks = await this.taskRepository.findByPeriod(period, date)

    return tasks.sort((a, b) => {
      const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (priorityDiff !== 0) return priorityDiff

      const aTime = a.scheduledAt?.getTime() ?? a.dueDate.getTime()
      const bTime = b.scheduledAt?.getTime() ?? b.dueDate.getTime()
      return aTime - bTime
    })
  }
}
