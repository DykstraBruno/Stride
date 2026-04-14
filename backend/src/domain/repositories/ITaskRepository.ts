import { Task, TaskPeriod, TaskStatus } from '../entities/Task'

export interface FindTasksFilter {
  period?: TaskPeriod
  status?: TaskStatus
  category?: string
  dateFrom?: Date
  dateTo?: Date
  isRecurring?: boolean
}

export interface ITaskRepository {
  findById(id: string): Promise<Task | null>
  findAll(filter?: FindTasksFilter): Promise<Task[]>
  findByPeriod(period: TaskPeriod, date: Date): Promise<Task[]>
  save(task: Task): Promise<Task>
  update(task: Task): Promise<Task>
  delete(id: string): Promise<void>
  existsById(id: string): Promise<boolean>
}
