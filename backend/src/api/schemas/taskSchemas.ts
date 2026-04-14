import { z } from 'zod'

const periodSchema = z.enum(['daily', 'weekly', 'monthly'])
const prioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])
const categorySchema = z.enum(['work', 'personal', 'health', 'leisure', 'household', 'food', 'hygiene', 'other'])
const statusSchema = z.enum(['pending', 'in_progress', 'completed', 'overdue', 'skipped'])

const recurringConfigSchema = z.object({
  frequency: periodSchema,
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  timeOfDay: z.string().regex(/^\d{2}:\d{2}$/).optional(),
})

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  period: periodSchema,
  priority: prioritySchema,
  timeLimitMinutes: z.number().int().min(1).max(1440),
  scheduledAt: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  dueDate: z.string().datetime().transform(v => new Date(v)),
  category: categorySchema,
  isRecurring: z.boolean().optional().default(false),
  recurringConfig: recurringConfigSchema.optional(),
  tags: z.array(z.string()).optional().default([]),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  period: periodSchema.optional(),
  priority: prioritySchema.optional(),
  timeLimitMinutes: z.number().int().min(1).max(1440).optional(),
  scheduledAt: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  dueDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  category: categorySchema.optional(),
  isRecurring: z.boolean().optional(),
  recurringConfig: recurringConfigSchema.optional(),
  tags: z.array(z.string()).optional(),
})

export const filterTasksSchema = z.object({
  period: periodSchema.optional(),
  status: statusSchema.optional(),
  category: categorySchema.optional(),
  date: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export type CreateTaskDTO = z.infer<typeof createTaskSchema>
export type UpdateTaskDTO = z.infer<typeof updateTaskSchema>
export type FilterTasksDTO = z.infer<typeof filterTasksSchema>
