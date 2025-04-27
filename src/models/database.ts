import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Initialize database
export async function initDatabase() {
  const db = await open({
    filename: './scrum.db',
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
  });

  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON');

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS columns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      position INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      column_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      position INTEGER NOT NULL,
      color TEXT DEFAULT '#FFFFFF',
      priority INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
    );
  `);

  return db;
}

// Project model
export interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

// Column model
export interface Column {
  id: number;
  project_id: number;
  name: string;
  position: number;
}

// Task model
export interface Task {
  id: number;
  column_id: number;
  title: string;
  description?: string;
  position: number;
  color?: string;
  priority?: number;
  created_at: string;
} 