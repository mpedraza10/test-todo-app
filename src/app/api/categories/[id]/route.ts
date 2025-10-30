import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/utils/auth';
import { successResponse, errorResponse, handleError } from '@/lib/utils/api-response';
import { getCategoryById, deleteCategory } from '@/lib/db/queries';

/**
 * DELETE /api/categories/[id]
 * Delete a category
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const userId = await getUserId();

    // Get category ID from params
    const { id } = await params;

    // Verify category exists and belongs to user
    const existingCategory = await getCategoryById(id, userId);
    if (!existingCategory) {
      return errorResponse('Category not found', 404);
    }

    // Delete the category
    // Note: Associated todo_categories records will be handled by database cascade rules
    const deleted = await deleteCategory(id, userId);

    if (!deleted) {
      return errorResponse('Failed to delete category', 500);
    }

    return successResponse({
      success: true,
    });
  } catch (error) {
    return handleError(error);
  }
}
