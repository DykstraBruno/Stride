import { Task } from '../types/task'

export const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Fazer exercício',
  description: undefined,
  period: 'daily',
  priority: 'medium',
  timeLimitMinutes: 60,
  scheduledAt: undefined,
  dueDate: new Date(Date.now() + 3600000).toISOString(),
  completedAt: undefined,
  status: 'pending',
  category: 'health',
  isRecurring: false,
  recurringConfig: undefined,
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})
