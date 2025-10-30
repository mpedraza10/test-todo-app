'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TodoForm from '@/components/TodoForm';
import FilterControls from '@/components/FilterControls';
import { CategoryForm, CategoryList } from '@/components/CategoryForm';
import type { Category } from '@/lib/db/schema';

interface DashboardClientProps {
  categories: Category[];
  userId: string;
}

export default function DashboardClient({ categories, userId }: DashboardClientProps) {
  const router = useRouter();
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTodo = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          priority: parseInt(data.priority),
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
          categoryIds: data.categoryIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create todo');
      }

      setShowTodoForm(false);
      router.refresh();
    } catch (error) {
      console.error('Error creating todo:', error);
      alert('Failed to create todo. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      router.refresh();
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      router.refresh();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">My Todos</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCategoryManager(!showCategoryManager)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                📁 Categories
              </button>
              <button
                onClick={() => setShowTodoForm(!showTodoForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                ➕ New Todo
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <FilterControls categories={categories} />

            {/* Quick Create Todo Form */}
            {showTodoForm && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Create New Todo</h2>
                  <button
                    onClick={() => setShowTodoForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <TodoForm
                  onSubmit={handleCreateTodo}
                  categories={categories}
                  onCancel={() => setShowTodoForm(false)}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category Manager */}
            {showCategoryManager && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Manage Categories</h2>
                  <button
                    onClick={() => setShowCategoryManager(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-6">
                  <CategoryForm onSubmit={handleCreateCategory} />
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Your Categories</h3>
                    <CategoryList categories={categories} onDelete={handleDeleteCategory} />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/dashboard?status=incomplete')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm"
                >
                  📋 View Incomplete Tasks
                </button>
                <button
                  onClick={() => router.push('/dashboard?status=completed')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm"
                >
                  ✅ View Completed Tasks
                </button>
                <button
                  onClick={() => router.push('/dashboard?priority=4')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm"
                >
                  🔴 View Critical Tasks
                </button>
                <button
                  onClick={() => router.push('/dashboard?sortBy=dueDate&sortOrder=asc')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm"
                >
                  📅 View by Due Date
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
