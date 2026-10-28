/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { User } from 'firebase/auth';
import confetti from 'canvas-confetti';
import {
  Flame,
  Plus,
  BarChart3,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Loader2,
} from 'lucide-react';

import type { Habit, HabitLog } from './types';

import {
  getStoredTheme,
  saveTheme,
  getTodayKey,
  calculateHabitStreak,
  calculateOverallStreak,
} from './services/storageService';

import {
  initAuth,
  googleSignIn,
  logout,
  setCachedAccessToken,
} from './services/firebaseAuth';

import {
  fetchHabits,
  createHabitApi,
  updateHabitApi,
  deleteHabitApi,
  fetchLogs,
  upsertLogApi,
  syncUserApi,
} from './services/apiClient';

import { Navbar } from './components/Navbar';
import { HabitCard } from './components/HabitCard';
import { HabitFormModal } from './components/HabitFormModal';
import { WeeklyStats } from './components/WeeklyStats';
import { MonthlyHeatmap } from './components/MonthlyHeatmap';
import { CalendarSyncModal } from './components/CalendarSyncModal';
import { ConfirmationModal } from './components/ConfirmationModal';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getStoredTheme());

  // Firebase Google Auth user
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);

  // Habits & Logs state (stored in MongoDB, no mock data)
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Selected date & filter state
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayKey());
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [statsView, setStatsView] = useState<'weekly' | 'monthly'>('weekly');

  // Modals state
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // Confirmation dialog state for deleting habit
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    habitId: string | null;
  }>({ isOpen: false, habitId: null });

  // Apply theme class
  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Determine active userId for MongoDB operations
  const currentUserId = useMemo(() => {
    return firebaseUser?.uid || 'guest-user';
  }, [firebaseUser]);

  // Load habits and logs from MongoDB
  const loadUserData = useCallback(async (userId: string) => {
    setLoadingData(true);
    try {
      const [fetchedHabits, fetchedLogs] = await Promise.all([
        fetchHabits(userId),
        fetchLogs(userId),
      ]);
      setHabits(fetchedHabits);
      setLogs(fetchedLogs);
    } catch (err: unknown) {
      console.error('Error fetching data:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(async (user, token) => {
      setFirebaseUser(user);
      setCachedAccessToken(token);
      if (user) {
        // Register user in MongoDB and assign any previous guest habits
        await syncUserApi({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          previousGuestId: 'guest-user',
        });
        loadUserData(user.uid);
      } else {
        loadUserData('guest-user');
      }
    });
    return () => unsubscribe();
  }, [loadUserData]);

  const handleGoogleLogin = async () => {
    setIsLoggingInGoogle(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setFirebaseUser(res.user);
        await syncUserApi({
          uid: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName,
          photoURL: res.user.photoURL,
          previousGuestId: 'guest-user',
        });
        await loadUserData(res.user.uid);
      }
    } catch (err) {
      console.error('Error logging in with Google:', err);
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setFirebaseUser(null);
    loadUserData('guest-user');
  };

  // Toggle habit completion in MongoDB
  const handleToggleHabitComplete = async (habitId: string, completed: boolean, value?: number) => {
    try {
      const updatedLog = await upsertLogApi(currentUserId, habitId, selectedDate, {
        completed,
        value,
        source: 'manual',
      });

      setLogs((prev) => {
        const idx = prev.findIndex((l) => l.habitId === habitId && l.date === selectedDate);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedLog;
          return next;
        }
        return [...prev, updatedLog];
      });
    } catch (err) {
      console.error('Failed to update log:', err);
    }
  };

  // Update numeric value in MongoDB
  const handleUpdateHabitValue = async (habitId: string, value: number) => {
    const habit = habits.find((h) => h.id === habitId);
    const target = habit?.targetValue || 1;
    const completed = value >= target;

    try {
      const updatedLog = await upsertLogApi(currentUserId, habitId, selectedDate, {
        value,
        completed,
        source: 'manual',
      });

      setLogs((prev) => {
        const idx = prev.findIndex((l) => l.habitId === habitId && l.date === selectedDate);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedLog;
          return next;
        }
        return [...prev, updatedLog];
      });
    } catch (err) {
      console.error('Failed to update habit numeric value:', err);
    }
  };

  // Save note for habit in MongoDB
  const handleSaveHabitNote = async (habitId: string, note: string) => {
    const currentLog = logs.find((l) => l.habitId === habitId && l.date === selectedDate);
    try {
      const updatedLog = await upsertLogApi(currentUserId, habitId, selectedDate, {
        completed: currentLog?.completed || false,
        value: currentLog?.value,
        notes: note,
        source: currentLog?.source || 'manual',
      });

      setLogs((prev) => {
        const idx = prev.findIndex((l) => l.habitId === habitId && l.date === selectedDate);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedLog;
          return next;
        }
        return [...prev, updatedLog];
      });
    } catch (err) {
      console.error('Failed to save habit note:', err);
    }
  };

  // Add or Edit habit in MongoDB
  const handleSaveHabit = async (habitData: Partial<Habit>) => {
    try {
      if (habitToEdit) {
        const updated = await updateHabitApi(currentUserId, habitToEdit.id, habitData);
        setHabits((prev) => prev.map((h) => (h.id === habitToEdit.id ? updated : h)));
        setHabitToEdit(null);
      } else {
        const created = await createHabitApi(currentUserId, habitData);
        setHabits((prev) => [created, ...prev]);
        try {
          confetti({
            particleCount: 35,
            spread: 50,
            origin: { y: 0.8 },
            colors: ['#10B981', '#34D399'],
          });
        } catch {
          // Safe fallback
        }
      }
    } catch (err) {
      console.error('Failed to save habit:', err);
    }
  };

  // Delete habit from MongoDB
  const confirmDeleteHabit = async () => {
    if (!deleteConfirm.habitId) return;
    try {
      await deleteHabitApi(currentUserId, deleteConfirm.habitId);
      setHabits((prev) => prev.filter((h) => h.id !== deleteConfirm.habitId));
      setLogs((prev) => prev.filter((l) => l.habitId !== deleteConfirm.habitId));
    } catch (err) {
      console.error('Failed to delete habit:', err);
    } finally {
      setDeleteConfirm({ isOpen: false, habitId: null });
    }
  };

  // Filter habits by category
  const filteredHabits = useMemo(() => {
    if (activeCategory === 'all') return habits;
    if (activeCategory === 'completed') {
      const completedIds = new Set(
        logs.filter((l) => l.date === selectedDate && l.completed).map((l) => l.habitId)
      );
      return habits.filter((h) => completedIds.has(h.id));
    }
    if (activeCategory === 'pending') {
      const completedIds = new Set(
        logs.filter((l) => l.date === selectedDate && l.completed).map((l) => l.habitId)
      );
      return habits.filter((h) => !completedIds.has(h.id));
    }
    return habits.filter((h) => h.category === activeCategory);
  }, [habits, logs, activeCategory, selectedDate]);

  // Overall streaks calculation
  const overallStreak = useMemo(
    () => calculateOverallStreak(habits, logs),
    [habits, logs]
  );

  const selectedDateLogs = useMemo(
    () => logs.filter((l) => l.date === selectedDate && l.completed),
    [logs, selectedDate]
  );

  const selectedDateProgressPct = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.round((selectedDateLogs.length / habits.length) * 100);
  }, [selectedDateLogs, habits]);

  const isTodaySelected = selectedDate === getTodayKey();

  const formattedSelectedDate = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    return d.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors selection:bg-emerald-500/20 selection:text-emerald-500">
      {/* Top Minimalist Header */}
      <Navbar
        theme={theme}
        onToggleTheme={handleToggleTheme}
        overallStreak={overallStreak}
        firebaseUser={firebaseUser}
        onOpenGoogleCalendar={() => setIsCalendarModalOpen(true)}
        onOpenNewHabit={() => {
          setHabitToEdit(null);
          setIsHabitModalOpen(true);
        }}
        onGoogleSignIn={handleGoogleLogin}
        isLoggingInGoogle={isLoggingInGoogle}
        onLogout={handleLogout}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Banner: Daily Streak & Day Progress */}
        <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-zinc-900 via-zinc-900 to-zinc-800 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-950 p-6 sm:p-8 text-white border border-zinc-800 shadow-xl">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Rastreador de Disciplina Diaria</span>
                </span>
                <span className="text-zinc-400 text-xs capitalize">• {formattedSelectedDate}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {isTodaySelected ? (
                  <>
                    ¡Mantén el impulso, tu racha está en{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                      {overallStreak.currentStreak} días consecutivos
                    </span>
                    ! 🔥
                  </>
                ) : (
                  <>
                    Historial del{' '}
                    <span className="text-emerald-400">{formattedSelectedDate}</span>
                  </>
                )}
              </h1>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Construir hábitos diarios transforma tu vida un paso a la vez. Cada día completado fortalece tu disciplina.
              </p>

              {/* Quick status bar */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs">
                  <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                  <span>
                    Racha actual: <strong>{overallStreak.currentStreak} días</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>
                    Récord histórico: <strong>{overallStreak.longestStreak} días</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>
                    Hábitos activos: <strong>{habits.length}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Circular Progress Graphic */}
            <div className="flex items-center space-x-5 bg-white/5 dark:bg-black/30 backdrop-blur-xs p-5 rounded-2xl border border-white/10 shrink-0">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/15"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-400 transition-all duration-500 stroke-linecap-round"
                    strokeDasharray={`${selectedDateProgressPct}, 100`}
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-base font-bold text-white block">
                    {selectedDateProgressPct}%
                  </span>
                  <span className="text-[9px] text-zinc-400 uppercase font-mono">Día</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-zinc-300 block">Progreso del día</span>
                <p className="text-lg font-bold text-white">
                  {selectedDateLogs.length} / {habits.length}{' '}
                  <span className="text-xs font-normal text-zinc-400">hábitos</span>
                </p>
                {!isTodaySelected && (
                  <button
                    onClick={() => setSelectedDate(getTodayKey())}
                    className="text-[11px] text-emerald-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Volver a hoy</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        </section>

        {/* Visual Stats Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Estadísticas Visuales de Progreso
              </h2>
            </div>

            <div className="flex items-center rounded-xl bg-zinc-200/70 dark:bg-zinc-800/80 p-0.5 text-xs font-medium">
              <button
                onClick={() => setStatsView('weekly')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statsView === 'weekly'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                Semanal
              </button>
              <button
                onClick={() => setStatsView('monthly')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statsView === 'monthly'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                Mensual
              </button>
            </div>
          </div>

          {statsView === 'weekly' ? (
            <WeeklyStats
              habits={habits}
              logs={logs}
              selectedDate={selectedDate}
              onSelectDate={(date) => setSelectedDate(date)}
            />
          ) : (
            <MonthlyHeatmap
              habits={habits}
              logs={logs}
              selectedDate={selectedDate}
              onSelectDate={(date) => setSelectedDate(date)}
            />
          )}
        </div>

        {/* Habits Section */}
        <div className="space-y-4 pt-2">
          {/* Controls Bar: Filters and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Mis Hábitos
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
                {filteredHabits.length}
              </span>
            </div>

            {/* Category / Status filter tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'pending', label: 'Pendientes' },
                { id: 'completed', label: 'Completados' },
                { id: 'fitness', label: 'Fitness' },
                { id: 'salud', label: 'Salud' },
                { id: 'mente', label: 'Mente' },
                { id: 'productividad', label: 'Productividad' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                    activeCategory === tab.id
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs font-semibold'
                      : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loadingData ? (
            <div className="p-12 text-center text-zinc-400 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              <span className="text-xs">Cargando hábitos...</span>
            </div>
          ) : filteredHabits.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl mx-auto text-zinc-400">
                🎯
              </div>
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                No hay hábitos registrados
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Crea tu primer hábito para comenzar tu racha diaria y monitorear tu progreso.
              </p>
              <button
                onClick={() => {
                  setHabitToEdit(null);
                  setIsHabitModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs font-medium shadow-xs transition-all inline-flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Primer Hábito</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredHabits.map((habit) => {
                const habitStreak = calculateHabitStreak(habit.id, logs);
                const currentDayLog = logs.find(
                  (l) => l.habitId === habit.id && l.date === selectedDate
                );

                return (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    log={currentDayLog}
                    streak={habitStreak}
                    onToggleComplete={handleToggleHabitComplete}
                    onUpdateValue={handleUpdateHabitValue}
                    onEdit={(h) => {
                      setHabitToEdit(h);
                      setIsHabitModalOpen(true);
                    }}
                    onDelete={(id) => {
                      setDeleteConfirm({ isOpen: true, habitId: id });
                    }}
                    onSyncCalendar={() => {
                      setIsCalendarModalOpen(true);
                    }}
                    onSaveNote={handleSaveHabitNote}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 py-6 mt-12 bg-white/50 dark:bg-zinc-950 text-xs text-zinc-600 dark:text-zinc-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">HabitPulse</span>
            <span>— Disciplina diaria y sincronización con Google Calendar</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsCalendarModalOpen(true)}
              className="hover:text-emerald-500 transition-colors"
            >
              Google Calendar
            </button>
            <button
              onClick={() => {
                setHabitToEdit(null);
                setIsHabitModalOpen(true);
              }}
              className="hover:text-emerald-500 transition-colors"
            >
              Nuevo Hábito
            </button>
          </div>
        </div>
      </footer>

      {/* Habit Create / Edit Modal */}
      <HabitFormModal
        isOpen={isHabitModalOpen}
        habitToEdit={habitToEdit}
        onClose={() => {
          setIsHabitModalOpen(false);
          setHabitToEdit(null);
        }}
        onSave={handleSaveHabit}
      />

      {/* Google Calendar Sync Modal */}
      <CalendarSyncModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        user={firebaseUser}
        onLogin={handleGoogleLogin}
        isLoggingIn={isLoggingInGoogle}
        habits={habits}
        selectedDate={selectedDate}
      />

      {/* Confirmation Dialog for deleting habit */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        title="Eliminar Hábito"
        message="¿Estás seguro de que deseas eliminar este hábito? Se borrará permanentemente de tu base de datos."
        confirmText="Eliminar Hábito"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={confirmDeleteHabit}
        onCancel={() => setDeleteConfirm({ isOpen: false, habitId: null })}
      />
    </div>
  );
}
