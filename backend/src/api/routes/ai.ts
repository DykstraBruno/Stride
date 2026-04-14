import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { IAIAssistantService } from '../../application/services/AIAssistantService'
import { ITaskRepository } from '../../domain/repositories/ITaskRepository'

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  includeContext: z.boolean().optional().default(true),
})

const analyzeSchema = z.object({
  date: z.string().optional(),
})

export function createAIRouter(
  aiService: IAIAssistantService,
  taskRepository: ITaskRepository,
): Router {
  const router = Router()

  // POST /ai/chat - chat with AI assistant
  router.post('/chat', async (req: Request, res: Response) => {
    try {
      const { message, includeContext } = chatSchema.parse(req.body)

      let context = []
      if (includeContext) {
        context = await taskRepository.findByPeriod('daily', new Date())
      }

      const reply = await aiService.chat(message, context)
      return res.json({ reply })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  // POST /ai/analyze - analyze today's schedule
  router.post('/analyze', async (req: Request, res: Response) => {
    try {
      const { date: dateStr } = analyzeSchema.parse(req.body)
      const date = dateStr ? new Date(dateStr) : new Date()

      const tasks = await taskRepository.findByPeriod('daily', date)
      const analysis = await aiService.analyzeSchedule(tasks, date)

      return res.json(analysis)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  // POST /ai/suggest-order - get AI-suggested task order
  router.post('/suggest-order', async (req: Request, res: Response) => {
    try {
      const date = new Date()
      const tasks = await taskRepository.findByPeriod('daily', date)
      const ordered = await aiService.suggestTaskOrder(tasks)

      return res.json(ordered.map((t) => t.toPlainObject()))
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
