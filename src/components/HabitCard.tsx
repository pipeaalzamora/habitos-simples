import React, { useState } from 'react';
import {
  Check,
  Flame,
  MoreVertical,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Calendar,
  MessageSquare,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Habit, HabitLog } from '../types';

interface HabitCardProps {
  habit: Habit;
  log?: HabitLog;
  streak: { currentStreak: number; longestStreak: number; totalCompleted: number };
  onToggleComplete: (habitId: string, completed: boolean, value?: number) => void;
  onUpdateValue: (habitId: string, value: number) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onSyncCalendar?: (habit: Habit) => void;
  onSaveNote?: (habitId: string, note: string) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  log,
  streak,
  onToggleComplete,
  onUpdateValue,
  onEdit,
  onDelete,
  onSyncCalendar,
  onSaveNote,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState(log?.notes || '');

  const isCompleted = !!log?.completed;
  const currentValue = log?.value ?? (isCompleted ? habit.targetValue || 1 : 0);
  const targetValue = habit.targetValue || 1;
  const progressPercent = Math.min(100, Math.round((currentValue / targetValue) * 100));

  const handleToggle = () => {
    const nextCompleted = !isCompleted;
    if (nextCompleted) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10B981', '#06B6D4', '#8B5CF6', '#F59E0B'],
        });
      } catch {
        // Safe fallback
      }
    }
    const val = habit.goalType === 'numeric' ? (nextCompleted ? targetValue : 0) : undefined;
    onToggleComplete(habit.id, nextCompleted, val);
  };

  const handleIncrement = (delta: number) => {
    const nextVal = Math.max(0, currentValue + delta);
    const completed = nextVal >= targetValue;
    if (completed && !isCompleted) {
      try {
        confetti({
          particleCount: 45,
          spread: 65,
          origin: { y: 0.8 },
          colors: ['#10B981', '#34D399', '#6EE7B7'],
        });
      } catch {
        // Safe fallback
      }
    }
    onUpdateValue(habit.id, nextVal);
  };

  const categoryLabels: Record<string, string> = {
    salud: 'Salud',
    fitness: 'Fitness',
    mente: 'Mente',
    productividad: 'Productividad',
    creatividad: 'Creatividad',
    nutricion: 'Nutrición',
  };

  return (
    <div
      className={`group relative rounded-2xl p-4 transition-all duration-200 border ${
        isCompleted
          ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 dark:border-emerald-500/25 shadow-xs'
          : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Habit Icon & Info */}
        <div className="flex items-start space-x-3.5 flex-1 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-105"
            style={{
              backgroundColor: `${habit.color}18`,
              border: `1px solid ${habit.color}35`,
            }}
          >
            <span>{habit.icon || '🎯'}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3
                className={`text-sm font-semibold tracking-tight truncate ${
                  isCompleted
                    ? 'line-through text-zinc-600 dark:text-zinc-400'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {habit.title}
              </h3>

              {/* Category pill */}
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {categoryLabels[habit.category] || habit.category}
              </span>

              {/* Time pill */}
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{habit.time || '08:00'}</span>
              </span>
            </div>

            {habit.description && (
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 line-clamp-1">
                {habit.description}
              </p>
            )}

            {/* Streak & Completion Statistics */}
            <div className="flex items-center space-x-3 mt-2 text-xs">
              <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400 font-medium">
                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                <span>
                  {streak.currentStreak} {streak.currentStreak === 1 ? 'día' : 'días'}
                </span>
              </div>
              <span className="text-zinc-400 dark:text-zinc-500">•</span>
              <span className="text-zinc-600 dark:text-zinc-300">
                Récord: <strong className="text-zinc-700 dark:text-zinc-200">{streak.longestStreak}d</strong>
              </span>
              <span className="text-zinc-400 dark:text-zinc-500 hidden sm:inline">•</span>
              <span className="text-zinc-600 dark:text-zinc-300 hidden sm:inline">
                Total: <strong className="text-zinc-700 dark:text-zinc-200">{streak.totalCompleted}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Checkmark or Numeric Action Button */}
        <div className="flex items-center space-x-2 shrink-0">
          {habit.goalType === 'boolean' ? (
            <button
              onClick={handleToggle}
              title={isCompleted ? 'Marcar como no completado' : 'Completar hábito hoy'}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isCompleted
                  ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/20 active:scale-95'
                  : 'border-2 border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:emerald-400 text-transparent hover:text-emerald-500/50'
              }`}
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
            </button>
          ) : (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => handleIncrement(-1)}
                disabled={currentValue <= 0}
                className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleToggle}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold tracking-tight transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-500/10 hover:text-emerald-600'
                }`}
              >
                {currentValue} / {targetValue} {habit.unit}
              </button>

              <button
                onClick={() => handleIncrement(1)}
                className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* More options menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 z-40 w-44 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1 text-xs">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowNoteInput(!showNoteInput);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center space-x-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{log?.notes ? 'Editar reflexión' : 'Añadir nota'}</span>
                  </button>

                  {onSyncCalendar && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onSyncCalendar(habit);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center space-x-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>Agendar en Calendar</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(habit);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center space-x-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar hábito</span>
                  </button>

                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(habit.id);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center space-x-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar hábito</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Numeric progress bar */}
      {habit.goalType === 'numeric' && (
        <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-300 mb-1">
            <span>Progreso diario</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-200">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: isCompleted ? '#10B981' : habit.color || '#3B82F6',
              }}
            />
          </div>
        </div>
      )}

      {/* Note input/display */}
      {(showNoteInput || log?.notes) && (
        <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {showNoteInput ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Escribe una breve reflexión de hoy..."
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={() => {
                  onSaveNote?.(habit.id, noteText);
                  setShowNoteInput(false);
                }}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-500 text-white"
              >
                Guardar
              </button>
            </div>
          ) : (
            <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded-lg italic flex items-center justify-between">
              <span>"{log?.notes}"</span>
              <button
                onClick={() => setShowNoteInput(true)}
                className="text-zinc-400 hover:text-zinc-600 text-[10px] ml-2 not-italic"
              >
                Editar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
