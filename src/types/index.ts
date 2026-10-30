export type HabitCategory = 'salud' | 'fitness' | 'mente' | 'productividad' | 'creatividad' | 'nutricion';

export type HabitFrequency = 'daily' | 'weekdays' | 'custom';

export type HabitGoalType = 'boolean' | 'numeric';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  goalType: HabitGoalType;
  targetValue?: number; // e.g. 10000 steps, 8 glasses, 30 minutes
  unit?: string; // 'pasos', 'min', 'vasos', 'páginas'
  color: string; // Tailwind color hex or class
  icon: string;
  createdAt: string; // ISO
  time?: string; // e.g. '08:00'
  calendarEventSummary?: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // 'YYYY-MM-DD'
  completed: boolean;
  value?: number;
  notes?: string;
  completedAt?: string;
  source?: 'manual' | 'calendar';
}

export interface DayStats {
  date: string;
  totalHabits: number;
  completedHabits: number;
  percentage: number;
}

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  reminders?: { useDefault: boolean };
}
