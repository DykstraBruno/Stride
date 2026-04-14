import { Task } from '../../domain/entities/Task'
import { ITaskRepository } from '../../domain/repositories/ITaskRepository'

export class CompleteTask {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(taskId: string): Promise<Task> {
    const task = await this.taskRepository.findById(taskId)
    if (!task) throw new Error(`Task not found: ${taskId}`)

    task.complete()
    return this.taskRepository.update(task)
  }
}
