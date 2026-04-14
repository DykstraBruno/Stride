import express from 'express'
import cors from 'cors'
import { createTasksRouter } from './routes/tasks'
import { createAIRouter } from './routes/ai'
import { ITaskRepository } from '../domain/repositories/ITaskRepository'
import { IAIAssistantService } from '../application/services/AIAssistantService'

export function createApp(
  taskRepository: ITaskRepository,
  aiService: IAIAssistantService,
) {
  const app = express()

  app.use(cors())
  app.use(express.json())

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Routes
  app.use('/api/tasks', createTasksRouter(taskRepository))
  app.use('/api/ai', createAIRouter(aiService, taskRepository))

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' })
  })

  // Error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack)
    res.status(500).json({ error: 'Internal server error' })
  })

  return app
}
