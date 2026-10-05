/** Shared types used across the React Native app */

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Task {
  _id: string;
  userId: string;
  title: string;
  description: string;
  scheduledAt: string | null;
  deadline: string | null;
  priority: 1 | 2 | 3;
  completed: boolean;
  completedAt: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  scheduledAt?: string;
  deadline?: string;
  priority?: 1 | 2 | 3;
  tags?: string[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  scheduledAt?: string | null;
  deadline?: string | null;
  priority?: 1 | 2 | 3;
  completed?: boolean;
  tags?: string[];
}

/** Section group for the SectionList */
export interface TaskSection {
  title: string;
  data: Task[];
}
