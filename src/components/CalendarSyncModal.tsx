import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  CheckCircle,
  ExternalLink,
  Loader2,
  Trash2,
  Clock,
  Plus,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { Habit } from '../types';
import {
  listCalendarHabitEvents,
  createHabitCalendarEvent,
  deleteCalendarEvent,
  type CalendarEventItem,
} from '../services/calendarService';
import { ConfirmationModal } from './ConfirmationModal';

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogin: () => void;
  isLoggingIn: boolean;
  habits: Habit[];
  selectedDate: string;
}

export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogin,
  isLoggingIn,
  habits,
  selectedDate,
}) => {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingHabitId, setSyncingHabitId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });

  const loadEvents = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const items = await listCalendarHabitEvents();
      setEvents(items);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg((err as Error).message || 'Error al conectar con Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      loadEvents();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleScheduleHabit = (habit: Habit) => {
    const time = habit.time || '09:00';
    setConfirmDialog({
      isOpen: true,
      title: 'Agendar en Google Calendar',
      message: `¿Deseas agregar un evento en tu Google Calendar principal para "${habit.title}" el día ${selectedDate} a las ${time} hrs?`,
      isDestructive: false,
      action: async () => {
        setSyncingHabitId(habit.id);
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
          await createHabitCalendarEvent(habit, selectedDate, time);
          setSuccessMsg(`¡Evento "${habit.title}" programado exitosamente en tu Google Calendar!`);
          await loadEvents();
        } catch (err: unknown) {
          setErrorMsg((err as Error).message || 'Error al agendar en Calendar');
        } finally {
          setSyncingHabitId(null);
        }
      },
    });
  };

  const handleBatchSyncAllHabits = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Sincronizar todos los hábitos del día',
      message: `Se crearán ${habits.length} recordatorios y bloques de tiempo en tu Google Calendar para el día ${selectedDate}. ¿Deseas continuar?`,
      isDestructive: false,
      action: async () => {
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
          let currentHour = 9;
          for (const habit of habits) {
            const timeStr = habit.time || `${String(currentHour).padStart(2, '0')}:00`;
            await createHabitCalendarEvent(habit, selectedDate, timeStr, 30);
            currentHour = Math.min(20, currentHour + 1);
          }
          setSuccessMsg(`Se han sincronizado ${habits.length} hábitos en tu Google Calendar.`);
          await loadEvents();
        } catch (err: unknown) {
          setErrorMsg((err as Error).message || 'Error durante la sincronización');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleDeleteCalendarEvent = (eventId: string, summary: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar evento de Google Calendar',
      message: `¿Estás seguro de que deseas eliminar el evento "${summary}" de tu Google Calendar? Esta acción no se puede deshacer.`,
      isDestructive: true,
      action: async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
          await deleteCalendarEvent(eventId);
          setSuccessMsg('Evento eliminado correctamente de Google Calendar.');
          await loadEvents();
        } catch (err: unknown) {
          setErrorMsg((err as Error).message || 'Error al eliminar evento');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl my-8 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Sincronización con Google Calendar
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Agenda tus hábitos diarios y mantén tus bloques de tiempo al día
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback banners */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* User Auth Section */}
          {!user ? (
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="max-w-sm mx-auto">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Conecta tu cuenta de Google
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Permite a HabitPulse agendar tus hábitos, crear recordatorios y sincronizar tus rachas directamente en tu calendario personal.
                </p>
              </div>

              {/* Official Google Sign-In Button */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={onLogin}
                  disabled={isLoggingIn}
                  className="flex items-center space-x-3 px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold shadow-xs transition-all active:scale-98 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{isLoggingIn ? 'Conectando...' : 'Iniciar sesión con Google'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Account connected bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center space-x-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || ''}
                      className="w-9 h-9 rounded-full object-cover border border-blue-500/30"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-xs">
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                      {user.displayName || 'Usuario de Google'}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {user.email} • Conectado a Google Calendar
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleBatchSyncAllHabits}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sincronizar Todo Hoy</span>
                </button>
              </div>

              {/* Habit scheduling selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Hábitos para agendar en Calendar ({selectedDate}):</span>
                  <span className="text-[11px] font-normal text-zinc-500">
                    Duración: 30 min por bloque
                  </span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {habits.map((habit) => {
                    const isSyncing = syncingHabitId === habit.id;
                    return (
                      <div
                        key={habit.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="text-base">{habit.icon}</span>
                          <div>
                            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 block">
                              {habit.title}
                            </span>
                            <span className="text-[10px] text-zinc-500 capitalize">
                              {habit.category} • Horario: {habit.time || '09:00'} (30m)
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleScheduleHabit(habit)}
                          disabled={isSyncing || loading}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-1"
                        >
                          {isSyncing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Calendar className="w-3 h-3" />
                          )}
                          <span>Agendar</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Already synced events from Calendar */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  <span>Eventos de HabitPulse en Google Calendar:</span>
                  <button
                    onClick={loadEvents}
                    disabled={loading}
                    className="text-[11px] text-blue-500 hover:underline"
                  >
                    {loading ? 'Actualizando...' : 'Refrescar'}
                  </button>
                </div>

                {events.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic text-center py-3 bg-zinc-50 dark:bg-zinc-800/20 rounded-xl">
                    No se han registrado eventos recientes de HabitPulse en tu Google Calendar.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {events.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 text-xs"
                      >
                        <div className="truncate pr-2">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate block">
                            {ev.summary}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {ev.start.dateTime
                              ? new Date(ev.start.dateTime).toLocaleString('es-ES', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })
                              : ev.start.date}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          {ev.htmlLink && (
                            <a
                              href={ev.htmlLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-zinc-400 hover:text-blue-500"
                              title="Abrir en Google Calendar"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteCalendarEvent(ev.id, ev.summary)}
                            className="p-1 text-zinc-400 hover:text-red-500"
                            title="Eliminar de Google Calendar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={confirmDialog.isDestructive}
        confirmText={confirmDialog.isDestructive ? 'Eliminar de Calendar' : 'Agendar en Calendar'}
        onConfirm={async () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          await confirmDialog.action();
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};
