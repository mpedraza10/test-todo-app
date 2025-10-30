'use client';

import { useState } from 'react';
import type { TodoWithCategories } from '@/lib/db/schema';

interface TodoItemProps {
  todo: TodoWithCategories;
  onToggleComplete: (id: string, isCompleted: boolean) => Promise<void>;
  onUpdate: (id: string, data: Partial<TodoWithCategories>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const priorityColors = {
  1: 'bg-blue-100 text-blue-800 border-blue-300',
  2: 'bg-green-100 text-green-800 border-green-300',
  3: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  4: 'bg-red-100 text-red-800 border-red-300',
};

const priorityLabels = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Critical',
};

export default function TodoItem({ todo, onToggleComplete, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const handleToggleComplete = async () => {
    setIsOptimistic(true);
    try {
      await onToggleComplete(todo.id, !todo.is_completed);
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    } finally {
      setIsOptimistic(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    
    setIsOptimistic(true);
    try {
      await onUpdate(todo.id, {
        title: editTitle,
        description: editDescription || null,
      } as Partial<TodoWithCategories>);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update todo:', error);
    } finally {
      setIsOptimistic(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsOptimistic(true);
    try {
      await onDelete(todo.id);
    } catch (error) {
      console.error('Failed to delete todo:', error);
      setIsOptimistic(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = () => {
    if (!todo.due_date || todo.is_completed) return false;
    return new Date(todo.due_date) < new Date();
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-opacity ${
        isOptimistic ? 'opacity-50' : 'opacity-100'
      } ${todo.is_completed ? 'bg-gray-50' : 'bg-white'}`}
    >
      <div className="flex items-start gap-3">
        {/* Completion Checkbox */}
        <input
          type="checkbox"
          checked={todo.is_completed}
          onChange={handleToggleComplete}
          disabled={isOptimistic}
          className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
          aria-label={`Mark "${todo.title}" as ${todo.is_completed ? 'incomplete' : 'complete'}`}
        />

        <div className="flex-1">
          {isEditing ? (
            /* Inline Edit Mode */
            <div className="space-y-3">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Todo title"
                autoFocus
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Description (optional)"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={!editTitle.trim() || isOptimistic}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isOptimistic}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Display Mode */
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`text-lg font-medium ${
                    todo.is_completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {todo.title}
                </h3>
                
                {/* Priority Badge */}
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    priorityColors[todo.priority as keyof typeof priorityColors]
                  }`}
                >
                  {priorityLabels[todo.priority as keyof typeof priorityLabels]}
                </span>
              </div>

              {todo.description && (
                <p className={`mt-1 text-sm ${todo.is_completed ? 'text-gray-400' : 'text-gray-600'}`}>
                  {todo.description}
                </p>
              )}

              {/* Categories */}
              {todo.categories && todo.categories.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {todo.categories.map((category) => (
                    <span
                      key={category.id}
                      className="text-xs px-2 py-1 rounded-md"
                      style={{
                        backgroundColor: `${category.color}20`,
                        color: category.color,
                      }}
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Due Date */}
              {todo.due_date && (
                <div className="mt-2">
                  <span
                    className={`text-xs ${
                      isOverdue()
                        ? 'text-red-600 font-medium'
                        : todo.is_completed
                        ? 'text-gray-400'
                        : 'text-gray-500'
                    }`}
                  >
                    📅 Due: {formatDate(todo.due_date)}
                    {isOverdue() && ' (Overdue)'}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={isOptimistic}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isOptimistic}
                  className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Todo</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete &quot;{todo.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isOptimistic}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isOptimistic}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOptimistic ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
