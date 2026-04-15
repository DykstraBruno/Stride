import { describe, it, expect, vi } from 'vitest'
import { startOfDay, endOfDay } from 'date-fns'
import { GetTasksByPeriod } from './GetTasksByPeriod'
import { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { Task } from '../../domain/entities/Task'

const makeTask = (overrides = {}) =>
  new Task({
    title: 'Tarefa teste',
    period: 'daily',
    priority: 'medium',
    timeLimitMinutes: 30,
    dueDate: new Date(Date.now() + 3600000),
    category: 'work',
    ...overrides,
  })

const makeRepo = (tasks: Task[] = []): ITaskRepository => ({
  findById:         vi.fn(),
  findAll:          vi.fn(),
  findByPeriod:     vi.fn(async () => tasks),
  save:             vi.fn(),
  update:           vi.fn(),
  delete:           vi.fn(),
  deleteByParentId: vi.fn(),
  existsById:       vi.fn(),
})

describe('GetTasksByPeriod use case', () => {
  it('should return tasks for given period and date range', async () => {
    const tasks = [makeTask(), makeTask({ title: 'Outra tarefa' })]
    const repo  = makeRepo(tasks)
    const now   = new Date()

    const useCase = new GetTasksByPeriod(repo)
    const result  = await useCase.execute('daily', startOfDay(now), endOfDay(now))

    expect(repo.findByPeriod).toHaveBeenCalledWith('daily', expect.any(Date), expect.any(Date))
    expect(result).toHaveLength(2)
  })

  it('should sort tasks by priority (urgent first) then by scheduledAt', async () => {
    const now = new Date()
    const tasks = [
      makeTask({ title: 'Low prio',  priority: 'low',    scheduledAt: new Date(now.getTime() + 1000) }),
      makeTask({ title: 'Urgent',    priority: 'urgent', scheduledAt: new Date(now.getTime() + 2000) }),
      makeTask({ title: 'High prio', priority: 'high',   scheduledAt: new Date(now.getTime() + 3000) }),
    ]
    const repo    = makeRepo(tasks)
    const useCase = new GetTasksByPeriod(repo)
    const result  = await useCase.execute('daily', startOfDay(now), endOfDay(now))

    expect(result[0].title).toBe('Urgent')
    expect(result[1].title).toBe('High prio')
    expect(result[2].title).toBe('Low prio')
  })

  it('should sort equal-priority tasks by scheduledAt ascending', async () => {
    const base  = new Date()
    const tasks = [
      makeTask({ title: 'Segundo', priority: 'high', scheduledAt: new Date(base.getTime() + 5000) }),
      makeTask({ title: 'Primeiro', priority: 'high', scheduledAt: new Date(base.getTime() + 1000) }),
    ]
    const repo    = makeRepo(tasks)
    const useCase = new GetTasksByPeriod(repo)
    const result  = await useCase.execute('daily', startOfDay(base), endOfDay(base))

    expect(result[0].title).toBe('Primeiro')
    expect(result[1].title).toBe('Segundo')
  })

  it('should return empty array when no tasks exist', async () => {
    const repo    = makeRepo([])
    const now     = new Date()
    const useCase = new GetTasksByPeriod(repo)
    const result  = await useCase.execute('weekly', startOfDay(now), endOfDay(now))

    expect(result).toEqual([])
  })
})
