import { Task, CreateTaskPayload, UpdateTaskPayload, TaskPeriod } from '../types/task'

const BASE_URL = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// Tasks API
export const tasksApi = {
  getAll: (params?: { period?: TaskPeriod; date?: string; status?: string }) => {
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

  analyze: (date?: string) =>
    request<AIAnalysis>('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ date }),
    }),

  suggestOrder: () => request<Task[]>('/ai/suggest-order', { method: 'POST' }),
}
