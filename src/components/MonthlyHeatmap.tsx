import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Zap, Target, Star } from 'lucide-react';
import type { Habit, HabitLog } from '../types';
import { formatDateKey } from '../services/storageService';

interface MonthlyHeatmapProps {
  habits: Habit[];
  logs: HabitLog[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const MonthlyHeatmap: React.FC<MonthlyHeatmapProps> = ({
  habits,
  logs,
  selectedDate,
  onSelectDate,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthName = currentMonthDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  // Build days matrix for the month
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // Day of week for 1st day (0 for Monday, 6 for Sunday)
  const startingOffset = (firstDayOfMonth.getDay() + 6) % 7;

  const daysArray = [];

  // Blank slots for previous month offset
  for (let i = 0; i < startingOffset; i++) {
    daysArray.push(null);
  }

  // Days in month
  let totalMonthCompleted = 0;
  let perfectDaysCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateKey = formatDateKey(dateObj);
    const dayLogs = logs.filter((l) => l.date === dateKey && l.completed);
    const completed = dayLogs.length;
    const total = habits.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    totalMonthCompleted += completed;
    if (completed === total && total > 0) {
      perfectDaysCount++;
    }

    daysArray.push({
      dayNum: d,
      dateKey,
      completed,
      total,
      pct,
      isToday: dateKey === formatDateKey(new Date()),
      isSelected: dateKey === selectedDate,
    });
  }

  const avgDaily = (totalMonthCompleted / daysInMonth).toFixed(1);
  const totalPossible = daysInMonth * habits.length;
  const monthlyCompletionRate = totalPossible > 0 ? Math.round((totalMonthCompleted / totalPossible) * 100) : 0;

  const getHeatmapColor = (pct: number, isSelected: boolean) => {
    if (isSelected) {
      return 'ring-2 ring-zinc-900 dark:ring-white scale-105 z-10';
    }
    if (pct === 0) return 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400';
    if (pct < 40) return 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300';
    if (pct < 75) return 'bg-emerald-500/40 text-emerald-900 dark:text-emerald-200';
    if (pct < 100) return 'bg-emerald-500/70 text-white';
    return 'bg-emerald-500 text-white shadow-2xs font-bold'; // 100%
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Month Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
            {monthName}
          </h2>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            {monthlyCompletionRate}% tasa mensual
          </span>
        </div>

        <div className="flex items-center space-x-1 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 self-start sm:self-auto">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            title="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentMonthDate(new Date())}
            className="px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          >
            Mes actual
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            title="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
        <span>Lun</span>
        <span>Mar</span>
        <span>Mié</span>
        <span>Jue</span>
        <span>Vie</span>
        <span>Sáb</span>
        <span>Dom</span>
      </div>

      {/* Calendar Matrix */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {daysArray.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="aspect-square rounded-xl opacity-0" />;
          }

          const colorClasses = getHeatmapColor(day.pct, day.isSelected);

          return (
            <button
              key={day.dateKey}
              onClick={() => onSelectDate(day.dateKey)}
              title={`${day.dateKey}: ${day.completed} de ${day.total} hábitos (${day.pct}%)`}
              className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-between transition-all duration-150 text-xs relative group ${colorClasses} hover:opacity-90`}
            >
              <span
                className={`text-[11px] font-semibold ${
                  day.isToday ? 'underline underline-offset-2 decoration-2 decoration-amber-400' : ''
                }`}
              >
                {day.dayNum}
              </span>

              {day.pct === 100 && (
                <span className="text-[9px] -mt-1 hidden sm:inline">★</span>
              )}

              <span className="text-[9px] opacity-80 font-mono hidden sm:block">
                {day.completed}/{day.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Heatmap Legend */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center space-x-1.5">
          <span>Menos</span>
          <div className="w-3 h-3 rounded-xs bg-zinc-100 dark:bg-zinc-800" />
          <div className="w-3 h-3 rounded-xs bg-emerald-500/20" />
          <div className="w-3 h-3 rounded-xs bg-emerald-500/50" />
          <div className="w-3 h-3 rounded-xs bg-emerald-500" />
          <span>Más</span>
        </div>

        <div className="flex items-center space-x-1">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>Día perfecto (100%)</span>
        </div>
      </div>

      {/* Monthly Statistics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Completados en el mes</span>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              {totalMonthCompleted} hábitos
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Promedio diario</span>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              {avgDaily} hábitos / día
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Star className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Días perfectos</span>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              {perfectDaysCount} días al 100%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
