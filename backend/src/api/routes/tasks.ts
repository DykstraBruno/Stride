import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { CreateTask } from '../../application/use-cases/CreateTask'
import { CompleteTask } from '../../application/use-cases/CompleteTask'
import { UpdateTask } from '../../application/use-cases/UpdateTask'
import { DeleteTask } from '../../application/use-cases/DeleteTask'
import { GetTasksByPeriod } from '../../application/use-cases/GetTasksByPeriod'
import { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { createTaskSchema, updateTaskSchema, filterTasksSchema } from '../schemas/taskSchemas'
import { TaskPeriod } from '../../domain/entities/Task'

export function createTasksRouter(taskRepository: ITaskRepository): Router {
  const router = Router()

  // GET /tasks - list all tasks with optional filters
  router.get('/', async (req: Request, res: Response) => {
    try {
      const query = filterTasksSchema.parse(req.query)

      if (query.period && query.date) {
        const getByPeriod = new GetTasksByPeriod(taskRepository)
        const tasks = await getByPeriod.execute(query.period as TaskPeriod, new Date(query.date))
        return res.json(tasks.map((t) => t.toPlainObject()))
      }

      const filter = {
        period: query.period,
        status: query.status,
        category: query.category,
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
        dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      }

      const tasks = await taskRepository.findAll(filter)
      return res.json(tasks.map((t) => t.toPlainObject()))
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  // GET /tasks/:id
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const task = await taskRepository.findById(req.params.id)
      if (!task) return res.status(404).json({ error: 'Task not found' })
      return res.json(task.toPlainObject())
    } catch {
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  // POST /tasks
  router.post('/', async (req: Request, res: Response) => {
    try {
      const input = createTaskSchema.parse(req.body)
      const createTask = new CreateTask(taskRepository)
      const task = await createTask.execute(input)
      return res.status(201).json(task.toPlainObject())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  // PATCH /tasks/:id
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const input = updateTaskSchema.parse(req.body)
      const updateTask = new UpdateTask(taskRepository)
      const task = await updateTask.execute(req.params.id, input)
      return res.json(task.toPlainObject())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  // POST /tasks/:id/complete
  router.post('/:id/complete', async (req: Request, res: Response) => {
    try {
      const completeTask = new CompleteTask(taskRepository)
      const task = await completeTask.execute(req.params.id)
      return res.json(task.toPlainObject())
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  // POST /tasks/:id/start
  router.post('/:id/start', async (req: Request, res: Response) => {
    try {
      const task = await taskRepository.findById(req.params.id)
      if (!task) return res.status(404).json({ error: 'Task not found' })
      task.start()
      const updated = await taskRepository.update(task)
      return res.json(updated.toPlainObject())
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  // POST /tasks/:id/skip
  router.post('/:id/skip', async (req: Request, res: Response) => {
    try {
      const task = await taskRepository.findById(req.params.id)
      if (!task) return res.status(404).json({ error: 'Task not found' })
      task.skip()
      const updated = await taskRepository.update(task)
      return res.json(updated.toPlainObject())
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  // DELETE /tasks/:id
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const deleteTask = new DeleteTask(taskRepository)
      await deleteTask.execute(req.params.id)
      return res.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
