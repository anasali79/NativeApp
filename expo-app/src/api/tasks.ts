import { api } from './client';
import { Task, CreateTaskPayload, UpdateTaskPayload } from '../domain/types';

/** Fetch all tasks for the current user (with optional filters) */
export function fetchTasks(params?: {
  status?: string;
  priority?: string;
  tag?: string;
  q?: string;
}): Promise<Task[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.priority) query.set('priority', params.priority);
  if (params?.tag) query.set('tag', params.tag);
  if (params?.q) query.set('q', params.q);

  const qs = query.toString();
  return api.get<Task[]>(`/tasks${qs ? `?${qs}` : ''}`);
}

/** Create a new task */
export function createTask(payload: CreateTaskPayload): Promise<Task> {
  return api.post<Task>('/tasks', payload);
}

/** Update an existing task */
export function updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
  return api.patch<Task>(`/tasks/${id}`, payload);
}

/** Delete a task */
export function deleteTask(id: string): Promise<{ deleted: boolean }> {
  return api.delete<{ deleted: boolean }>(`/tasks/${id}`);
}
