import mongoose, { Schema, Document } from 'mongoose';

export interface IHabit extends Document {
  userId: string;
  title: string;
  description?: string;
  category: string;
  frequency: string;
  goalType: string;
  targetValue?: number;
  unit?: string;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

const HabitSchema = new Schema<IHabit>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, default: 'salud' },
    frequency: { type: String, default: 'daily' },
    goalType: { type: String, default: 'boolean' },
    targetValue: { type: Number },
    unit: { type: String },
    color: { type: String, default: '#10B981' },
    icon: { type: String, default: '🎯' },
  },
  { timestamps: true }
);

export interface IHabitLog extends Document {
  userId: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  value?: number;
  notes?: string;
  completedAt?: Date;
  source?: string;
}

const HabitLogSchema = new Schema<IHabitLog>(
  {
    userId: { type: String, required: true, index: true },
    habitId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    completed: { type: Boolean, default: false },
    value: { type: Number },
    notes: { type: String },
    completedAt: { type: Date },
    source: { type: String, default: 'manual' },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate logs per habit per date
HabitLogSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });

export const HabitModel =
  mongoose.models.Habit || mongoose.model<IHabit>('Habit', HabitSchema);

export const HabitLogModel =
  mongoose.models.HabitLog || mongoose.model<IHabitLog>('HabitLog', HabitLogSchema);
