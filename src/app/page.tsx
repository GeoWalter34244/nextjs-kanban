"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Project, Column, Task } from "@/models/database";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, GripVertical, Star, Edit2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Task as TaskComponent } from "@/components/ui/task";

type TasksByColumn = Record<number, Task[]>;

// Mock users data - in a real app, this would come from your backend
const users = [
  {
    id: 1,
    name: "Casey Choi",
    color: "bg-green-100",
    avatar: "/avatars/casey.png",
  },
  {
    id: 2,
    name: "Nadeem Hazir",
    color: "bg-cyan-100",
    avatar: "/avatars/nadeem.png",
  },
  {
    id: 3,
    name: "Nick Fitzpartick",
    color: "bg-purple-100",
    avatar: "/avatars/nick.png",
  },
  {
    id: 4,
    name: "Zoey Green",
    color: "bg-pink-100",
    avatar: "/avatars/zoey.png",
  },
];

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      const savedProject = localStorage.getItem("selectedProject");
      return savedProject ? parseInt(savedProject) : null;
    }
    return null;
  });
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<TasksByColumn>({});
  const [newTaskTitles, setNewTaskTitles] = useState<{ [key: number]: string }>(
    {}
  );
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editedProjectName, setEditedProjectName] = useState("");

  // Update localStorage when selectedProject changes
  useEffect(() => {
    if (selectedProject !== null) {
      localStorage.setItem("selectedProject", selectedProject.toString());
    } else {
      localStorage.removeItem("selectedProject");
    }
  }, [selectedProject]);

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch columns when project is selected
  useEffect(() => {
    if (selectedProject) {
      fetchColumns();
    }
  }, [selectedProject]);

  // Fetch tasks when columns change
  useEffect(() => {
    if (columns.length > 0) {
      fetchTasks();
    }
  }, [columns]);

  const fetchProjects = async () => {
    const response = await fetch("/api/projects");
    const data = await response.json();
    setProjects(data);
  };

  const fetchColumns = async () => {
    const response = await fetch(`/api/columns?projectId=${selectedProject}`);
    const data = await response.json();
    setColumns(data);
  };

  const fetchTasks = async () => {
    const tasksMap: { [key: number]: Task[] } = {};
    for (const column of columns) {
      const response = await fetch(`/api/tasks?columnId=${column.id}`);
      const data = await response.json();
      tasksMap[column.id] = data;
    }
    setTasks(tasksMap);
  };

  const handleCreateProject = async (name: string) => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const newProject = await response.json();
    setProjects([...projects, newProject]);
  };

  const handleTaskTitleChange = async (taskId: number, title: string) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          title,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task title");
      }

      const updatedTask = await response.json();

      // Update local state
      setTasks((prev) => {
        const newTasks = { ...prev };
        for (const [columnId, tasks] of Object.entries(prev)) {
          newTasks[columnId] = tasks.map((t) =>
            t.id === taskId ? { ...t, title } : t
          );
        }
        return newTasks;
      });
    } catch (error) {
      console.error("Error updating task title:", error);
    }
  };

  const createTask = async (columnId: number) => {
    const title = newTaskTitles[columnId];
    if (!title) return;

    try {
      const requestData = {
        columnId,
        title,
        position: tasks[columnId]?.length || 0,
      };
      console.log("Creating task with data:", requestData);

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorText}`
        );
      }

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      let newTask;
      try {
        newTask = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Response text:", responseText);
        throw parseError;
      }

      setTasks((prev) => ({
        ...prev,
        [columnId]: [...(prev[columnId] || []), newTask],
      }));

      // Clear the input field
      setNewTaskTitles((prev) => ({
        ...prev,
        [columnId]: "",
      }));
    } catch (error) {
      console.error("Error creating task:", error);
      // You might want to show an error message to the user here
    }
  };

  const handlePriorityToggle = async (taskId: number) => {
    const task = Object.values(tasks)
      .flat()
      .find((t) => t.id === taskId);

    if (task) {
      const newPriority = task.priority === 1 ? 0 : 1;

      try {
        const response = await fetch("/api/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: taskId,
            priority: newPriority,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update task priority");
        }

        // Update local state
        setTasks((prev) => {
          const newTasks = { ...prev };
          Object.entries(newTasks).forEach(([columnId, columnTasks]) => {
            newTasks[parseInt(columnId)] = columnTasks.map((t) =>
              t.id === taskId ? { ...t, priority: newPriority } : t
            );
          });
          return newTasks;
        });
      } catch (error) {
        console.error("Error toggling priority:", error);
      }
    }
  };

  const handleColorChange = async (taskId: number, color: string) => {
    try {
      console.log("Updating color to:", color);

      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          color,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task color");
      }

      const updatedTask = await response.json();
      console.log("Updated task:", updatedTask);

      // Update local state
      setTasks((prev) => {
        const newTasks = { ...prev };
        for (const columnId in prev) {
          newTasks[columnId] = prev[columnId].map((task) =>
            task.id === taskId ? { ...task, color } : task
          );
        }
        return newTasks;
      });
    } catch (error) {
      console.error("Error updating task color:", error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      // Update local state
      setTasks((prev) => {
        const newTasks = { ...prev };
        for (const [columnId, tasks] of Object.entries(prev)) {
          newTasks[parseInt(columnId)] = tasks.filter((t) => t.id !== taskId);
        }
        return newTasks;
      });
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // If dropped in the same column
    if (source.droppableId === destination.droppableId) {
      const columnId = parseInt(source.droppableId);
      const columnTasks = [...tasks[columnId]];
      const [movedTask] = columnTasks.splice(source.index, 1);
      columnTasks.splice(destination.index, 0, movedTask);

      setTasks({
        ...tasks,
        [columnId]: columnTasks,
      });

      // Update task position in database
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draggableId,
          columnId,
          position: destination.index,
        }),
      });
    } else {
      // If dropped in a different column
      const sourceColumnId = parseInt(source.droppableId);
      const destColumnId = parseInt(destination.droppableId);

      const sourceTasks = [...tasks[sourceColumnId]];
      const destTasks = [...(tasks[destColumnId] || [])];

      const [movedTask] = sourceTasks.splice(source.index, 1);
      destTasks.splice(destination.index, 0, {
        ...movedTask,
        column_id: destColumnId,
      });

      setTasks({
        ...tasks,
        [sourceColumnId]: sourceTasks,
        [destColumnId]: destTasks,
      });

      // Update task position and column in database
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draggableId,
          columnId: destColumnId,
          position: destination.index,
        }),
      });
    }
  };

  const handleProjectNameChange = async (
    projectId: number,
    newName: string
  ) => {
    try {
      const response = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, name: newName }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project name");
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, name: newName } : p))
      );
      setIsEditingProject(false);
    } catch (error) {
      console.error("Error updating project name:", error);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        className="w-64 border-r bg-gray-100/40"
        projects={projects}
        selectedProject={selectedProject}
        onProjectSelect={setSelectedProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={fetchProjects}
      />
      <div className="flex-1 overflow-auto">
        <div className="h-full px-8 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-700"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">
                {selectedProject ? (
                  isEditingProject ? (
                    <input
                      type="text"
                      value={editedProjectName}
                      onChange={(e) => setEditedProjectName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleProjectNameChange(
                            selectedProject,
                            editedProjectName
                          );
                        } else if (e.key === "Escape") {
                          setIsEditingProject(false);
                        }
                      }}
                      onBlur={() =>
                        handleProjectNameChange(
                          selectedProject,
                          editedProjectName
                        )
                      }
                      className="text-2xl font-bold border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      {projects.find((p) => p.id === selectedProject)?.name}
                      <button
                        onClick={() => {
                          setEditedProjectName(
                            projects.find((p) => p.id === selectedProject)
                              ?.name || ""
                          );
                          setIsEditingProject(true);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                ) : (
                  "Select a Project"
                )}
              </h1>
            </div>
          </div>

          {/* Board */}
          {selectedProject && (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-5 gap-6">
                {columns.map((column) => (
                  <Droppable key={column.id} droppableId={column.id.toString()}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`bg-gray-50 rounded-lg p-4 ${
                          snapshot.isDraggingOver ? "bg-gray-100" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900">
                            {column.name}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {tasks[column.id]?.length || 0}
                          </span>
                        </div>

                        {/* Task Input */}
                        <div className="mb-4">
                          <Input
                            value={newTaskTitles[column.id] || ""}
                            onChange={(e) =>
                              setNewTaskTitles((prev) => ({
                                ...prev,
                                [column.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                newTaskTitles[column.id]?.trim()
                              ) {
                                createTask(column.id);
                              }
                            }}
                            placeholder="Add a new task"
                            className="bg-white"
                          />
                          <Button
                            onClick={() => createTask(column.id)}
                            className="w-full mt-2"
                            variant="outline"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Task
                          </Button>
                        </div>

                        {/* Tasks Container */}
                        <div className="relative">
                          {/* Tasks List */}
                          <div className="space-y-3">
                            {tasks[column.id]?.map((task, index) => (
                              <div key={task.id} className="relative">
                                <Draggable
                                  key={task.id}
                                  draggableId={task.id.toString()}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <TaskComponent
                                      task={task}
                                      provided={provided}
                                      snapshot={snapshot}
                                      onPriorityToggle={() =>
                                        handlePriorityToggle(task.id)
                                      }
                                      onColorChange={(id, color) =>
                                        handleColorChange(task.id, color)
                                      }
                                      onTitleChange={(id, title) =>
                                        handleTaskTitleChange(id, title)
                                      }
                                      onDelete={handleDeleteTask}
                                    />
                                  )}
                                </Draggable>
                              </div>
                            ))}
                          </div>
                          {/* Placeholder */}
                          <div className="absolute inset-0 pointer-events-none">
                            {provided.placeholder}
                          </div>
                          {/* Empty State */}
                          {!tasks[column.id]?.length &&
                            !snapshot.isDraggingOver && (
                              <div className="h-16 flex items-center justify-center text-gray-400 text-sm">
                                Drop tasks here
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          )}
        </div>
      </div>
    </div>
  );
}
