import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CompleteTask } from './CompleteTask'
import { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { Task } from '../../domain/entities/Task'

const makeTask = (overrides = {}) =>
  new Task({
    id: 'task-1',
    title: 'Beber água',
    period: 'daily',
    priority: 'low',
    timeLimitMinutes: 5,
    dueDate: new Date(Date.now() + 3600000),
    category: 'health',
    ...overrides,
  })

const makeMockRepo = (task: Task | null = null): ITaskRepository => ({
  findById:         vi.fn(async () => task),
  findAll:          vi.fn(),
  findByPeriod:     vi.fn(),
  save:             vi.fn(),
  update:           vi.fn(async (t: Task) => t),
  delete:           vi.fn(),
  deleteByParentId: vi.fn(),
  existsById:       vi.fn(),
})

describe('CompleteTask use case', () => {
  it('should complete a pending task', async () => {
    const task = makeTask()
    const repo = makeMockRepo(task)
    const useCase = new CompleteTask(repo)

    const result = await useCase.execute('task-1')

    expect(result.status).toBe('completed')
    expect(result.completedAt).toBeDefined()
    expect(repo.update).toHaveBeenCalledWith(task)
  })

  it('should throw when task not found', async () => {
    const repo = makeMockRepo(null)
    const useCase = new CompleteTask(repo)

    await expect(useCase.execute('nonexistent')).rejects.toThrow('Task not found: nonexistent')
  })

  it('should throw when task is already completed', async () => {
    const task = makeTask({ status: 'completed' })
    const repo = makeMockRepo(task)
    const useCase = new CompleteTask(repo)

    await expect(useCase.execute('task-1')).rejects.toThrow('Task is already completed')
  })
})
