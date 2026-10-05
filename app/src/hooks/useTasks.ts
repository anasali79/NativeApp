/**
 * Custom hook for task state management using useReducer.
 * Handles: loading, optimistic updates, rollback on failure.
 */
import { useReducer, useCallback, useEffect, useRef } from 'react';
import { Task, CreateTaskPayload, UpdateTaskPayload } from '../domain/types';
import * as tasksApi from '../api/tasks';

// --- State ---
interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

// --- Actions ---
type TasksAction =
  | { type: 'loading' }
  | { type: 'loaded'; tasks: Task[] }
  | { type: 'error'; message: string }
  | { type: 'added'; task: Task }
  | { type: 'updated'; task: Task }
  | { type: 'removed'; id: string };

function tasksReducer(state: TasksState, action: TasksAction): TasksState {
  switch (action.type) {
    case 'loading':
      return { ...state, loading: true, error: null };
    case 'loaded':
      return { tasks: action.tasks, loading: false, error: null };
    case 'error':
      return { ...state, loading: false, error: action.message };
    case 'added':
      return { ...state, tasks: [action.task, ...state.tasks] };
    case 'updated':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t._id === action.task._id ? action.task : t,
        ),
      };
    case 'removed':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t._id !== action.id),
      };
    default:
      return state;
  }
}

export function useTasks() {
  const [state, dispatch] = useReducer(tasksReducer, {
    tasks: [],
    loading: true,
    error: null,
  });

  // Keep a ref to tasks for rollback
  const tasksRef = useRef(state.tasks);
  tasksRef.current = state.tasks;

  /** Fetch all tasks from the server */
  const refresh = useCallback(async () => {
    dispatch({ type: 'loading' });
    try {
      const tasks = await tasksApi.fetchTasks();
      dispatch({ type: 'loaded', tasks });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Can't reach the server. Pull down to try again.";
      dispatch({ type: 'error', message });
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Add a new task */
  const add = useCallback(async (payload: CreateTaskPayload): Promise<void> => {
    const task = await tasksApi.createTask(payload);
    dispatch({ type: 'added', task });
  }, []);

  /** Toggle task completion — optimistic update with rollback */
  const toggle = useCallback(async (task: Task): Promise<void> => {
    const previousTasks = [...tasksRef.current];

    // Optimistic: immediately update UI
    const optimisticTask: Task = {
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : null,
    };
    dispatch({ type: 'updated', task: optimisticTask });

    try {
      const updated = await tasksApi.updateTask(task._id, {
        completed: !task.completed,
      });
      dispatch({ type: 'updated', task: updated });
    } catch {
      // Rollback on failure
      dispatch({ type: 'loaded', tasks: previousTasks });
    }
  }, []);

  /** Update task fields */
  const update = useCallback(async (id: string, payload: UpdateTaskPayload): Promise<void> => {
    const updated = await tasksApi.updateTask(id, payload);
    dispatch({ type: 'updated', task: updated });
  }, []);

  /** Remove a task — optimistic with rollback */
  const remove = useCallback(async (id: string): Promise<void> => {
    const previousTasks = [...tasksRef.current];

    // Optimistic: immediately remove from UI
    dispatch({ type: 'removed', id });

    try {
      await tasksApi.deleteTask(id);
    } catch {
      // Rollback on failure
      dispatch({ type: 'loaded', tasks: previousTasks });
    }
  }, []);

  return {
    tasks: state.tasks,
    loading: state.loading,
    error: state.error,
    refresh,
    add,
    toggle,
    update,
    remove,
  };
}
