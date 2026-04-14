import Anthropic from '@anthropic-ai/sdk'
import { Task } from '../../domain/entities/Task'
import { IAIAssistantService, AIScheduleAnalysis, AISuggestion } from '../../application/services/AIAssistantService'

const SYSTEM_PROMPT = `Você é o Stride AI, um assistente inteligente de organização de tarefas e produtividade.
Sua missão é ajudar o usuário a organizar seu tempo de forma equilibrada e saudável.

Diretrizes fundamentais:
1. SEMPRE verifique se há tempo reservado para refeições (café da manhã, almoço, jantar - mínimo 20min cada)
2. SEMPRE verifique se há tempo para higiene pessoal (banho, etc. - mínimo 15min)
3. LEMBRE o usuário de incluir pausas e tempo de lazer para evitar esgotamento
4. CONSIDERE afazeres domésticos quando relevante (limpeza, cozinha, etc.)
5. PRIORIZE tarefas urgentes mas sem ignorar bem-estar
6. EVITE sobrecarregar o usuário - um dia produtivo tem no máximo 8-10h de trabalho focado
7. SUGIRA horários realistas baseados nas tarefas existentes
8. Seja encorajador e prático, não apenas crítico

Ao analisar uma agenda:
- Identifique lacunas onde essenciais humanos estão faltando
- Sugira reordenação quando fizer sentido (ex: não coloque trabalho intenso logo após acordar sem café da manhã)
- Identifique tarefas que podem ser agrupadas para eficiência
- Alerte sobre procrastinação quando tarefas importantes estão atrasadas

Responda sempre em português brasileiro, de forma concisa e prática.`

export class ClaudeAIService implements IAIAssistantService {
  private readonly client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async analyzeSchedule(tasks: Task[], date: Date): Promise<AIScheduleAnalysis> {
    const tasksSummary = this.formatTasksForAI(tasks, date)

    const prompt = `Analise a seguinte agenda para ${this.formatDate(date)}:

${tasksSummary}

Responda em formato JSON com a seguinte estrutura:
{
  "suggestions": [
    {
      "type": "schedule|priority|break|reminder|reorder",
      "message": "mensagem clara e actionável",
      "taskId": "id da tarefa relacionada (opcional)",
      "suggestedTime": "HH:MM (opcional)",
      "suggestedPriority": "low|medium|high|urgent (opcional)"
    }
  ],
  "overallFeedback": "avaliação geral da agenda em 2-3 frases",
  "missingEssentials": ["lista de essenciais ausentes, ex: refeição, banho, lazer"],
  "estimatedLoadPercentage": número de 0 a 100 representando a carga do dia
}`

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') throw new Error('Unexpected AI response type')

    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found in response')
      return JSON.parse(jsonMatch[0]) as AIScheduleAnalysis
    } catch {
      return {
        suggestions: [
          {
            type: 'reminder',
            message: content.text,
          },
        ],
        overallFeedback: 'Análise concluída.',
        missingEssentials: [],
        estimatedLoadPercentage: 50,
      }
    }
  }

  async suggestTaskOrder(tasks: Task[]): Promise<Task[]> {
    if (tasks.length === 0) return tasks

    const tasksSummary = tasks
      .map(
        (t, i) =>
          `${i}: [${t.id}] "${t.title}" - prioridade: ${t.priority}, duração: ${t.timeLimitMinutes}min, categoria: ${t.category}`,
      )
      .join('\n')

    const prompt = `Reordene as seguintes tarefas de forma otimizada para produtividade e bem-estar:

${tasksSummary}

Responda com apenas um array JSON de IDs na ordem sugerida, exemplo: ["id1", "id2", "id3"]`

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') return tasks

    try {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) return tasks

      const orderedIds = JSON.parse(jsonMatch[0]) as string[]
      const taskMap = new Map(tasks.map((t) => [t.id, t]))
      return orderedIds.map((id) => taskMap.get(id)).filter(Boolean) as Task[]
    } catch {
      return tasks
    }
  }

  async chat(userMessage: string, context: Task[]): Promise<string> {
    const contextSummary =
      context.length > 0
        ? `\n\nContexto atual do usuário (tarefas de hoje):\n${this.formatTasksForAI(context, new Date())}`
        : ''

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage + contextSummary,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') return 'Desculpe, não consegui processar sua mensagem.'
    return content.text
  }

  private formatTasksForAI(tasks: Task[], date: Date): string {
    if (tasks.length === 0) return 'Nenhuma tarefa agendada.'

    return tasks
      .map((t) => {
        const scheduled = t.scheduledAt
          ? `às ${t.scheduledAt.getHours().toString().padStart(2, '0')}:${t.scheduledAt.getMinutes().toString().padStart(2, '0')}`
          : 'sem horário definido'
        const status = t.status === 'completed' ? '✓' : t.status === 'overdue' ? '⚠ ATRASADA' : '○'
        return `${status} [${t.id}] "${t.title}" | ${t.priority.toUpperCase()} | ${t.timeLimitMinutes}min | ${scheduled} | ${t.category}`
      })
      .join('\n')
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
}
