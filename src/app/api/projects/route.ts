import { NextResponse } from "next/server";
import { initDatabase } from "@/models/database";

export async function GET() {
  const db = await initDatabase();
  const projects = await db.all(
    "SELECT * FROM projects ORDER BY created_at DESC"
  );
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const db = await initDatabase();
  const { name, description } = await request.json();

  const result = await db.run(
    "INSERT INTO projects (name, description) VALUES (?, ?)",
    [name, description]
  );

  // Create default columns for the new project
  const defaultColumns = [
    { name: "Backlog", position: 0 },
    { name: "To Do", position: 1 },
    { name: "In Progress", position: 2 },
    { name: "Review", position: 3 },
    { name: "Done", position: 4 },
  ];

  for (const column of defaultColumns) {
    await db.run(
      "INSERT INTO columns (project_id, name, position) VALUES (?, ?, ?)",
      [result.lastID, column.name, column.position]
    );
  }

  return NextResponse.json({ id: result.lastID, name, description });
}

export async function PUT(request: Request) {
  const db = await initDatabase();
  const { id, name } = await request.json();

  if (!id || !name) {
    return new Response(
      JSON.stringify({ error: "Project ID and name are required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    await db.run("UPDATE projects SET name = ? WHERE id = ?", [name, id]);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return new Response(JSON.stringify({ error: "Failed to update project" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(request: Request) {
  const db = await initDatabase();
  const { id } = await request.json();

  if (!id) {
    return new Response(JSON.stringify({ error: "Project ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // First delete all tasks in the project's columns
    await db.run(
      "DELETE FROM tasks WHERE column_id IN (SELECT id FROM columns WHERE project_id = ?)",
      [id]
    );
    // Then delete all columns in the project
    await db.run("DELETE FROM columns WHERE project_id = ?", [id]);
    // Finally delete the project
    await db.run("DELETE FROM projects WHERE id = ?", [id]);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return new Response(JSON.stringify({ error: "Failed to delete project" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
