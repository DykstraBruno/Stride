import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GenerateRecurringInstances } from './GenerateRecurringInstances'
import { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { Task } from '../../domain/entities/Task'

const makeTemplate = (overrides = {}) =>
  new Task({
    id: 'template-1',
    title: 'Exercício matinal',
    period: 'daily',
    priority: 'high',
    timeLimitMinutes: 45,
    dueDate: new Date(Date.now() + 3600000),
    category: 'health',
    isRecurring: true,
    recurringConfig: { frequency: 'daily', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
    ...overrides,
  })

const makeRepo = (): ITaskRepository => ({
  findById:         vi.fn(),
  findAll:          vi.fn(),
  findByPeriod:     vi.fn(),
  save:             vi.fn(async (t: Task) => t),
  update:           vi.fn(),
  delete:           vi.fn(),
  deleteByParentId: vi.fn(async () => undefined),
  existsById:       vi.fn(),
})

describe('GenerateRecurringInstances use case', () => {
  let repo: ITaskRepository

  beforeEach(() => {
    repo = makeRepo()
  })

  it('should delete existing pending instances before regenerating', async () => {
    const template = makeTemplate()
    await new GenerateRecurringInstances(repo).execute(template)

    expect(repo.deleteByParentId).toHaveBeenCalledWith('template-1')
  })

  it('should create instances only for matching days of week', async () => {
    // Only Monday (1) and Wednesday (3)
    const template = makeTemplate({
      recurringConfig: { frequency: 'daily', daysOfWeek: [1, 3] },
    })

    await new GenerateRecurringInstances(repo).execute(template)

    const saved = (repo.save as ReturnType<typeof vi.fn>).mock.calls.map(
      ([task]: [Task]) => task,
    )

    // Every saved instance must have been created on a Mon or Wed
    for (const instance of saved) {
      const day = new Date(instance.scheduledAt ?? instance.dueDate).getDay()
      expect([1, 3]).toContain(day)
    }
  })

  it('should create instances with recurringParentId pointing to template', async () => {
    const template = makeTemplate()
    await new GenerateRecurringInstances(repo).execute(template)

    const saved = (repo.save as ReturnType<typeof vi.fn>).mock.calls.map(
      ([task]: [Task]) => task,
    )

    expect(saved.length).toBeGreaterThan(0)
    for (const instance of saved) {
      expect(instance.recurringParentId).toBe('template-1')
      expect(instance.isRecurring).toBe(false)
    }
  })

  it('should preserve time-of-day from template scheduledAt on each instance', async () => {
    const scheduledAt = new Date()
    scheduledAt.setHours(7, 30, 0, 0)

    const template = makeTemplate({ scheduledAt })
    await new GenerateRecurringInstances(repo).execute(template)

    const saved = (repo.save as ReturnType<typeof vi.fn>).mock.calls.map(
      ([task]: [Task]) => task,
    )

    for (const instance of saved) {
      expect(instance.scheduledAt).toBeDefined()
      expect(instance.scheduledAt!.getHours()).toBe(7)
      expect(instance.scheduledAt!.getMinutes()).toBe(30)
    }
  })

  it('should calculate dueDate as scheduledAt + timeLimitMinutes', async () => {
    const scheduledAt = new Date()
    scheduledAt.setHours(8, 0, 0, 0)

    const template = makeTemplate({ scheduledAt, timeLimitMinutes: 60 })
    await new GenerateRecurringInstances(repo).execute(template)

    const saved = (repo.save as ReturnType<typeof vi.fn>).mock.calls.map(
      ([task]: [Task]) => task,
    )

    for (const instance of saved) {
      const diff = instance.dueDate.getTime() - instance.scheduledAt!.getTime()
      expect(diff).toBe(60 * 60_000)
    }
  })

  it('should do nothing when daysOfWeek is empty', async () => {
    const template = makeTemplate({
      recurringConfig: { frequency: 'daily', daysOfWeek: [] },
    })

    await new GenerateRecurringInstances(repo).execute(template)

    expect(repo.deleteByParentId).not.toHaveBeenCalled()
    expect(repo.save).not.toHaveBeenCalled()
  })

  it('should do nothing when recurringConfig is undefined', async () => {
    const template = makeTemplate({ recurringConfig: undefined })

    await new GenerateRecurringInstances(repo).execute(template)

    expect(repo.save).not.toHaveBeenCalled()
  })

  it('should generate instances within the next 28 days', async () => {
    const template = makeTemplate()
    await new GenerateRecurringInstances(repo).execute(template)

    const saved = (repo.save as ReturnType<typeof vi.fn>).mock.calls.map(
      ([task]: [Task]) => task,
    )

    const today    = new Date(); today.setHours(0, 0, 0, 0)
    const maxLimit = new Date(today); maxLimit.setDate(today.getDate() + 28)

    for (const instance of saved) {
      const d = instance.scheduledAt ?? instance.dueDate
      expect(d.getTime()).toBeGreaterThanOrEqual(today.getTime())
      expect(d.getTime()).toBeLessThan(maxLimit.getTime())
    }
  })
})
