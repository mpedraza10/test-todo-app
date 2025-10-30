import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/utils/auth';
import { successResponse, handleError } from '@/lib/utils/api-response';
import { createCategorySchema } from '@/lib/validations/category';
import { getUserCategories, createCategory } from '@/lib/db/queries';

/**
 * GET /api/categories
 * Retrieve all categories for the authenticated user
 */
export async function GET() {
  try {
    // Authenticate user
    const userId = await getUserId();

    // Fetch categories
    const categories = await getUserCategories(userId);

    return successResponse({
      categories,
      totalCount: categories.length,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await getUserId();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    // Create category
    const newCategory = await createCategory({
      user_id: userId,
      name: validatedData.name,
      color: validatedData.color,
    });

    return successResponse(
      { category: newCategory },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
