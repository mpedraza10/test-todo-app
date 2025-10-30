import { z } from 'zod';

// Hex color validation regex
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// Category creation schema
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Category name must be 50 characters or less'),
  color: z.string().regex(hexColorRegex, 'Color must be a valid hex color code').optional().default('#3B82F6'),
});

// Type exports
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
