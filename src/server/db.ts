import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { UserModel, HabitModel, HabitLogModel } from './models';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LOCAL_DB_FILE = path.join(DATA_DIR, 'mongodb_store.json');

interface LocalDbSchema {
  users?: Array<{
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    createdAt: string;
    lastLoginAt: string;
  }>;
  habits: Array<{
    id: string;
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
    createdAt: string;
    updatedAt: string;
  }>;
  logs: Array<{
    id: string;
    userId: string;
    habitId: string;
    date: string;
    completed: boolean;
    value?: number;
    notes?: string;
    completedAt?: string;
    source?: string;
  }>;
}

let isMongooseConnected = false;

// Ensure local backup directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const readLocalStore = (): LocalDbSchema => {
  try {
    if (!fs.existsSync(LOCAL_DB_FILE)) {
      const empty: LocalDbSchema = { users: [], habits: [], logs: [] };
      fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(empty, null, 2), 'utf-8');
      return empty;
    }
    const raw = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.users) parsed.users = [];
    return parsed;
  } catch {
    return { users: [], habits: [], logs: [] };
  }
};

const writeLocalStore = (data: LocalDbSchema) => {
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to local JSON store:', err);
  }
};

export const initDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri && mongoUri.trim().length > 0) {
    try {
      console.log('Connecting to MongoDB Atlas / Remote...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      isMongooseConnected = true;
      console.log('✅ Connected successfully to MongoDB!');
    } catch (err) {
      console.warn('⚠️ Could not connect to remote MongoDB URI, using persistent document store:', err);
      isMongooseConnected = false;
    }
  } else {
    console.log('ℹ️ MONGODB_URI not configured in .env. Using persistent document engine.');
  }
};

export const getDbStatus = () => {
  const uriConfigured = !!(process.env.MONGODB_URI && process.env.MONGODB_URI.trim().length > 0);
  return {
    isMongooseConnected,
    uriConfigured,
    mode: isMongooseConnected ? 'mongodb_atlas' : 'local_store',
  };
};

// Register/Sync User in MongoDB
export const syncUserToDb = async (userData: {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}) => {
  if (isMongooseConnected) {
    const user = await UserModel.findOneAndUpdate(
      { uid: userData.uid },
      {
        $set: {
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          lastLoginAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true }
    );
    return user;
  }

  const store = readLocalStore();
  if (!store.users) store.users = [];
  const idx = store.users.findIndex((u) => u.uid === userData.uid);
  const now = new Date().toISOString();
  if (idx >= 0) {
    store.users[idx] = {
      ...store.users[idx],
      ...userData,
      lastLoginAt: now,
    };
  } else {
    store.users.push({
      ...userData,
      createdAt: now,
      lastLoginAt: now,
    });
  }
  writeLocalStore(store);
  return userData;
};

// Assign habits from a temporary guest session to the authenticated user
export const assignHabitsToUser = async (fromUserId: string, toUserId: string) => {
  if (!fromUserId || !toUserId || fromUserId === toUserId) return;
  if (isMongooseConnected) {
    await HabitModel.updateMany({ userId: fromUserId }, { $set: { userId: toUserId } });
    await HabitLogModel.updateMany({ userId: fromUserId }, { $set: { userId: toUserId } });
    return;
  }

  const store = readLocalStore();
  store.habits.forEach((h) => {
    if (h.userId === fromUserId) h.userId = toUserId;
  });
  store.logs.forEach((l) => {
    if (l.userId === fromUserId) l.userId = toUserId;
  });
  writeLocalStore(store);
};

// Unified Repository methods
export const getHabitsByUser = async (userId: string) => {
  if (isMongooseConnected) {
    const docs = await HabitModel.find({ userId }).sort({ createdAt: -1 });
    return docs.map((d) => ({
      id: d._id.toString(),
      userId: d.userId,
      title: d.title,
      description: d.description,
      category: d.category,
      frequency: d.frequency,
      goalType: d.goalType,
      targetValue: d.targetValue,
      unit: d.unit,
      color: d.color,
      icon: d.icon,
      createdAt: d.createdAt ? d.createdAt.toISOString() : new Date().toISOString(),
    }));
  }

  const store = readLocalStore();
  return store.habits.filter((h) => h.userId === userId);
};

export const createHabitForUser = async (userId: string, data: Record<string, unknown>) => {
  if (isMongooseConnected) {
    const doc = await HabitModel.create({
      ...data,
      userId,
    });
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      frequency: doc.frequency,
      goalType: doc.goalType,
      targetValue: doc.targetValue,
      unit: doc.unit,
      color: doc.color,
      icon: doc.icon,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  const store = readLocalStore();
  const newHabit = {
    id: `habit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    title: String(data.title || 'Hábito'),
    description: data.description ? String(data.description) : undefined,
    category: String(data.category || 'salud'),
    frequency: String(data.frequency || 'daily'),
    goalType: String(data.goalType || 'boolean'),
    targetValue: data.targetValue ? Number(data.targetValue) : undefined,
    unit: data.unit ? String(data.unit) : undefined,
    color: String(data.color || '#10B981'),
    icon: String(data.icon || '🎯'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.habits.unshift(newHabit);
  writeLocalStore(store);
  return newHabit;
};

export const updateHabitForUser = async (
  userId: string,
  habitId: string,
  data: Record<string, unknown>
) => {
  if (isMongooseConnected) {
    const updated = await HabitModel.findOneAndUpdate(
      { _id: habitId, userId },
      { $set: data },
      { new: true }
    );
    if (!updated) return null;
    return {
      id: updated._id.toString(),
      userId: updated.userId,
      title: updated.title,
      description: updated.description,
      category: updated.category,
      frequency: updated.frequency,
      goalType: updated.goalType,
      targetValue: updated.targetValue,
      unit: updated.unit,
      color: updated.color,
      icon: updated.icon,
      createdAt: updated.createdAt ? updated.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  const store = readLocalStore();
  const index = store.habits.findIndex((h) => h.id === habitId && h.userId === userId);
  if (index === -1) return null;

  store.habits[index] = {
    ...store.habits[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  writeLocalStore(store);
  return store.habits[index];
};

export const deleteHabitForUser = async (userId: string, habitId: string) => {
  if (isMongooseConnected) {
    await HabitModel.deleteOne({ _id: habitId, userId });
    await HabitLogModel.deleteMany({ habitId, userId });
    return true;
  }

  const store = readLocalStore();
  store.habits = store.habits.filter((h) => !(h.id === habitId && h.userId === userId));
  store.logs = store.logs.filter((l) => !(l.habitId === habitId && l.userId === userId));
  writeLocalStore(store);
  return true;
};

export const getLogsByUser = async (userId: string) => {
  if (isMongooseConnected) {
    const docs = await HabitLogModel.find({ userId });
    return docs.map((d) => ({
      id: d._id.toString(),
      userId: d.userId,
      habitId: d.habitId,
      date: d.date,
      completed: d.completed,
      value: d.value,
      notes: d.notes,
      completedAt: d.completedAt ? d.completedAt.toISOString() : undefined,
      source: d.source || 'manual',
    }));
  }

  const store = readLocalStore();
  return store.logs.filter((l) => l.userId === userId);
};

export const upsertLogForUser = async (
  userId: string,
  habitId: string,
  date: string,
  data: { completed: boolean; value?: number; notes?: string; source?: string }
) => {
  if (isMongooseConnected) {
    const updated = await HabitLogModel.findOneAndUpdate(
      { userId, habitId, date },
      {
        $set: {
          completed: data.completed,
          value: data.value,
          notes: data.notes,
          source: data.source || 'manual',
          completedAt: data.completed ? new Date() : undefined,
        },
      },
      { upsert: true, new: true }
    );
    return {
      id: updated._id.toString(),
      userId: updated.userId,
      habitId: updated.habitId,
      date: updated.date,
      completed: updated.completed,
      value: updated.value,
      notes: updated.notes,
      completedAt: updated.completedAt ? updated.completedAt.toISOString() : undefined,
      source: updated.source || 'manual',
    };
  }

  const store = readLocalStore();
  const existingIndex = store.logs.findIndex(
    (l) => l.userId === userId && l.habitId === habitId && l.date === date
  );

  const logPayload = {
    id: existingIndex >= 0 ? store.logs[existingIndex].id : `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    habitId,
    date,
    completed: data.completed,
    value: data.value,
    notes: data.notes,
    completedAt: data.completed ? new Date().toISOString() : undefined,
    source: data.source || 'manual',
  };

  if (existingIndex >= 0) {
    store.logs[existingIndex] = { ...store.logs[existingIndex], ...logPayload };
  } else {
    store.logs.push(logPayload);
  }

  writeLocalStore(store);
  return logPayload;
};
