export interface Member {
  id: string;
  name: string;
  schedule: boolean[]; // 7 days * 24 hours = 168 slots. true = free, false = busy
}

export interface Subject {
  id: string;
  name: string;
  color: string;
}

export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null;
  deadline: string | null;
  createdAt: string;
}

export type Tab =
  | 'dashboard'
  | 'members'
  | 'schedule'
  | 'subjects'
  | 'tasks';
