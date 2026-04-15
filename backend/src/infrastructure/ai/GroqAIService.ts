import { Task } from '../../domain/entities/Task'
import {
  IAIAssistantService,
  AIScheduleAnalysis,
} from '../../application/services/AIAssistantService'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SYSTEM_PROMPT = `Você é o Stride AI, assistente de produtividade. Responda em português, de forma curta e prática.
Lembre sempre de refeições, higiene, pausas e lazer. Máximo 8-10h trabalho/dia.`

export class GroqAIService implements IAIAssistantService {
  constructor(
    private readonly apiKey: string,
    private readonly model = 'llama-3.1-8b-instant',
  ) {}

  private buildMessages(userContent: string) {
    return [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userContent   },
    ]
  }

  private async callGroq(userContent: string): Promise<string> {
    let res: Response
    try {
      res = await fetch(GROQ_API_URL, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model:    this.model,
          messages: this.buildMessages(userContent),
          stream:   false,
        }),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`Groq inacessível — ${msg}`)
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Groq HTTP ${res.status}: ${body}`)
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>
      error?: { message: string }
    }
    if (data.error) throw new Error(`Groq: ${data.error.message}`)
    return data.choices[0]?.message?.content ?? ''
  }

  async *streamChat(
    userMessage: string,
    context: Task[],
  ): AsyncGenerator<string> {
    const ctx = context.length > 0
      ? `\nTarefas de hoje:\n${this.formatTasksForAI(this.filterContext(context))}\n`
      : ''

    let res: Response
    try {
      res = await fetch(GROQ_API_URL, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model:    this.model,
          messages: this.buildMessages(`${ctx}\n${userMessage}`),
          stream:   true,
        }),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`Groq inacessível — ${msg}`)
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Groq HTTP ${res.status}: ${body}`)
    }

    if (!res.body) throw new Error('Groq: no response body')

    const reader  = res.body.getReader()
    const decoder = new TextDecoder()
    let   buf     = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (payload === '[DONE]') return

        try {
          const json = JSON.parse(payload) as {
            choices: Array<{ delta: { content?: string }; finish_reason: string | null }>
          }
          const content = json.choices[0]?.delta?.content
          if (content) yield content
          if (json.choices[0]?.finish_reason === 'stop') return
        } catch {
          // skip malformed lines
        }
      }
    }
  }

  async analyzeSchedule(tasks: Task[], date: Date): Promise<AIScheduleAnalysis> {
    const prompt = `Analise a agenda para ${this.formatDate(date)}:

${this.formatTasksForAI(tasks)}

Responda APENAS com JSON neste formato exato:
{
  "suggestions": [{"type": "reminder", "message": "texto"}],
  "overallFeedback": "avaliação geral em 2-3 frases",
  "missingEssentials": ["refeição", "banho"],
  "estimatedLoadPercentage": 60
}`

    const raw = await this.callGroq(prompt)

    try {
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('no JSON')
      return JSON.parse(match[0]) as AIScheduleAnalysis
    } catch {
      return {
        suggestions:             [{ type: 'reminder', message: raw.trim() }],
        overallFeedback:         'Análise concluída.',
        missingEssentials:       [],
        estimatedLoadPercentage: 50,
      }
    }
  }

  async suggestTaskOrder(tasks: Task[]): Promise<Task[]> {
    if (tasks.length === 0) return tasks

    const list = tasks
      .map((t, i) => `${i}: [${t.id}] "${t.title}" prio:${t.priority} dur:${t.timeLimitMinutes}min`)
      .join('\n')

    const raw = await this.callGroq(
      `Reordene para melhor produtividade. Responda APENAS com array JSON de IDs:\n${list}`,
    )

    try {
      const match = raw.match(/\[[\s\S]*\]/)
      if (!match) return tasks
      const ids = JSON.parse(match[0]) as string[]
      const map = new Map(tasks.map((t) => [t.id, t]))
      return ids.map((id) => map.get(id)).filter(Boolean) as Task[]
    } catch {
      return tasks
    }
  }

  async chat(userMessage: string, context: Task[]): Promise<string> {
    const ctx = context.length > 0
      ? `\nTarefas de hoje:\n${this.formatTasksForAI(this.filterContext(context))}\n`
      : ''
    return this.callGroq(`${ctx}\n${userMessage}`)
  }

  private filterContext(tasks: Task[]): Task[] {
    return tasks
      .filter((t) => t.status === 'pending' || t.status === 'in_progress')
      .slice(0, 5)
  }

  private formatTasksForAI(tasks: Task[]): string {
    if (tasks.length === 0) return 'Nenhuma tarefa.'
    return tasks.map((t) => {
      const hora = t.scheduledAt
        ? `${new Date(t.scheduledAt).getHours().toString().padStart(2, '0')}:${new Date(t.scheduledAt).getMinutes().toString().padStart(2, '0')}`
        : '--:--'
      const s = t.status === 'in_progress' ? '▶' : t.status === 'overdue' ? '⚠' : '○'
      return `${s} ${t.title} (${t.priority},${t.timeLimitMinutes}m,${hora})`
    }).join('\n')
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  }
}
