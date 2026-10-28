import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Habit, HabitCategory, HabitGoalType } from '../types';

interface HabitFormModalProps {
  isOpen: boolean;
  habitToEdit?: Habit | null;
  onClose: () => void;
  onSave: (habitData: Partial<Habit>) => void;
}

const CATEGORIES: { id: HabitCategory; label: string; icon: string; defaultColor: string }[] = [
  { id: 'salud', label: 'Salud', icon: '❤️', defaultColor: '#10B981' },
  { id: 'fitness', label: 'Fitness', icon: '⚡', defaultColor: '#F59E0B' },
  { id: 'mente', label: 'Mente', icon: '🧘', defaultColor: '#8B5CF6' },
  { id: 'productividad', label: 'Productividad', icon: '💼', defaultColor: '#3B82F6' },
  { id: 'creatividad', label: 'Creatividad', icon: '🎨', defaultColor: '#EC4899' },
  { id: 'nutricion', label: 'Nutrición', icon: '🥑', defaultColor: '#06B6D4' },
];

export const HabitFormModal: React.FC<HabitFormModalProps> = ({
  isOpen,
  habitToEdit,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('salud');
  const [goalType, setGoalType] = useState<HabitGoalType>('boolean');
  const [targetValue, setTargetValue] = useState<number>(10);
  const [unit, setUnit] = useState('veces');

  useEffect(() => {
    if (habitToEdit) {
      setTitle(habitToEdit.title);
      setDescription(habitToEdit.description || '');
      setCategory(habitToEdit.category);
      setGoalType(habitToEdit.goalType);
      setTargetValue(habitToEdit.targetValue || 10);
      setUnit(habitToEdit.unit || 'veces');
    } else {
      setTitle('');
      setDescription('');
      setCategory('salud');
      setGoalType('boolean');
      setTargetValue(10);
      setUnit('veces');
    }
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const matchedCategory = CATEGORIES.find((c) => c.id === category);

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      frequency: habitToEdit?.frequency || 'daily',
      goalType,
      targetValue: goalType === 'numeric' ? Number(targetValue) : undefined,
      unit: goalType === 'numeric' ? unit.trim() : undefined,
      color: habitToEdit?.color || matchedCategory?.defaultColor || '#10B981',
      icon: habitToEdit?.icon || matchedCategory?.icon || '🎯',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl my-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {habitToEdit ? 'Editar Hábito' : 'Nuevo Hábito'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Rápido y sencillo
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Minimal Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Nombre del hábito */}
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nombre del hábito *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Meditación matutina, 8 vasos de agua, Leer 20 min..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalle o meta personal..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Categoría
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    category === cat.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <span className="block truncate font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de Meta */}
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Tipo de objetivo
            </label>
            <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
              <button
                type="button"
                onClick={() => setGoalType('boolean')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  goalType === 'boolean'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Sí / No (Completar)
              </button>
              <button
                type="button"
                onClick={() => setGoalType('numeric')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  goalType === 'numeric'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Cantidad numérica
              </button>
            </div>
          </div>

          {/* Configuración numérica si corresponde */}
          {goalType === 'numeric' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Meta diaria
                </label>
                <input
                  type="number"
                  min="1"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Unidad
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="vasos, min, págs..."
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-medium shadow-xs transition-all active:scale-95"
            >
              {habitToEdit ? 'Guardar Cambios' : 'Crear Hábito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
