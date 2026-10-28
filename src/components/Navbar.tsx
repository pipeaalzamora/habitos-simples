import React from 'react';
import {
  Flame,
  Moon,
  Sun,
  Calendar as CalendarIcon,
  Plus,
  LogOut,
} from 'lucide-react';
import type { User } from 'firebase/auth';

interface NavbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  overallStreak: { currentStreak: number; longestStreak: number };
  firebaseUser: User | null;
  onOpenGoogleCalendar: () => void;
  onOpenNewHabit: () => void;
  onGoogleSignIn: () => void;
  isLoggingInGoogle: boolean;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onToggleTheme,
  overallStreak,
  firebaseUser,
  onOpenGoogleCalendar,
  onOpenNewHabit,
  onGoogleSignIn,
  isLoggingInGoogle,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-sm shadow-emerald-500/20 text-white font-bold">
            <Flame className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                HabitPulse
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                Rachas
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-300 hidden sm:block">
              Rastreador de hábitos
            </p>
          </div>
        </div>

        {/* Global Streak Pill */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
          <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
          <span className="text-xs font-semibold">
            {overallStreak.currentStreak}{' '}
            <span className="font-normal text-zinc-600 dark:text-zinc-300">
              {overallStreak.currentStreak === 1 ? 'día de racha' : 'días de racha'}
            </span>
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Google Calendar Button */}
          <button
            onClick={onOpenGoogleCalendar}
            title="Sincronizar con Google Calendar"
            className="p-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <CalendarIcon className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline text-xs">Calendar</span>
          </button>

          {/* Firebase Google Auth */}
          {firebaseUser ? (
            <div className="flex items-center space-x-1.5 pl-1">
              {firebaseUser.photoURL ? (
                <img
                  src={firebaseUser.photoURL}
                  alt={firebaseUser.displayName || 'Usuario'}
                  className="w-7 h-7 rounded-full border border-emerald-500/40 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">
                  {firebaseUser.displayName?.[0] || firebaseUser.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 hidden lg:inline max-w-28 truncate">
                {firebaseUser.displayName || firebaseUser.email}
              </span>
              <button
                onClick={onLogout}
                title="Cerrar sesión de Google"
                className="p-1.5 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onGoogleSignIn}
              disabled={isLoggingInGoogle}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-all shadow-2xs disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
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
              <span>{isLoggingInGoogle ? 'Accediendo...' : 'Acceder con Google'}</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Cambiar tema"
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
          </button>

          {/* New Habit Button */}
          <button
            onClick={onOpenNewHabit}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs font-medium shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Hábito</span>
          </button>
        </div>
      </div>
    </header>
  );
};
