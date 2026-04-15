import { Task } from '../../domain/entities/Task'
import { ITaskRepository } from '../../domain/repositories/ITaskRepository'

const DAYS_AHEAD = 28   // generate instances for the next 4 weeks

export class GenerateRecurringInstances {
  constructor(private readonly taskRepository: ITaskRepository) {}

  /**
   * Creates per-day task instances for a recurring template.
   * Deletes existing pending instances first so re-generating on update is safe.
   */
  async execute(template: Task): Promise<void> {
    const daysOfWeek = template.recurringConfig?.daysOfWeek
    if (!daysOfWeek || daysOfWeek.length === 0) return

    // Remove pending future instances before regenerating
    await this.taskRepository.deleteByParentId(template.id)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let offset = 0; offset < DAYS_AHEAD; offset++) {
      const day = new Date(today)
      day.setDate(today.getDate() + offset)

      if (!daysOfWeek.includes(day.getDay())) continue

      // Preserve the original time-of-day from scheduledAt (if any)
      let scheduledAt: Date | undefined
      if (template.scheduledAt) {
        scheduledAt = new Date(day)
        scheduledAt.setHours(
          template.scheduledAt.getHours(),
          template.scheduledAt.getMinutes(),
          0, 0,
        )
      }

      const base    = scheduledAt ?? day
      const dueDate = new Date(base.getTime() + template.timeLimitMinutes * 60_000)

      const instance = new Task({
        title:             template.title,
        description:       template.description,
        period:            template.period,
        priority:          template.priority,
        timeLimitMinutes:  template.timeLimitMinutes,
        scheduledAt,
        dueDate,
        category:          template.category,
        isRecurring:       false,
        recurringParentId: template.id,
        tags:              template.tags,
      })

      await this.taskRepository.save(instance)
    }
  }
}
