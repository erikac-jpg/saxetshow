import type { SQLDatabase } from '../SQLDatabase';
import type { User, UserRole } from '../types';
import { nowIso } from './shared';

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateUserInput {
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  phone?: string | null;
}

export async function createUser(db: SQLDatabase, input: CreateUserInput): Promise<User> {
  const now = nowIso();
  const result = await db.runAsync(
    `INSERT INTO users (name, email, role, phone, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.name, input.email, input.role, input.phone ?? null, now, now]
  );
  const user = await getUserById(db, result.lastInsertRowId);
  if (!user) {
    throw new Error('Failed to create user');
  }
  return user;
}

export async function getUserById(db: SQLDatabase, id: number): Promise<User | null> {
  const row = await db.getFirstAsync<UserRow>('SELECT * FROM users WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function getUserByEmail(db: SQLDatabase, email: string): Promise<User | null> {
  const row = await db.getFirstAsync<UserRow>('SELECT * FROM users WHERE email = ?', [email]);
  return row ? mapRow(row) : null;
}

export async function getAllUsers(db: SQLDatabase): Promise<User[]> {
  const rows = await db.getAllAsync<UserRow>('SELECT * FROM users ORDER BY name ASC', []);
  return rows.map(mapRow);
}

export async function updateUser(
  db: SQLDatabase,
  id: number,
  input: UpdateUserInput
): Promise<User | null> {
  const existing = await getUserById(db, id);
  if (!existing) {
    return null;
  }
  await db.runAsync(
    `UPDATE users SET name = ?, email = ?, role = ?, phone = ?, updated_at = ? WHERE id = ?`,
    [
      input.name ?? existing.name,
      input.email ?? existing.email,
      input.role ?? existing.role,
      input.phone !== undefined ? input.phone : existing.phone,
      nowIso(),
      id,
    ]
  );
  return getUserById(db, id);
}

export async function deleteUser(db: SQLDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM users WHERE id = ?', [id]);
}
