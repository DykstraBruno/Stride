import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CreateTask, CreateTaskInput } from './CreateTask'
import { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { Task } from '../../domain/entities/Task'

const makeMockRepo = (): ITaskRepository => ({
  findById: vi.fn(),
  findAll: vi.fn(),
  findByPeriod: vi.fn(),
  save: vi.fn(async (task: Task) => task),
  update: vi.fn(),
  delete: vi.fn(),
  existsById: vi.fn(),
})

const makeInput = (overrides: Partial<CreateTaskInput> = {}): CreateTaskInput => ({
  title: 'Meditar',
  period: 'daily',
  priority: 'medium',
  timeLimitMinutes: 20,
  dueDate: new Date(Date.now() + 3600000),
  category: 'health',
  ...overrides,
})

describe('CreateTask use case', () => {
  let repo: ITaskRepository
  let createTask: CreateTask

  beforeEach(() => {
    repo = makeMockRepo()
    createTask = new CreateTask(repo)
  })

  it('should create and persist a new task', async () => {
    const task = await createTask.execute(makeInput())

    expect(repo.save).toHaveBeenCalledOnce()
    expect(task.title).toBe('Meditar')
    expect(task.status).toBe('pending')
    expect(task.timeLimitMinutes).toBe(20)
  })

  it('should return a Task instance with generated id', async () => {
    const task = await createTask.execute(makeInput())
    expect(task.id).toBeDefined()
    expect(task.id.length).toBeGreaterThan(0)
  })

  it('should propagate domain validation errors', async () => {
    await expect(createTask.execute(makeInput({ title: '' }))).rejects.toThrow(
      'Task title cannot be empty',
    )
    expect(repo.save).not.toHaveBeenCalled()
  })

  it('should create a recurring task with config', async () => {
    const task = await createTask.execute(
      makeInput({
        isRecurring: true,
        recurringConfig: { frequency: 'daily', timeOfDay: '07:00' },
      }),
    )

    expect(task.isRecurring).toBe(true)
    expect(task.recurringConfig?.timeOfDay).toBe('07:00')
  })

  it('should create a task with tags', async () => {
    const task = await createTask.execute(makeInput({ tags: ['manhã', 'foco'] }))
    expect(task.tags).toEqual(['manhã', 'foco'])
  })
})
