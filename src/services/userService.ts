import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { USERS_FILE_PATH } from '../config/dataPaths.js';

export interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  apiKey?: string;
  createdAt: string;
}

const SALT_ROUNDS = 10;

async function ensureDir(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

export async function readUsers(): Promise<StoredUser[]> {
  try {
    await ensureDir(USERS_FILE_PATH);
    const raw = await fs.readFile(USERS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeUsers(users: StoredUser[]): Promise<void> {
  await ensureDir(USERS_FILE_PATH);
  await fs.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf-8');
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function findUserByUsername(username: string): Promise<StoredUser | null> {
  const users = await readUsers();
  const normalized = username.trim().toLowerCase();
  return users.find((u) => u.username.toLowerCase() === normalized) ?? null;
}

export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function findUserByApiKey(apiKey: string): Promise<StoredUser | null> {
  if (!apiKey || !apiKey.trim()) return null;
  const users = await readUsers();
  return users.find((u) => u.apiKey && u.apiKey.trim() === apiKey.trim()) ?? null;
}

export async function updateUserApiKey(userId: string, apiKey: string): Promise<void> {
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return;
  users[idx] = { ...users[idx], apiKey };
  await writeUsers(users);
}

export async function createUser(username: string, password: string): Promise<{ user: StoredUser } | { alreadyExists: true }> {
  const normalized = username.trim();
  if (!normalized) throw new Error('Username is required');
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters');

  const existing = await findUserByUsername(normalized);
  if (existing) return { alreadyExists: true };

  const users = await readUsers();
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const passwordHash = await hashPassword(password);
  const apiKey = generateApiKey();
  const user: StoredUser = {
    id,
    username: normalized,
    passwordHash,
    apiKey,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  await writeUsers(users);
  return { user };
}
