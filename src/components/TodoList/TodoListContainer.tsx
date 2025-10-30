import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase';
import { getUserTodos, getUserCategories } from '@/lib/db/queries';
import TodoListClient from './TodoListClient';
import type { TodoWithCategories } from '@/lib/db/schema';

interface TodoListContainerProps {
  searchParams: {
    status?: string;
    priority?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

// Loading skeleton component
function TodoListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-gray-200 rounded mt-1" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function TodoListContainer({ searchParams }: TodoListContainerProps) {
  // Get authenticated user
  const supabase = await createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Please log in to view your todos.</p>
      </div>
    );
  }

  // Build filters from search params
  const filters: Parameters<typeof getUserTodos>[1] = {};

  if (searchParams.status === 'completed') {
    filters.isCompleted = true;
  } else if (searchParams.status === 'incomplete') {
    filters.isCompleted = false;
  }

  if (searchParams.priority) {
    filters.priority = parseInt(searchParams.priority);
  }

  if (searchParams.category) {
    filters.categoryId = searchParams.category;
  }

  // Build sort configuration
  const sortFieldMap: Record<string, 'due_date' | 'priority' | 'created_at' | 'title'> = {
    dueDate: 'due_date',
    priority: 'priority',
    createdAt: 'created_at',
    title: 'title',
  };

  const sort = {
    field: sortFieldMap[searchParams.sortBy || 'createdAt'] || 'created_at',
    direction: (searchParams.sortOrder || 'desc') as 'asc' | 'desc',
  };

  try {
    // Fetch todos with filters and sorting
    const todos = await getUserTodos(user.id, filters, sort);
    
    // Fetch categories for each todo
    const categories = await getUserCategories(user.id);
    
    // Create a map of category IDs to category objects
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
    
    // Note: We would need to enhance the query to include categories per todo
    // For now, we'll pass the todos as-is with an empty categories array
    const todosWithCategories: TodoWithCategories[] = todos.map(todo => ({
      ...todo,
      categories: [],
    }));

    return (
      <Suspense fallback={<TodoListSkeleton />}>
        <TodoListClient 
          initialTodos={todosWithCategories} 
          categories={categories}
          userId={user.id}
        />
      </Suspense>
    );
  } catch (error) {
    console.error('Error fetching todos:', error);
    return (
      <div className="text-center py-8 text-red-500">
        <p>Failed to load todos. Please try again.</p>
      </div>
    );
  }
}
