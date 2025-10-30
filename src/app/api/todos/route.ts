import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/utils/auth';
import { successResponse, errorResponse, handleError } from '@/lib/utils/api-response';
import { createTodoSchema, todoQuerySchema } from '@/lib/validations/todo';
import { getUserTodos, createTodo, getTodoWithCategories } from '@/lib/db/queries';
import { replaceTodoCategories } from '@/lib/db/queries';

/**
 * GET /api/todos
 * Retrieve user's todos with optional filtering and sorting
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await getUserId();

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      status: searchParams.get('status') || 'all',
      priority: searchParams.get('priority'),
      category: searchParams.get('category'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    const validatedParams = todoQuerySchema.parse(queryParams);

    // Build filters based on status
    const filters: Parameters<typeof getUserTodos>[1] = {};
    
    if (validatedParams.status === 'completed') {
      filters.isCompleted = true;
    } else if (validatedParams.status === 'incomplete') {
      filters.isCompleted = false;
    }

    if (validatedParams.priority) {
      filters.priority = validatedParams.priority;
    }

    if (validatedParams.category) {
      filters.categoryId = validatedParams.category;
    }

    // Build sort configuration
    const sortFieldMap: Record<string, 'due_date' | 'priority' | 'created_at' | 'title'> = {
      dueDate: 'due_date',
      priority: 'priority',
      createdAt: 'created_at',
      title: 'title',
    };

    const sort = {
      field: sortFieldMap[validatedParams.sortBy],
      direction: validatedParams.sortOrder,
    };

    // Fetch todos
    const todos = await getUserTodos(userId, filters, sort);

    return successResponse({
      todos,
      totalCount: todos.length,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/todos
 * Create a new todo item
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await getUserId();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createTodoSchema.parse(body);

    // Validate due date is not in the past for new tasks
    if (validatedData.dueDate) {
      const dueDate = new Date(validatedData.dueDate);
      const now = new Date();
      if (dueDate < now) {
        return errorResponse('Due date cannot be in the past', 400);
      }
    }

    // Create todo
    const newTodo = await createTodo({
      user_id: userId,
      title: validatedData.title,
      description: validatedData.description || null,
      priority: validatedData.priority || 2, // Default to Medium
      due_date: validatedData.dueDate || null,
      is_completed: false,
    });

    // Add categories if provided
    if (validatedData.categoryIds && validatedData.categoryIds.length > 0) {
      await replaceTodoCategories(
        newTodo.id,
        validatedData.categoryIds,
        userId
      );
    }

    // Fetch the complete todo with categories
    const todoWithCategories = await getTodoWithCategories(newTodo.id, userId);

    return successResponse(
      { todo: todoWithCategories || newTodo },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
