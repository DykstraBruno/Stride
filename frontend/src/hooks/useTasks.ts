import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../services/api'
import { TaskPeriod, CreateTaskPayload, UpdateTaskPayload } from '../types/task'
import {
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
} from 'date-fns'

function getPeriodBounds(period: TaskPeriod, date: Date): { dateFrom: string; dateTo: string } {
  let from: Date, to: Date
  if (period === 'daily') {
    from = startOfDay(date)
    to   = endOfDay(date)
  } else if (period === 'weekly') {
    from = startOfWeek(date, { weekStartsOn: 0 })
    to   = endOfWeek(date,   { weekStartsOn: 0 })
  } else {
    from = startOfMonth(date)
    to   = endOfMonth(date)
  }
  return { dateFrom: from.toISOString(), dateTo: to.toISOString() }
}

export function useTasks(period?: TaskPeriod, date?: Date) {
  const bounds = period && date ? getPeriodBounds(period, date) : undefined

  return useQuery({
    queryKey: ['tasks', period, bounds?.dateFrom],
    queryFn: () => tasksApi.getAll({ period, ...bounds }),
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.getById(id),
    enabled: Boolean(id),
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
      tasksApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useCompleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksApi.complete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useStartTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksApi.start(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useSkipTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksApi.skip(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
