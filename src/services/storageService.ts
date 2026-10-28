import type { Habit, HabitLog } from '../types';

const THEME_KEY = 'habitpulse_theme';

// Format date as 'YYYY-MM-DD'
export const formatDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getTodayKey = (): string => {
  return formatDateKey(new Date());
};

export const getStoredTheme = (): 'dark' | 'light' => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    return 'dark';
  }
};

export const saveTheme = (theme: 'dark' | 'light') => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore in private browsing
  }
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Calculate streak stats for a single habit
export const calculateHabitStreak = (
  habitId: string,
  logs: HabitLog[]
): { currentStreak: number; longestStreak: number; totalCompleted: number } => {
  const habitLogs = logs
    .filter((l) => l.habitId === habitId && l.completed)
    .sort((a, b) => b.date.localeCompare(a.date));

  const completedDates = new Set(habitLogs.map((l) => l.date));
  const totalCompleted = completedDates.size;

  const today = new Date();
  const todayKey = formatDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  let currentStreak = 0;
  let checkDate = new Date(today);

  if (!completedDates.has(todayKey)) {
    if (completedDates.has(yesterdayKey)) {
      checkDate = yesterday;
    } else {
      checkDate = new Date(today);
    }
  }

  while (true) {
    const dKey = formatDateKey(checkDate);
    if (completedDates.has(dKey)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const sortedAscDates = Array.from(completedDates).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDateObj: Date | null = null;

  for (const dateStr of sortedAscDates) {
    const curr = new Date(dateStr + 'T00:00:00');
    if (!prevDateObj) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((curr.getTime() - prevDateObj.getTime()) / 86400000);
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    prevDateObj = curr;
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalCompleted,
  };
};

// Calculate global streak (days where at least 1 habit was completed)
export const calculateOverallStreak = (
  habits: Habit[],
  logs: HabitLog[]
): { currentStreak: number; longestStreak: number } => {
  if (habits.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const dayCompletionCounts: Record<string, number> = {};
  logs.forEach((log) => {
    if (log.completed) {
      dayCompletionCounts[log.date] = (dayCompletionCounts[log.date] || 0) + 1;
    }
  });

  const activeDates = new Set(
    Object.keys(dayCompletionCounts).filter((date) => (dayCompletionCounts[date] || 0) >= 1)
  );

  const today = new Date();
  const todayKey = formatDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  let currentStreak = 0;
  let checkDate = new Date(today);

  if (!activeDates.has(todayKey)) {
    if (activeDates.has(yesterdayKey)) {
      checkDate = yesterday;
    }
  }

  while (true) {
    const dKey = formatDateKey(checkDate);
    if (activeDates.has(dKey)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const sortedAsc = Array.from(activeDates).sort();
  let longest = 0;
  let running = 0;
  let prev: Date | null = null;

  for (const dStr of sortedAsc) {
    const cur = new Date(dStr + 'T00:00:00');
    if (!prev) {
      running = 1;
    } else {
      const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
      if (diff === 1) {
        running++;
      } else if (diff > 1) {
        running = 1;
      }
    }
    prev = cur;
    if (running > longest) longest = running;
  }

  return {
    currentStreak,
    longestStreak: Math.max(longest, currentStreak),
  };
};
