import { ITaskRepository } from '../../domain/repositories/ITaskRepository'

export class DeleteTask {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(taskId: string): Promise<void> {
    const task = await this.taskRepository.findById(taskId)
    if (!task) throw new Error(`Task not found: ${taskId}`)

    // If this is a recurring template, remove all its pending instances too
    if (task.isRecurring) {
      await this.taskRepository.deleteByParentId(taskId)
    }

    await this.taskRepository.delete(taskId)
  }
}
