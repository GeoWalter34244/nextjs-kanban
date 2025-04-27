import { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { Star, Edit2, Check, X, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

const PRIMARY_COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Red", value: "#EF4444" },
  { name: "Green", value: "#10B981" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Orange", value: "#F97316" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Gray", value: "#6B7280" },
  { name: "Indigo", value: "#6366F1" },
];

interface TaskProps {
  task: {
    id: number;
    title: string;
    description?: string;
    color?: string;
    priority?: number;
    assignee?: {
      id: number;
      name: string;
      avatar?: string;
    };
  };
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  onPriorityToggle?: (taskId: number) => void;
  onColorChange?: (taskId: number, color: string) => void;
  onTitleChange?: (taskId: number, title: string) => void;
  onDelete?: (taskId: number) => void;
}

export function Task({
  task,
  provided,
  snapshot,
  onPriorityToggle,
  onColorChange,
  onTitleChange,
  onDelete,
}: TaskProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  const handleColorChange = (color: string) => {
    console.log("Selected color:", color);
    console.log(task.id);
    if (typeof color === "string" && color.startsWith("#")) {
      onColorChange?.(task.id, color);
    } else {
      console.error("Invalid color format:", color);
    }
    setIsColorPickerOpen(false);
  };

  const handleTitleChange = () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      onTitleChange?.(task.id, editedTitle);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(task.title);
    setIsEditing(false);
  };

  // Use the task's color or fall back to blue if not set
  const taskColor = task.color || "#3B82F6";

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`bg-white rounded-lg shadow-sm p-3 border-l-4 hover:shadow-md transition-all duration-200 mb-3 last:mb-0 ${
        snapshot.isDragging ? "shadow-lg scale-105" : ""
      }`}
      style={{
        ...provided.draggableProps.style,
        borderLeft: `4px solid ${taskColor}`,
        transition: "all 0.2s ease",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex flex-col gap-2 w-full">
              <textarea
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full text-sm p-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                autoFocus
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.shiftKey) {
                    e.preventDefault();
                    handleTitleChange();
                  }
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTitleChange}
                  className="p-2 text-green-600 hover:bg-green-50 rounded"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
                {onDelete && (
                  <button
                    onClick={() => onDelete(task.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <pre className="font-medium text-gray-900 break-all whitespace-pre-wrap font-sans">
                {task.title}
              </pre>
              <button
                onClick={() => setIsEditing(true)}
                className={`p-1 text-gray-400 hover:text-gray-600 rounded flex-shrink-0 ${
                  isHovered ? "opacity-100" : "opacity-0"
                } transition-opacity`}
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
          {task.description && (
            <p className="text-sm text-gray-500 mt-1 break-all">
              {task.description}
            </p>
          )}
        </div>
        {!isEditing && (
          <button
            onClick={() => onPriorityToggle?.(task.id)}
            className={`ml-2 p-1 rounded-full transition-colors ${
              task.priority ? "text-yellow-400" : "text-gray-300"
            } ${isHovered ? "hover:bg-gray-100" : ""}`}
          >
            <Star
              className={`w-4 h-4 ${task.priority ? "fill-current" : ""}`}
            />
          </button>
        )}
      </div>

      {task.assignee && (
        <div className="mt-2 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
            {task.assignee.avatar ? (
              <img
                src={task.assignee.avatar}
                alt={task.assignee.name}
                className="w-full h-full rounded-full"
              />
            ) : (
              task.assignee.name
                .split(" ")
                .map((n) => n[0])
                .join("")
            )}
          </div>
          <span className="text-xs text-gray-500">{task.assignee.name}</span>
        </div>
      )}

      {/* Color Picker */}
      <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
        <PopoverTrigger asChild>
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-pointer"
            style={{ backgroundColor: taskColor }}
            onClick={(e) => {
              e.stopPropagation();
              setIsColorPickerOpen(true);
            }}
          />
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-2 bg-white rounded-lg shadow-lg"
          align="start"
        >
          <div className="grid grid-cols-5 gap-2">
            {PRIMARY_COLORS.map((color) => (
              <button
                key={color.value}
                className="w-6 h-6 rounded-full border border-gray-200 hover:border-gray-400 transition-colors"
                style={{ backgroundColor: color.value }}
                onClick={() => handleColorChange(color.value)}
                title={color.name}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
