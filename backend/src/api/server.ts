import 'dotenv/config'
import { createApp } from './app'
import { prisma } from '../infrastructure/database/prismaClient'
import { PrismaTaskRepository } from '../infrastructure/database/PrismaTaskRepository'
import { GroqAIService } from '../infrastructure/ai/GroqAIService'

const PORT       = process.env.PORT       ? parseInt(process.env.PORT) : 3001
const GROQ_KEY   = process.env.GROQ_API_KEY ?? ''
const GROQ_MODEL = process.env.GROQ_MODEL  ?? 'llama-3.1-8b-instant'

if (!GROQ_KEY) {
  console.error('❌  GROQ_API_KEY não definida no .env — obtenha em https://console.groq.com')
  process.exit(1)
}

console.log(`🔑 GROQ_API_KEY carregada: ${GROQ_KEY.slice(0, 8)}...${GROQ_KEY.slice(-4)}`)

async function main() {
  const taskRepository = new PrismaTaskRepository(prisma)
  const aiService      = new GroqAIService(GROQ_KEY, GROQ_MODEL)

  const app = createApp(taskRepository, aiService)

  app.listen(PORT, () => {
    console.log(`🚀 Stride API running on http://localhost:${PORT} — schema v2`)
    console.log(`🤖 AI: Groq — model: ${GROQ_MODEL}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
