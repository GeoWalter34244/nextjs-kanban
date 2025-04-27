import { initDatabase } from "@/models/database";

async function initDb() {
  const db = await initDatabase();

  // Create default columns for each project
  const defaultColumns = [
    { name: "Backlog", position: 0 },
    { name: "To Do", position: 1 },
    { name: "In Progress", position: 2 },
    { name: "Review", position: 3 },
    { name: "Done", position: 4 },
  ];

  // Get all projects
  const projects = await db.all("SELECT id FROM projects");

  // Create default columns for each project
  for (const project of projects) {
    // Get existing columns for this project
    const existingColumns = await db.all(
      "SELECT name FROM columns WHERE project_id = ?",
      [project.id]
    );

    const existingColumnNames = new Set(existingColumns.map((col) => col.name));

    // Only add columns that don't exist
    for (const column of defaultColumns) {
      if (!existingColumnNames.has(column.name)) {
        await db.run(
          "INSERT INTO columns (project_id, name, position) VALUES (?, ?, ?)",
          [project.id, column.name, column.position]
        );
        console.log(`Added column '${column.name}' to project ${project.id}`);
      }
    }
  }

  console.log("Database initialization completed");
  process.exit(0);
}

initDb().catch(console.error);
