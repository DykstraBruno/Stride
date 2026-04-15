import { describe, it, expect, vi } from 'vitest'
import { DeleteTask } from './DeleteTask'
import { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { Task } from '../../domain/entities/Task'

const makeTask = (overrides = {}) =>
  new Task({
    id: 'task-1',
    title: 'Tarefa para deletar',
    period: 'daily',
    priority: 'low',
    timeLimitMinutes: 15,
    dueDate: new Date(Date.now() + 3600000),
    category: 'other',
    ...overrides,
  })

const makeRepo = (task: Task | null = makeTask()): ITaskRepository => ({
  findById:         vi.fn(async () => task),
  findAll:          vi.fn(),
  findByPeriod:     vi.fn(),
  save:             vi.fn(),
  update:           vi.fn(),
  delete:           vi.fn(async () => undefined),
  deleteByParentId: vi.fn(async () => undefined),
  existsById:       vi.fn(),
})

describe('DeleteTask use case', () => {
  it('should delete a regular (non-recurring) task', async () => {
    const repo    = makeRepo()
    const useCase = new DeleteTask(repo)

    await useCase.execute('task-1')

    expect(repo.delete).toHaveBeenCalledWith('task-1')
    expect(repo.deleteByParentId).not.toHaveBeenCalled()
  })

  it('should cascade-delete pending instances when deleting a recurring template', async () => {
    const template = makeTask({ isRecurring: true })
    const repo     = makeRepo(template)
    const useCase  = new DeleteTask(repo)

    await useCase.execute('task-1')

    expect(repo.deleteByParentId).toHaveBeenCalledWith('task-1')
    expect(repo.delete).toHaveBeenCalledWith('task-1')
  })

  it('should throw when task not found', async () => {
    const repo    = makeRepo(null)
    const useCase = new DeleteTask(repo)

    await expect(useCase.execute('ghost')).rejects.toThrow('Task not found: ghost')
    expect(repo.delete).not.toHaveBeenCalled()
  })
})
