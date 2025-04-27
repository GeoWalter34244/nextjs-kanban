import { NextResponse } from 'next/server';
import { initDatabase } from '@/models/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  
  const db = await initDatabase();
  const columns = await db.all(
    'SELECT * FROM columns WHERE project_id = ? ORDER BY position',
    [projectId]
  );
  
  return NextResponse.json(columns);
}

export async function POST(request: Request) {
  const db = await initDatabase();
  const { projectId, name, position } = await request.json();
  
  const result = await db.run(
    'INSERT INTO columns (project_id, name, position) VALUES (?, ?, ?)',
    [projectId, name, position]
  );
  
  return NextResponse.json({ id: result.lastID, projectId, name, position });
}

export async function PUT(request: Request) {
  const db = await initDatabase();
  const { id, position } = await request.json();
  
  await db.run(
    'UPDATE columns SET position = ? WHERE id = ?',
    [position, id]
  );
  
  return NextResponse.json({ success: true });
} 