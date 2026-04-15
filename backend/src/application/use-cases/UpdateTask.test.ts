import { describe, it, expect, vi } from 'vitest'
import { UpdateTask, UpdateTaskInput } from './UpdateTask'
import { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { Task } from '../../domain/entities/Task'

const makeTask = () =>
  new Task({
    id: 'task-1',
    title: 'Estudar TypeScript',
    period: 'daily',
    priority: 'medium',
    timeLimitMinutes: 90,
    dueDate: new Date(Date.now() + 3600000),
    category: 'work',
  })

describe('UpdateTask use case', () => {
  const makeRepo = (task: Task | null = makeTask()): ITaskRepository => ({
    findById:         vi.fn(async () => task),
    findAll:          vi.fn(),
    findByPeriod:     vi.fn(),
    save:             vi.fn(),
    update:           vi.fn(async (t: Task) => t),
    delete:           vi.fn(),
    deleteByParentId: vi.fn(),
    existsById:       vi.fn(),
  })

  it('should update task fields', async () => {
    const repo    = makeRepo()
    const useCase = new UpdateTask(repo)
    const result  = await useCase.execute('task-1', { title: 'Estudar Vitest', priority: 'high' })

    expect(result.title).toBe('Estudar Vitest')
    expect(result.priority).toBe('high')
    expect(repo.update).toHaveBeenCalledOnce()
  })

  it('should throw when task not found', async () => {
    const repo    = makeRepo(null)
    const useCase = new UpdateTask(repo)

    await expect(useCase.execute('missing', { title: 'Novo título' })).rejects.toThrow(
      'Task not found: missing',
    )
  })

  it('should throw when updating title to empty string', async () => {
    const repo    = makeRepo()
    const useCase = new UpdateTask(repo)

    await expect(useCase.execute('task-1', { title: '' })).rejects.toThrow(
      'Task title cannot be empty',
    )
  })

  it('should update category and timeLimitMinutes', async () => {
    const repo    = makeRepo()
    const useCase = new UpdateTask(repo)
    const result  = await useCase.execute('task-1', { category: 'health', timeLimitMinutes: 45 })

    expect(result.category).toBe('health')
    expect(result.timeLimitMinutes).toBe(45)
  })
})
