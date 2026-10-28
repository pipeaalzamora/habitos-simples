import type { Habit, HabitLog } from '../types';

// Supports standalone frontend on AWS Amplify connecting to Render backend,
// or unified deployment where frontend and backend are hosted together.
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export interface DbStatus {
  isMongooseConnected: boolean;
  uriConfigured: boolean;
  mode: 'mongodb_atlas' | 'local_store';
}

export const fetchDbStatus = async (): Promise<DbStatus> => {
  try {
    const res = await fetch(`${API_BASE}/api/db-status`);
    if (!res.ok) throw new Error('Status failed');
    return await res.json();
  } catch {
    return { isMongooseConnected: false, uriConfigured: false, mode: 'local_store' };
  }
};

export const fetchHabits = async (userId: string): Promise<Habit[]> => {
  const res = await fetch(`${API_BASE}/api/habits`, {
    headers: { 'x-user-id': userId },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al obtener hábitos de MongoDB');
  }
  const data = await res.json();
  return (data.habits || []) as Habit[];
};

export const createHabitApi = async (
  userId: string,
  habitData: Partial<Habit>
): Promise<Habit> => {
  const res = await fetch(`${API_BASE}/api/habits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify(habitData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al crear hábito en MongoDB');
  }

  const data = await res.json();
  return data.habit as Habit;
};

export const updateHabitApi = async (
  userId: string,
  habitId: string,
  habitData: Partial<Habit>
): Promise<Habit> => {
  const res = await fetch(`${API_BASE}/api/habits/${encodeURIComponent(habitId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify(habitData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al actualizar hábito en MongoDB');
  }

  const data = await res.json();
  return data.habit as Habit;
};

export const deleteHabitApi = async (userId: string, habitId: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/api/habits/${encodeURIComponent(habitId)}`, {
    method: 'DELETE',
    headers: { 'x-user-id': userId },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al eliminar hábito de MongoDB');
  }
};

export const fetchLogs = async (userId: string): Promise<HabitLog[]> => {
  const res = await fetch(`${API_BASE}/api/logs`, {
    headers: { 'x-user-id': userId },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al obtener registros de MongoDB');
  }
  const data = await res.json();
  return (data.logs || []) as HabitLog[];
};

export const upsertLogApi = async (
  userId: string,
  habitId: string,
  date: string,
  logData: { completed: boolean; value?: number; notes?: string; source?: string }
): Promise<HabitLog> => {
  const res = await fetch(`${API_BASE}/api/logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify({ habitId, date, ...logData }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al registrar progreso en MongoDB');
  }

  const data = await res.json();
  return data.log as HabitLog;
};
