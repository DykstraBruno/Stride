import { Task } from '../../domain/entities/Task'

export interface AISuggestion {
  type: 'schedule' | 'priority' | 'break' | 'reminder' | 'reorder'
  message: string
  taskId?: string
  suggestedTime?: string
  suggestedPriority?: string
}

export interface AIScheduleAnalysis {
  suggestions: AISuggestion[]
  overallFeedback: string
  missingEssentials: string[]  // e.g. "refeição", "banho", "lazer"
  estimatedLoadPercentage: number
}

export interface IAIAssistantService {
  analyzeSchedule(tasks: Task[], date: Date): Promise<AIScheduleAnalysis>
  suggestTaskOrder(tasks: Task[]): Promise<Task[]>
  chat(userMessage: string, context: Task[]): Promise<string>
  /** Optional — implemented by services that support streaming */
  streamChat?(userMessage: string, context: Task[]): AsyncGenerator<string>
}
