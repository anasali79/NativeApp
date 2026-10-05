/**
 * Custom hook for task state management using useReducer.
 * Handles: loading, optimistic updates, rollback on failure.
 */
import { useReducer, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, CreateTaskPayload, UpdateTaskPayload } from '../domain/types';
import * as tasksApi from '../api/tasks';

const TASKS_CACHE_KEY = '@tasks_cache';

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
      return { ...state, loading: state.tasks.length === 0, error: null };
    case 'loaded':
      return { tasks: action.tasks, loading: false, error: null };
    case 'error':
      return { ...state, loading: false, error: state.tasks.length === 0 ? action.message : null };
    case 'added': {
      const nextTasks = [action.task, ...state.tasks];
      AsyncStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(nextTasks)).catch(() => {});
      return { ...state, tasks: nextTasks };
    }
    case 'updated': {
      const nextTasks = state.tasks.map((t) =>
        t._id === action.task._id ? action.task : t,
      );
      AsyncStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(nextTasks)).catch(() => {});
      return { ...state, tasks: nextTasks };
    }
    case 'removed': {
      const nextTasks = state.tasks.filter((t) => t._id !== action.id);
      AsyncStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(nextTasks)).catch(() => {});
      return { ...state, tasks: nextTasks };
    }
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
      AsyncStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(tasks)).catch(() => {});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Can't reach the server. Pull down to try again.";
      dispatch({ type: 'error', message });
    }
  }, []);

  // Restore cached tasks immediately on mount, then sync in background
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(TASKS_CACHE_KEY);
        if (cached && isMounted) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            dispatch({ type: 'loaded', tasks: parsed });
          }
        }
      } catch {}
      if (isMounted) {
        refresh();
      }
    })();

    return () => {
      isMounted = false;
    };
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
