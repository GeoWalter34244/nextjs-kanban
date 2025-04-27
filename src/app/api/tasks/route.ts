import { NextResponse } from 'next/server';
import { initDatabase } from '@/models/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const columnId = searchParams.get('columnId');
  
  const db = await initDatabase();
  const tasks = await db.all(
    'SELECT * FROM tasks WHERE column_id = ? ORDER BY position',
    [columnId]
  );
  
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  try {
    const db = await initDatabase();
    const { columnId, title, description, position, color } = await request.json();
    
    if (!columnId || !title) {
      return NextResponse.json({ error: 'columnId and title are required' }, { status: 400 });
    }
    
    const result = await db.run(
      'INSERT INTO tasks (column_id, title, description, position, color) VALUES (?, ?, ?, ?, ?)',
      [columnId, title, description, position, color || '#3B82F6']
    );
    
    if (!result.lastID) {
      throw new Error('Failed to insert task');
    }
    
    return NextResponse.json({ 
      id: result.lastID,
      column_id: columnId, 
      title, 
      description, 
      position,
      color: color || '#3B82F6'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const db = await initDatabase();
    const { id, columnId, position, priority, color, title } = await request.json();
    
    if (priority !== undefined) {
      // Update task priority
      await db.run(
        'UPDATE tasks SET priority = ? WHERE id = ?',
        [priority, id]
      );
    } else if (color !== undefined) {
      // Update task color
      await db.run(
        'UPDATE tasks SET color = ? WHERE id = ?',
        [color, id]
      );
      
      // Get the updated task
      const updatedTask = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
      return NextResponse.json(updatedTask);
    } else if (title !== undefined) {
      // Update task title
      await db.run(
        'UPDATE tasks SET title = ? WHERE id = ?',
        [title, id]
      );
      
      // Get the updated task
      const updatedTask = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
      return NextResponse.json(updatedTask);
    } else if (columnId !== undefined && position !== undefined) {
      // Update task position and column
      await db.run(
        'UPDATE tasks SET column_id = ?, position = ? WHERE id = ?',
        [columnId, position, id]
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  
  if (!id) {
    return new Response(JSON.stringify({ error: 'Task ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const db = await initDatabase();
    await db.run('DELETE FROM tasks WHERE id = ?', [id]);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete task' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 