import { describe, it, expect, beforeEach, vi } from 'vitest'
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

describe('GetTasksByPeriod use case', () => {
  it('should return tasks for given period and date', async () => {
    const tasks = [makeTask(), makeTask({ title: 'Outra tarefa' })]
    const repo: ITaskRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByPeriod: vi.fn(async () => tasks),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      existsById: vi.fn(),
    }

    const useCase = new GetTasksByPeriod(repo)
    const result = await useCase.execute('daily', new Date())

    expect(repo.findByPeriod).toHaveBeenCalledWith('daily', expect.any(Date))
    expect(result).toHaveLength(2)
  })

  it('should sort tasks by priority (urgent first) then by scheduledAt', async () => {
    const tasks = [
      makeTask({ title: 'Low prio', priority: 'low' }),
      makeTask({ title: 'Urgent', priority: 'urgent' }),
      makeTask({ title: 'High prio', priority: 'high' }),
    ]
    const repo: ITaskRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByPeriod: vi.fn(async () => tasks),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      existsById: vi.fn(),
    }

    const useCase = new GetTasksByPeriod(repo)
    const result = await useCase.execute('daily', new Date())

    expect(result[0].title).toBe('Urgent')
    expect(result[1].title).toBe('High prio')
    expect(result[2].title).toBe('Low prio')
  })

  it('should return empty array when no tasks exist', async () => {
    const repo: ITaskRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByPeriod: vi.fn(async () => []),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      existsById: vi.fn(),
    }

    const useCase = new GetTasksByPeriod(repo)
    const result = await useCase.execute('weekly', new Date())

    expect(result).toEqual([])
  })
})
