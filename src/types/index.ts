export interface Group {
  id: string;
  name: string;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  schedule: boolean[];
  groupId: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  groupId: string;
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
  groupId: string;
}

export type Tab =
  | 'dashboard'
  | 'members'
  | 'schedule'
  | 'subjects'
  | 'tasks';
