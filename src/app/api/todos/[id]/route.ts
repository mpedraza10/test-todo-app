import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/utils/auth';
import { successResponse, errorResponse, handleError } from '@/lib/utils/api-response';
import { updateTodoSchema } from '@/lib/validations/todo';
import { getTodoById, updateTodo, deleteTodo, getTodoWithCategories, replaceTodoCategories } from '@/lib/db/queries';

/**
 * PATCH /api/todos/[id]
 * Update an existing todo
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const userId = await getUserId();

    // Get todo ID from params
    const { id } = await params;

    // Verify todo exists and belongs to user
    const existingTodo = await getTodoById(id, userId);
    if (!existingTodo) {
      return errorResponse('Todo not found', 404);
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTodoSchema.parse(body);

    // Validate due date if being updated
    if (validatedData.dueDate !== undefined && validatedData.dueDate !== null) {
      const dueDate = new Date(validatedData.dueDate);
      const now = new Date();
      
      // Only enforce future date check if todo is not yet completed
      if (!existingTodo.is_completed && dueDate < now) {
        return errorResponse('Due date cannot be in the past', 400);
      }
    }

    // Prepare update data
    const updateData: Parameters<typeof updateTodo>[2] = {};

    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    if (validatedData.priority !== undefined) {
      updateData.priority = validatedData.priority;
    }
    if (validatedData.dueDate !== undefined) {
      updateData.due_date = validatedData.dueDate;
    }
    if (validatedData.isCompleted !== undefined) {
      updateData.is_completed = validatedData.isCompleted;
    }

    // Update the todo
    const updatedTodo = await updateTodo(id, userId, updateData);

    if (!updatedTodo) {
      return errorResponse('Failed to update todo', 500);
    }

    // Update categories if provided
    if (validatedData.categoryIds !== undefined) {
      await replaceTodoCategories(
        id,
        validatedData.categoryIds,
        userId
      );
    }

    // Fetch the complete todo with categories
    const todoWithCategories = await getTodoWithCategories(id, userId);

    return successResponse({
      todo: todoWithCategories || updatedTodo,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/todos/[id]
 * Delete a todo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const userId = await getUserId();

    // Get todo ID from params
    const { id } = await params;

    // Verify todo exists and belongs to user
    const existingTodo = await getTodoById(id, userId);
    if (!existingTodo) {
      return errorResponse('Todo not found', 404);
    }

    // Delete the todo
    const deleted = await deleteTodo(id, userId);

    if (!deleted) {
      return errorResponse('Failed to delete todo', 500);
    }

    return successResponse({
      success: true,
    });
  } catch (error) {
    return handleError(error);
  }
}
