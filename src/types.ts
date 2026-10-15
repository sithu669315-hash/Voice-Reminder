export type TaskCategory = 'အလုပ်' | 'ကိုယ်ရေးကိုယ်တာ' | 'ကျန်းမာရေး' | 'ပညာရေး';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  category: TaskCategory | string;
  priority: TaskPriority;
  ttsMessage: string;
  completed: boolean;
  completedAt: string | null;
  notified?: boolean;
}

export type NavItemKey =
  | 'dashboard'
  | 'tasks'
  | 'records'
  | 'calendar'
  | 'history'
  | 'voice'
  | 'completed'
  | 'settings';

export type StatsPeriod = 'daily' | 'weekly' | 'monthly';

export type RecordStatusFilter = 'all' | 'completed' | 'unfulfilled';
