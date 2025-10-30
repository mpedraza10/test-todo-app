'use client';

import { useState, useOptimistic } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TodoItem from '@/components/TodoItem';
import EmptyState from './EmptyState';
import type { TodoWithCategories, Category } from '@/lib/db/schema';

interface TodoListClientProps {
  initialTodos: TodoWithCategories[];
  categories: Category[];
  userId: string;
}

type OptimisticAction = 
  | { type: 'toggle'; id: string; isCompleted: boolean }
  | { type: 'update'; id: string; data: Partial<TodoWithCategories> }
  | { type: 'delete'; id: string }
  | { type: 'add'; todo: TodoWithCategories };

export default function TodoListClient({ initialTodos, categories, userId }: TodoListClientProps) {
  const router = useRouter();
  const [todos, setTodos] = useState<TodoWithCategories[]>(initialTodos);
  const [optimisticTodos, addOptimisticUpdate] = useOptimistic(
    todos,
    (state: TodoWithCategories[], action: OptimisticAction) => {
      switch (action.type) {
        case 'toggle':
          return state.map(todo =>
            todo.id === action.id
              ? { ...todo, is_completed: action.isCompleted }
              : todo
          );
        case 'update':
          return state.map(todo =>
            todo.id === action.id
              ? { ...todo, ...action.data }
              : todo
          );
        case 'delete':
          return state.filter(todo => todo.id !== action.id);
        case 'add':
          return [action.todo, ...state];
        default:
          return state;
      }
    }
  );

  const handleToggleComplete = async (id: string, isCompleted: boolean) => {
    // Optimistic update
    addOptimisticUpdate({ type: 'toggle', id, isCompleted });

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle todo');
      }

      const { todo } = await response.json();
      
      // Update local state with server response
      setTodos(prev => prev.map(t => t.id === id ? todo : t));
    } catch (error) {
      console.error('Error toggling todo:', error);
      // Revert optimistic update
      router.refresh();
    }
  };

  const handleUpdate = async (id: string, data: Partial<TodoWithCategories>) => {
    // Optimistic update
    addOptimisticUpdate({ type: 'update', id, data });

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          priority: data.priority,
          dueDate: data.due_date,
          isCompleted: data.is_completed,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update todo');
      }

      const { todo } = await response.json();
      
      // Update local state with server response
      setTodos(prev => prev.map(t => t.id === id ? todo : t));
    } catch (error) {
      console.error('Error updating todo:', error);
      // Revert optimistic update
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic update
    addOptimisticUpdate({ type: 'delete', id });

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete todo');
      }

      // Update local state
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
      // Revert optimistic update
      router.refresh();
    }
  };

  const searchParams = useSearchParams();
  const hasFilters = searchParams.toString().length > 0;

  // Empty state handling
  if (optimisticTodos.length === 0) {
    if (hasFilters) {
      // No results due to filters
      return <EmptyState type="no-results" onAction={() => router.push(window.location.pathname)} />;
    } else if (initialTodos.length === 0) {
      // First time user
      return <EmptyState type="first-time" />;
    } else {
      // No todos at all
      return <EmptyState type="no-todos" />;
    }
  }

  return (
    <div className="space-y-4">
      {optimisticTodos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggleComplete={handleToggleComplete}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}
      
      {/* Todo count */}
      <div className="text-center text-sm text-gray-500 pt-4">
        Showing {optimisticTodos.length} {optimisticTodos.length === 1 ? 'todo' : 'todos'}
      </div>
    </div>
  );
}
