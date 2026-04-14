import 'dotenv/config'
import { createApp } from './app'
import { prisma } from '../infrastructure/database/prismaClient'
import { PrismaTaskRepository } from '../infrastructure/database/PrismaTaskRepository'
import { ClaudeAIService } from '../infrastructure/ai/ClaudeAIService'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001

async function main() {
  const taskRepository = new PrismaTaskRepository(prisma)

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    console.warn('⚠ ANTHROPIC_API_KEY not set — AI features will not work')
  }

  const aiService = new ClaudeAIService(anthropicKey ?? '')

  const app = createApp(taskRepository, aiService)

  app.listen(PORT, () => {
    console.log(`🚀 Stride API running on http://localhost:${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
