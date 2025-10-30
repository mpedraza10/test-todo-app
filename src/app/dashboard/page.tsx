import { Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { getUserCategories } from '@/lib/db/queries';
import TodoListContainer from '@/components/TodoList/TodoListContainer';
import DashboardClient from './DashboardClient';

interface DashboardPageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please log in to access your todos.</p>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Fetch categories for the user
  const categories = await getUserCategories(user.id);

  // Await search params
  const params = await searchParams;

  return (
    <div>
      <DashboardClient categories={categories} userId={user.id} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Suspense 
              fallback={
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-4 animate-pulse bg-white">
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
              }
            >
              <TodoListContainer searchParams={params} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
