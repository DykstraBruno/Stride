import { Task, CreateTaskPayload, UpdateTaskPayload, TaskPeriod } from '../types/task'

const BASE_URL = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }))
    const detail = body.details
      ? ': ' + (body.details as Array<{ path: unknown[]; message: string }>)
          .map((d) => `${d.path.join('.')} — ${d.message}`)
          .join('; ')
      : ''
    throw new Error((body.error ?? `HTTP ${res.status}`) + detail)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// Tasks API
export const tasksApi = {
  getAll: (params?: { period?: TaskPeriod; date?: string; dateFrom?: string; dateTo?: string; status?: string }) => {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]).toString()
      : ''
    return request<Task[]>(`/tasks${qs}`)
  },

  getById: (id: string) => request<Task>(`/tasks/${id}`),

  create: (payload: CreateTaskPayload) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(payload) }),

  update: (id: string, payload: UpdateTaskPayload) =>
    request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  complete: (id: string) =>
    request<Task>(`/tasks/${id}/complete`, { method: 'POST' }),

  start: (id: string) =>
    request<Task>(`/tasks/${id}/start`, { method: 'POST' }),

  skip: (id: string) =>
    request<Task>(`/tasks/${id}/skip`, { method: 'POST' }),

  delete: (id: string) =>
    request<void>(`/tasks/${id}`, { method: 'DELETE' }),
}

// AI API
export interface AIAnalysis {
  suggestions: Array<{
    type: 'schedule' | 'priority' | 'break' | 'reminder' | 'reorder'
    message: string
    taskId?: string
    suggestedTime?: string
    suggestedPriority?: string
  }>
  overallFeedback: string
  missingEssentials: string[]
  estimatedLoadPercentage: number
}

export const aiApi = {
  chat: (message: string, includeContext = true) =>
    request<{ reply: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, includeContext }),
    }),

  /** Streaming chat via fetch + SSE. Calls onChunk for each text piece, returns full text. */
  chatStream: async (
    message: string,
    onChunk: (chunk: string) => void,
    includeContext = true,
  ): Promise<string> => {
    const res = await fetch('/api/ai/chat/stream', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message, includeContext }),
    })

    if (!res.ok || !res.body) {
      const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
    }

    const reader  = res.body.getReader()
    const decoder = new TextDecoder()
    let   full    = ''
    let   buf     = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''   // keep incomplete last line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const { type, payload } = JSON.parse(line.slice(6)) as {
            type: 'chunk' | 'done' | 'error'
            payload: unknown
          }
          if (type === 'chunk') {
            full += payload as string
            onChunk(payload as string)
          } else if (type === 'error') {
            throw new Error(payload as string)
          } else if (type === 'done') {
            return full
          }
        } catch (e) {
          if (e instanceof SyntaxError) continue
          throw e
        }
      }
    }
    return full
  },

  analyze: (date?: string) =>
    request<AIAnalysis>('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ date }),
    }),

  suggestOrder: () => request<Task[]>('/ai/suggest-order', { method: 'POST' }),
}
