import { getAccessToken } from './firebaseAuth';
import type { Habit } from '../types';

export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export const listCalendarHabitEvents = async (): Promise<CalendarEventItem[]> => {
  const token = await getAccessToken();
  if (!token) throw new Error('No hay sesión activa con Google Calendar');

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const oneWeekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    oneWeekAgo
  )}&timeMax=${encodeURIComponent(
    oneWeekAhead
  )}&q=HabitPulse&singleEvents=true&orderBy=startTime`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Error al obtener eventos de Google Calendar');
  }

  const data = await res.json();
  return (data.items || []) as CalendarEventItem[];
};

export const createHabitCalendarEvent = async (
  habit: Habit,
  dateStr: string,
  timeStr: string = '08:00',
  durationMinutes: number = 30
): Promise<CalendarEventItem> => {
  const token = await getAccessToken();
  if (!token) throw new Error('No hay sesión activa con Google Calendar');

  // Build ISO strings for start and end
  const [hours, minutes] = timeStr.split(':').map(Number);
  const start = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const eventPayload = {
    summary: `${habit.icon} ${habit.title} [HabitPulse]`,
    description: `Hábito de HabitPulse: ${habit.title}${habit.description ? `\nDetalles: ${habit.description}` : ''}\nCategoría: ${habit.category}\n¡Mantén tu racha diaria!`,
    start: {
      dateTime: start.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 10 },
        { method: 'notification', minutes: 30 },
      ],
    },
    colorId: '2', // Sage / Green in Google Calendar
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error al crear evento en Google Calendar');
  }

  return await res.json();
};

export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('No hay sesión activa con Google Calendar');

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error al eliminar el evento de Google Calendar');
  }
};
