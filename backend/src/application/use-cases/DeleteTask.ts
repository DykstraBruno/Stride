import { ITaskRepository } from '../../domain/repositories/ITaskRepository'

export class DeleteTask {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(taskId: string): Promise<void> {
    const exists = await this.taskRepository.existsById(taskId)
    if (!exists) throw new Error(`Task not found: ${taskId}`)

    await this.taskRepository.delete(taskId)
  }
}
