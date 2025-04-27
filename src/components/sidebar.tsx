"use client";

import { useRef, useState } from "react";
import { Project } from "@/models/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Library,
  ListMusic,
  Mic2,
  Music2,
  PlayCircle,
  Plus,
  Radio,
  User,
  Trash2,
} from "lucide-react";

interface SidebarProps {
  projects: Project[];
  selectedProject: number | null;
  onProjectSelect: (id: number | null) => void;
  onCreateProject: (name: string) => void;
  onDeleteProject: () => void;
  className?: string;
}

export function Sidebar({
  projects,
  selectedProject,
  onProjectSelect,
  onCreateProject,
  onDeleteProject,
  className,
}: SidebarProps) {
  const [newProjectName, setNewProjectName] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const deleteConfirmationRef = useRef<HTMLInputElement>(null);

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName);
      setNewProjectName("");
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (deleteConfirmationRef.current?.value.toLowerCase() !== "delete") {
      return;
    }

    try {
      const response = await fetch("/api/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      if (selectedProject === projectId) {
        onProjectSelect(null);
      }

      onDeleteProject();
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setProjectToDelete(null);
      setDeleteConfirmation("");
    }
  };

  return (
    <div className={cn("pb-12 min-h-screen", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Projects
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-4">
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="New project name"
                className="flex-1"
              />
              <Button
                onClick={handleCreateProject}
                size="icon"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {projects.map((project) => (
              <div key={project.id} className="group relative">
                <button
                  onClick={() => onProjectSelect(project.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedProject === project.id
                      ? "bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-500"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {project.name}
                </button>
                <button
                  onClick={() => setProjectToDelete(project.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {projectToDelete === project.id && (
                  <div className="absolute left-0 right-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <p className="text-sm text-gray-700 mb-2">
                      Type 'DELETE' to confirm deletion:
                    </p>
                    <Input
                      ref={deleteConfirmationRef}
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          deleteConfirmation.toLowerCase() === "delete"
                        ) {
                          handleDeleteProject(project.id);
                        }
                      }}
                      className="flex-1"
                      placeholder="Type DELETE"
                    />
                    <div className="mt-4 flex gap-2 justify-center">
                      <Button
                        onClick={() => handleDeleteProject(project.id)}
                        variant="destructive"
                        disabled={
                          deleteConfirmationRef.current?.value.toLocaleLowerCase() !==
                          "delete"
                        }
                        className="cursor-pointer"
                      >
                        Delete
                      </Button>
                      <Button
                        onClick={() => {
                          setProjectToDelete(null);
                          setDeleteConfirmation("");
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
