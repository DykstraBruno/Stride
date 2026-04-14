import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Task, TaskProps } from './Task'

const makeTaskProps = (overrides: Partial<TaskProps> = {}): TaskProps => ({
  title: 'Fazer exercício',
  period: 'daily',
  priority: 'medium',
  timeLimitMinutes: 60,
  dueDate: new Date(Date.now() + 3600000),
  category: 'health',
  ...overrides,
})

describe('Task entity', () => {
  describe('creation', () => {
    it('should create a task with valid props', () => {
      const task = new Task(makeTaskProps())

      expect(task.id).toBeDefined()
      expect(task.title).toBe('Fazer exercício')
      expect(task.status).toBe('pending')
      expect(task.isRecurring).toBe(false)
      expect(task.tags).toEqual([])
    })

    it('should trim whitespace from title', () => {
      const task = new Task(makeTaskProps({ title: '  Reunião diária  ' }))
      expect(task.title).toBe('Reunião diária')
    })

    it('should use provided id when given', () => {
      const task = new Task(makeTaskProps({ id: 'custom-id-123' }))
      expect(task.id).toBe('custom-id-123')
    })

    it('should set createdAt and updatedAt automatically', () => {
      const before = new Date()
      const task = new Task(makeTaskProps())
      const after = new Date()

      expect(task.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(task.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should throw when title is empty', () => {
      expect(() => new Task(makeTaskProps({ title: '' }))).toThrow('Task title cannot be empty')
    })

    it('should throw when title is only whitespace', () => {
      expect(() => new Task(makeTaskProps({ title: '   ' }))).toThrow('Task title cannot be empty')
    })

    it('should throw when title exceeds 200 characters', () => {
      const longTitle = 'a'.repeat(201)
      expect(() => new Task(makeTaskProps({ title: longTitle }))).toThrow(
        'Task title cannot exceed 200 characters',
      )
    })

    it('should throw when timeLimitMinutes is zero', () => {
      expect(() => new Task(makeTaskProps({ timeLimitMinutes: 0 }))).toThrow(
        'Time limit must be a positive integer',
      )
    })

    it('should throw when timeLimitMinutes is negative', () => {
      expect(() => new Task(makeTaskProps({ timeLimitMinutes: -10 }))).toThrow(
        'Time limit must be a positive integer',
      )
    })

    it('should throw when timeLimitMinutes exceeds 1440', () => {
      expect(() => new Task(makeTaskProps({ timeLimitMinutes: 1441 }))).toThrow(
        'Time limit cannot exceed 1440 minutes',
      )
    })

    it('should throw when dueDate is invalid', () => {
      expect(() => new Task(makeTaskProps({ dueDate: new Date('invalid') }))).toThrow(
        'Due date must be a valid Date',
      )
    })
  })

  describe('lifecycle transitions', () => {
    it('should transition to in_progress on start()', () => {
      const task = new Task(makeTaskProps())
      task.start()
      expect(task.status).toBe('in_progress')
    })

    it('should throw when starting a non-pending task', () => {
      const task = new Task(makeTaskProps())
      task.start()
      expect(() => task.start()).toThrow('Cannot start a task with status "in_progress"')
    })

    it('should transition to completed and set completedAt on complete()', () => {
      const before = new Date()
      const task = new Task(makeTaskProps())
      task.complete()

      expect(task.status).toBe('completed')
      expect(task.completedAt).toBeDefined()
      expect(task.completedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime())
    })

    it('should throw when completing an already completed task', () => {
      const task = new Task(makeTaskProps())
      task.complete()
      expect(() => task.complete()).toThrow('Task is already completed')
    })

    it('should transition to skipped on skip()', () => {
      const task = new Task(makeTaskProps())
      task.skip()
      expect(task.status).toBe('skipped')
    })

    it('should throw when skipping a completed task', () => {
      const task = new Task(makeTaskProps())
      task.complete()
      expect(() => task.skip()).toThrow('Cannot skip a completed task')
    })

    it('should transition to overdue on markOverdue()', () => {
      const task = new Task(makeTaskProps())
      task.markOverdue()
      expect(task.status).toBe('overdue')
    })

    it('should not mark overdue if already completed', () => {
      const task = new Task(makeTaskProps())
      task.complete()
      task.markOverdue()
      expect(task.status).toBe('completed')
    })
  })

  describe('isOverdue()', () => {
    it('should return true when past dueDate and not completed', () => {
      const pastDate = new Date(Date.now() - 1000)
      const task = new Task(makeTaskProps({ dueDate: pastDate }))
      expect(task.isOverdue()).toBe(true)
    })

    it('should return false when before dueDate', () => {
      const futureDate = new Date(Date.now() + 60000)
      const task = new Task(makeTaskProps({ dueDate: futureDate }))
      expect(task.isOverdue()).toBe(false)
    })

    it('should return false when completed even if past dueDate', () => {
      const pastDate = new Date(Date.now() - 1000)
      const task = new Task(makeTaskProps({ dueDate: pastDate }))
      task.complete()
      expect(task.isOverdue()).toBe(false)
    })
  })

  describe('getRemainingMinutes()', () => {
    it('should return positive minutes when due date is in the future', () => {
      const dueDate = new Date(Date.now() + 120 * 60000)
      const task = new Task(makeTaskProps({ dueDate }))
      const remaining = task.getRemainingMinutes()
      expect(remaining).toBeGreaterThan(119)
      expect(remaining).toBeLessThanOrEqual(120)
    })

    it('should return negative minutes when overdue', () => {
      const dueDate = new Date(Date.now() - 30 * 60000)
      const task = new Task(makeTaskProps({ dueDate }))
      expect(task.getRemainingMinutes()).toBeLessThan(0)
    })
  })

  describe('toPlainObject()', () => {
    it('should serialize task to a plain object', () => {
      const task = new Task(makeTaskProps({ description: 'Detalhes', tags: ['saúde'] }))
      const plain = task.toPlainObject()

      expect(plain.id).toBe(task.id)
      expect(plain.title).toBe('Fazer exercício')
      expect(plain.description).toBe('Detalhes')
      expect(plain.tags).toEqual(['saúde'])
    })
  })
})
