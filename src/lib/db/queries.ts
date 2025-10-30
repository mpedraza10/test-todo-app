/**
 * Type-safe database query functions using Drizzle ORM
 * All functions include proper error handling and user context validation
 */

import { db } from "@/lib/db";
import { todos, categories, todoCategories, type Todo, type NewTodo, type Category, type NewCategory, type TodoWithCategories } from "./schema";
import { eq, and, desc, asc, like, or, sql, SQL } from "drizzle-orm";

// ==================== TODO QUERIES ====================

/**
 * Get all todos for a specific user with optional filtering
 */
export async function getUserTodos(
  userId: string,
  filters?: {
    isCompleted?: boolean;
    priority?: number;
    categoryId?: string;
    search?: string;
  },
  sort?: {
    field: "due_date" | "priority" | "created_at" | "title";
    direction: "asc" | "desc";
  }
): Promise<Todo[]> {
  try {
    const conditions: SQL[] = [eq(todos.user_id, userId)];

    // Apply filters
    if (filters?.isCompleted !== undefined) {
      conditions.push(eq(todos.is_completed, filters.isCompleted));
    }

    if (filters?.priority !== undefined) {
      conditions.push(eq(todos.priority, filters.priority));
    }

    if (filters?.search) {
      conditions.push(
        or(
          like(todos.title, `%${filters.search}%`),
          like(todos.description, `%${filters.search}%`)
        )!
      );
    }

    // Build query
    let query = db.select().from(todos).where(and(...conditions));

    // Apply sorting
    const sortField = sort?.field || "created_at";
    const sortDirection = sort?.direction || "desc";
    const sortColumn = todos[sortField];
    
    query = sortDirection === "asc" 
      ? query.orderBy(asc(sortColumn))
      : query.orderBy(desc(sortColumn));

    // Execute query
    const result = await query;

    // Filter by category if specified (requires join)
    if (filters?.categoryId) {
      const todosInCategory = await db
        .select({ todoId: todoCategories.todo_id })
        .from(todoCategories)
        .where(eq(todoCategories.category_id, filters.categoryId));

      const todoIds = new Set(todosInCategory.map((tc) => tc.todoId));
      return result.filter((todo) => todoIds.has(todo.id));
    }

    return result;
  } catch (error) {
    console.error("Error fetching user todos:", error);
    throw new Error("Failed to fetch todos");
  }
}

/**
 * Get a single todo by ID with user validation
 */
export async function getTodoById(todoId: string, userId: string): Promise<Todo | null> {
  try {
    const result = await db
      .select()
      .from(todos)
      .where(and(eq(todos.id, todoId), eq(todos.user_id, userId)))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching todo:", error);
    throw new Error("Failed to fetch todo");
  }
}

/**
 * Get a todo with its categories
 */
export async function getTodoWithCategories(todoId: string, userId: string): Promise<TodoWithCategories | null> {
  try {
    const todo = await getTodoById(todoId, userId);
    if (!todo) return null;

    const todoCategs = await db
      .select({
        category: categories,
      })
      .from(todoCategories)
      .innerJoin(categories, eq(todoCategories.category_id, categories.id))
      .where(eq(todoCategories.todo_id, todoId));

    return {
      ...todo,
      categories: todoCategs.map((tc) => tc.category),
    };
  } catch (error) {
    console.error("Error fetching todo with categories:", error);
    throw new Error("Failed to fetch todo with categories");
  }
}

/**
 * Create a new todo
 */
export async function createTodo(data: NewTodo): Promise<Todo> {
  try {
    const result = await db.insert(todos).values(data).returning();
    return result[0];
  } catch (error) {
    console.error("Error creating todo:", error);
    throw new Error("Failed to create todo");
  }
}

/**
 * Update an existing todo
 */
export async function updateTodo(
  todoId: string,
  userId: string,
  data: Partial<Omit<NewTodo, "user_id" | "created_at">>
): Promise<Todo | null> {
  try {
    // Add updated_at timestamp
    const updateData = {
      ...data,
      updated_at: new Date(),
    };

    const result = await db
      .update(todos)
      .set(updateData)
      .where(and(eq(todos.id, todoId), eq(todos.user_id, userId)))
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error("Error updating todo:", error);
    throw new Error("Failed to update todo");
  }
}

/**
 * Toggle todo completion status
 */
export async function toggleTodoCompletion(todoId: string, userId: string): Promise<Todo | null> {
  try {
    const todo = await getTodoById(todoId, userId);
    if (!todo) return null;

    return await updateTodo(todoId, userId, {
      is_completed: !todo.is_completed,
    });
  } catch (error) {
    console.error("Error toggling todo completion:", error);
    throw new Error("Failed to toggle todo completion");
  }
}

/**
 * Delete a todo
 */
export async function deleteTodo(todoId: string, userId: string): Promise<boolean> {
  try {
    const result = await db
      .delete(todos)
      .where(and(eq(todos.id, todoId), eq(todos.user_id, userId)))
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error("Error deleting todo:", error);
    throw new Error("Failed to delete todo");
  }
}

/**
 * Bulk update todos (mark multiple as completed)
 */
export async function bulkUpdateTodos(
  todoIds: string[],
  userId: string,
  data: Partial<Omit<NewTodo, "user_id" | "created_at">>
): Promise<number> {
  try {
    const updateData = {
      ...data,
      updated_at: new Date(),
    };

    const result = await db
      .update(todos)
      .set(updateData)
      .where(
        and(
          sql`${todos.id} = ANY(${todoIds})`,
          eq(todos.user_id, userId)
        )
      )
      .returning();

    return result.length;
  } catch (error) {
    console.error("Error bulk updating todos:", error);
    throw new Error("Failed to bulk update todos");
  }
}

/**
 * Get todo statistics for a user
 */
export async function getTodoStats(userId: string) {
  try {
    const allTodos = await db
      .select()
      .from(todos)
      .where(eq(todos.user_id, userId));

    const total = allTodos.length;
    const completed = allTodos.filter((t) => t.is_completed).length;
    const pending = total - completed;
    const overdue = allTodos.filter(
      (t) => !t.is_completed && t.due_date && new Date(t.due_date) < new Date()
    ).length;

    return {
      total,
      completed,
      pending,
      overdue,
    };
  } catch (error) {
    console.error("Error fetching todo stats:", error);
    throw new Error("Failed to fetch todo statistics");
  }
}

// ==================== CATEGORY QUERIES ====================

/**
 * Get all categories for a user
 */
export async function getUserCategories(userId: string): Promise<Category[]> {
  try {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.user_id, userId))
      .orderBy(asc(categories.name));
  } catch (error) {
    console.error("Error fetching user categories:", error);
    throw new Error("Failed to fetch categories");
  }
}

/**
 * Get a single category by ID with user validation
 */
export async function getCategoryById(categoryId: string, userId: string): Promise<Category | null> {
  try {
    const result = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.user_id, userId)))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching category:", error);
    throw new Error("Failed to fetch category");
  }
}

/**
 * Create a new category
 */
export async function createCategory(data: NewCategory): Promise<Category> {
  try {
    const result = await db.insert(categories).values(data).returning();
    return result[0];
  } catch (error) {
    console.error("Error creating category:", error);
    throw new Error("Failed to create category");
  }
}

/**
 * Update a category
 */
export async function updateCategory(
  categoryId: string,
  userId: string,
  data: Partial<Omit<NewCategory, "user_id" | "created_at">>
): Promise<Category | null> {
  try {
    const result = await db
      .update(categories)
      .set(data)
      .where(and(eq(categories.id, categoryId), eq(categories.user_id, userId)))
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error("Error updating category:", error);
    throw new Error("Failed to update category");
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(categoryId: string, userId: string): Promise<boolean> {
  try {
    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.user_id, userId)))
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw new Error("Failed to delete category");
  }
}

/**
 * Get categories with todo counts
 */
export async function getCategoriesWithCounts(userId: string) {
  try {
    const userCategories = await getUserCategories(userId);
    
    const categoriesWithCounts = await Promise.all(
      userCategories.map(async (category) => {
        const count = await db
          .select({ count: sql<number>`count(*)` })
          .from(todoCategories)
          .innerJoin(todos, eq(todoCategories.todo_id, todos.id))
          .where(
            and(
              eq(todoCategories.category_id, category.id),
              eq(todos.user_id, userId)
            )
          );

        return {
          ...category,
          todoCount: Number(count[0]?.count || 0),
        };
      })
    );

    return categoriesWithCounts;
  } catch (error) {
    console.error("Error fetching categories with counts:", error);
    throw new Error("Failed to fetch categories with counts");
  }
}

// ==================== TODO-CATEGORY ASSOCIATION QUERIES ====================

/**
 * Add categories to a todo
 */
export async function addCategoriesToTodo(
  todoId: string,
  categoryIds: string[],
  userId: string
): Promise<void> {
  try {
    // Verify todo belongs to user
    const todo = await getTodoById(todoId, userId);
    if (!todo) {
      throw new Error("Todo not found or access denied");
    }

    // Verify all categories belong to user
    const userCategs = await getUserCategories(userId);
    const validCategoryIds = new Set(userCategs.map((c) => c.id));
    const invalidCategories = categoryIds.filter((id) => !validCategoryIds.has(id));
    
    if (invalidCategories.length > 0) {
      throw new Error("One or more categories not found or access denied");
    }

    // Insert associations (ignore duplicates)
    const values = categoryIds.map((categoryId) => ({
      todo_id: todoId,
      category_id: categoryId,
    }));

    await db.insert(todoCategories).values(values).onConflictDoNothing();
  } catch (error) {
    console.error("Error adding categories to todo:", error);
    throw new Error("Failed to add categories to todo");
  }
}

/**
 * Remove categories from a todo
 */
export async function removeCategoriesFromTodo(
  todoId: string,
  categoryIds: string[],
  userId: string
): Promise<void> {
  try {
    // Verify todo belongs to user
    const todo = await getTodoById(todoId, userId);
    if (!todo) {
      throw new Error("Todo not found or access denied");
    }

    await db
      .delete(todoCategories)
      .where(
        and(
          eq(todoCategories.todo_id, todoId),
          sql`${todoCategories.category_id} = ANY(${categoryIds})`
        )
      );
  } catch (error) {
    console.error("Error removing categories from todo:", error);
    throw new Error("Failed to remove categories from todo");
  }
}

/**
 * Replace all categories for a todo
 */
export async function replaceTodoCategories(
  todoId: string,
  categoryIds: string[],
  userId: string
): Promise<void> {
  try {
    // Verify todo belongs to user
    const todo = await getTodoById(todoId, userId);
    if (!todo) {
      throw new Error("Todo not found or access denied");
    }

    // Remove all existing categories
    await db.delete(todoCategories).where(eq(todoCategories.todo_id, todoId));

    // Add new categories if any
    if (categoryIds.length > 0) {
      await addCategoriesToTodo(todoId, categoryIds, userId);
    }
  } catch (error) {
    console.error("Error replacing todo categories:", error);
    throw new Error("Failed to replace todo categories");
  }
}

/**
 * Get categories for a specific todo
 */
export async function getTodoCategories(todoId: string, userId: string): Promise<Category[]> {
  try {
    // Verify todo belongs to user
    const todo = await getTodoById(todoId, userId);
    if (!todo) {
      throw new Error("Todo not found or access denied");
    }

    const result = await db
      .select({
        category: categories,
      })
      .from(todoCategories)
      .innerJoin(categories, eq(todoCategories.category_id, categories.id))
      .where(eq(todoCategories.todo_id, todoId));

    return result.map((r) => r.category);
  } catch (error) {
    console.error("Error fetching todo categories:", error);
    throw new Error("Failed to fetch todo categories");
  }
}
