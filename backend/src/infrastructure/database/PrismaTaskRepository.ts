import { PrismaClient, Task as PrismaTask } from '@prisma/client'
import { Task, TaskPeriod, TaskStatus, TaskPriority, TaskCategory, RecurringConfig } from '../../domain/entities/Task'
import { ITaskRepository, FindTasksFilter } from '../../domain/repositories/ITaskRepository'

export class PrismaTaskRepository implements ITaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Task | null> {
    const record = await this.prisma.task.findUnique({ where: { id } })
    return record ? this.toDomain(record) : null
  }

  async findAll(filter?: FindTasksFilter): Promise<Task[]> {
    const records = await this.prisma.task.findMany({
      where: {
        ...(filter?.period && { period: filter.period }),
        ...(filter?.status && { status: filter.status }),
        ...(filter?.category && { category: filter.category }),
        ...(filter?.isRecurring !== undefined && { isRecurring: filter.isRecurring }),
        ...(filter?.dateFrom || filter?.dateTo
          ? {
              dueDate: {
                ...(filter.dateFrom && { gte: filter.dateFrom }),
                ...(filter.dateTo && { lte: filter.dateTo }),
              },
            }
          : {}),
      },
      orderBy: { dueDate: 'asc' },
    })
    return records.map(this.toDomain)
  }

  async findByPeriod(period: TaskPeriod, date: Date): Promise<Task[]> {
    const { start, end } = this.getPeriodRange(period, date)

    const records = await this.prisma.task.findMany({
      where: {
        period,
        dueDate: { gte: start, lte: end },
      },
      orderBy: [{ priority: 'asc' }, { scheduledAt: 'asc' }],
    })

    return records.map(this.toDomain)
  }

  async save(task: Task): Promise<Task> {
    const data = this.toPrisma(task)
    const record = await this.prisma.task.create({ data })
    return this.toDomain(record)
  }

  async update(task: Task): Promise<Task> {
    const data = this.toPrisma(task)
    const record = await this.prisma.task.update({
      where: { id: task.id },
      data,
    })
    return this.toDomain(record)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({ where: { id } })
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.task.count({ where: { id } })
    return count > 0
  }

  private toDomain = (record: PrismaTask): Task => {
    return new Task({
      id: record.id,
      title: record.title,
      description: record.description ?? undefined,
      period: record.period as TaskPeriod,
      priority: record.priority as TaskPriority,
      timeLimitMinutes: record.timeLimitMinutes,
      scheduledAt: record.scheduledAt ?? undefined,
      dueDate: record.dueDate,
      completedAt: record.completedAt ?? undefined,
      status: record.status as TaskStatus,
      category: record.category as TaskCategory,
      isRecurring: record.isRecurring,
      recurringConfig: record.recurringConfig
        ? (JSON.parse(record.recurringConfig) as RecurringConfig)
        : undefined,
      tags: JSON.parse(record.tags) as string[],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }

  private toPrisma(task: Task) {
    return {
      id: task.id,
      title: task.title,
      description: task.description ?? null,
      period: task.period,
      priority: task.priority,
      timeLimitMinutes: task.timeLimitMinutes,
      scheduledAt: task.scheduledAt ?? null,
      dueDate: task.dueDate,
      completedAt: task.completedAt ?? null,
      status: task.status,
      category: task.category,
      isRecurring: task.isRecurring,
      recurringConfig: task.recurringConfig ? JSON.stringify(task.recurringConfig) : null,
      tags: JSON.stringify(task.tags),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }
  }

  private getPeriodRange(period: TaskPeriod, date: Date): { start: Date; end: Date } {
    const start = new Date(date)
    const end = new Date(date)

    if (period === 'daily') {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    } else if (period === 'weekly') {
      const dayOfWeek = start.getDay()
      start.setDate(start.getDate() - dayOfWeek)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    } else if (period === 'monthly') {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(end.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
    }

    return { start, end }
  }
}
