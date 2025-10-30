import { z } from 'zod';

// Priority enum values matching database schema
export const priorityEnum = z.enum(['1', '2', '3', '4']).transform((val) => parseInt(val));

// Todo creation schema
export const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().optional(),
  priority: priorityEnum.optional(),
  dueDate: z.string().datetime().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
});

// Todo update schema (all fields optional except at least one must be present)
export const updateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less').optional(),
  description: z.string().optional(),
  priority: priorityEnum.optional(),
  dueDate: z.string().datetime().optional().nullable(),
  isCompleted: z.boolean().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// Query parameters for filtering todos
export const todoQuerySchema = z.object({
  status: z.enum(['completed', 'incomplete', 'all']).optional().default('all'),
  priority: priorityEnum.optional(),
  category: z.string().optional(),
  sortBy: z.enum(['dueDate', 'priority', 'createdAt', 'title']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Type exports for use in API routes
export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type TodoQueryParams = z.infer<typeof todoQuerySchema>;
