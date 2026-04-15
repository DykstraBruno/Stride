import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { IAIAssistantService } from '../../application/services/AIAssistantService'
import { ITaskRepository } from '../../domain/repositories/ITaskRepository'

const chatSchema = z.object({
  message:        z.string().min(1).max(2000),
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

  // POST /ai/chat — non-streaming fallback
  router.post('/chat', async (req: Request, res: Response) => {
    try {
      const { message, includeContext } = chatSchema.parse(req.body)
      const context = includeContext
        ? await taskRepository.findByPeriod('daily', new Date())
        : []
      const reply = await aiService.chat(message, context)
      return res.json({ reply })
    } catch (error) {
      if (error instanceof z.ZodError)
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      if (error instanceof Error)
        return res.status(500).json({ error: error.message })
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  // POST /ai/chat/stream — fetch-based SSE streaming
  router.post('/chat/stream', async (req: Request, res: Response) => {
    const schema = z.object({
      message:        z.string().min(1).max(2000),
      includeContext: z.boolean().optional().default(true),
    })

    let message: string
    let includeContext: boolean
    try {
      const parsed = schema.parse(req.body)
      message        = parsed.message
      includeContext = parsed.includeContext
    } catch (err) {
      res.status(400).json({ error: 'Invalid request' })
      return
    }

    if (!aiService.streamChat) {
      res.status(501).json({ error: 'Streaming not supported by current AI provider' })
      return
    }

    const context = includeContext
      ? await taskRepository.findByPeriod('daily', new Date()).catch(() => [])
      : []

    res.setHeader('Content-Type',      'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control',     'no-cache, no-transform')
    res.setHeader('Connection',        'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    const write = (type: string, payload: unknown) => {
      res.write(`data: ${JSON.stringify({ type, payload })}\n\n`)
    }

    try {
      for await (const chunk of aiService.streamChat!(message, context)) {
        if (res.writableEnded) break
        write('chunk', chunk)
      }
      write('done', null)
    } catch (err) {
      write('error', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      res.end()
    }
  })

  // POST /ai/analyze
  router.post('/analyze', async (req: Request, res: Response) => {
    try {
      const { date: dateStr } = analyzeSchema.parse(req.body)
      const date = dateStr ? new Date(dateStr) : new Date()
      const tasks = await taskRepository.findByPeriod('daily', date)
      const analysis = await aiService.analyzeSchedule(tasks, date)
      return res.json(analysis)
    } catch (error) {
      if (error instanceof Error)
        return res.status(500).json({ error: error.message })
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  // POST /ai/suggest-order
  router.post('/suggest-order', async (req: Request, res: Response) => {
    try {
      const tasks = await taskRepository.findByPeriod('daily', new Date())
      const ordered = await aiService.suggestTaskOrder(tasks)
      return res.json(ordered.map((t) => t.toPlainObject()))
    } catch (error) {
      if (error instanceof Error)
        return res.status(500).json({ error: error.message })
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
