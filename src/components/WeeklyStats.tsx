import React from 'react';
import { TrendingUp, Award, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Habit, HabitLog } from '../types';
import { formatDateKey } from '../services/storageService';

interface WeeklyStatsProps {
  habits: Habit[];
  logs: HabitLog[];
  selectedDate: string; // 'YYYY-MM-DD'
  onSelectDate: (date: string) => void;
}

export const WeeklyStats: React.FC<WeeklyStatsProps> = ({
  habits,
  logs,
  selectedDate,
  onSelectDate,
}) => {
  // Compute start of current week (Monday) based on selectedDate
  const curr = new Date(selectedDate + 'T00:00:00');
  const dayOfWeek = (curr.getDay() + 6) % 7; // 0 for Mon, 6 for Sun
  const monday = new Date(curr);
  monday.setDate(curr.getDate() - dayOfWeek);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = formatDateKey(d);
    const dayHabitLogs = logs.filter((l) => l.date === key && l.completed);
    const total = habits.length;
    const completed = dayHabitLogs.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const dayShorts = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return {
      date: d,
      key,
      dayName: dayShorts[i],
      dayNum: d.getDate(),
      completed,
      total,
      percentage: pct,
      isToday: key === formatDateKey(new Date()),
      isSelected: key === selectedDate,
    };
  });

  // Calculate week average percentage
  const totalCompletedInWeek = weekDays.reduce((acc, d) => acc + d.completed, 0);
  const totalPossibleInWeek = habits.length * 7;
  const weekPercentage = totalPossibleInWeek > 0
    ? Math.round((totalCompletedInWeek / totalPossibleInWeek) * 100)
    : 0;

  // Best day
  const bestDay = [...weekDays].sort((a, b) => b.completed - a.completed)[0];

  const handlePrevWeek = () => {
    const prev = new Date(monday);
    prev.setDate(monday.getDate() - 7);
    onSelectDate(formatDateKey(prev));
  };

  const handleNextWeek = () => {
    const next = new Date(monday);
    next.setDate(monday.getDate() + 7);
    onSelectDate(formatDateKey(next));
  };

  const handleCurrentWeek = () => {
    onSelectDate(formatDateKey(new Date()));
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header and Week Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Progreso Semanal
            </h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {weekPercentage}% completado
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Semana del {weekDays[0].dayNum} al {weekDays[6].dayNum} de{' '}
            {weekDays[0].date.toLocaleDateString('es-ES', { month: 'long' })}
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={handleCurrentWeek}
            className="px-2.5 py-1 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Hoy
          </button>
          <div className="flex items-center space-x-1 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={handlePrevWeek}
              className="p-1 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Week Interactive Bar Graph */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3 pt-2">
        {weekDays.map((d) => (
          <button
            key={d.key}
            onClick={() => onSelectDate(d.key)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer text-center group ${
              d.isSelected
                ? 'bg-zinc-900 text-white dark:bg-emerald-500/20 dark:text-emerald-300 ring-2 ring-zinc-900 dark:ring-emerald-500'
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            }`}
          >
            <span
              className={`text-[11px] font-medium ${
                d.isSelected
                  ? 'text-zinc-300 dark:text-emerald-300'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              {d.dayName}
            </span>
            <span
              className={`text-sm font-semibold my-1 ${
                d.isToday
                  ? 'text-emerald-500 dark:text-emerald-400 font-bold'
                  : d.isSelected
                  ? 'text-white dark:text-white'
                  : 'text-zinc-800 dark:text-zinc-200'
              }`}
            >
              {d.dayNum}
            </span>

            {/* Vertical Bar Visual */}
            <div className="w-full h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 flex flex-col justify-end overflow-hidden my-1">
              <div
                className={`w-full rounded-md transition-all duration-300 ${
                  d.percentage >= 80
                    ? 'bg-emerald-500'
                    : d.percentage >= 50
                    ? 'bg-teal-500'
                    : d.percentage > 0
                    ? 'bg-amber-500'
                    : 'bg-transparent'
                }`}
                style={{ height: `${Math.max(6, d.percentage)}%` }}
              />
            </div>

            <span
              className={`text-[10px] font-mono ${
                d.isSelected
                  ? 'text-zinc-300 dark:text-emerald-300'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              {d.completed}/{d.total}
            </span>
          </button>
        ))}
      </div>

      {/* Highlights & Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Cumplimiento</span>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              {totalCompletedInWeek} de {totalPossibleInWeek} hábitos
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Tasa Semanal</span>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">{weekPercentage}%</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Día más activo</span>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              {bestDay?.dayName} ({bestDay?.completed} hábitos)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
