'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import type { Category } from '@/lib/db/schema';

// Form validation schema
const categoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Category name must be 50 characters or less'),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color code'),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  onSubmit: (data: CategoryFormData) => Promise<void>;
  initialData?: Partial<CategoryFormData>;
  isEditing?: boolean;
  onCancel?: () => void;
}

// Preset color options
const presetColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export function CategoryForm({ onSubmit, initialData, isEditing = false, onCancel }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      color: initialData?.color || '#3B82F6',
    },
  });

  const selectedColor = watch('color');

  const handleFormSubmit = async (data: CategoryFormData) => {
    try {
      await onSubmit(data);
      if (!isEditing) {
        reset();
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Name Input */}
      <div>
        <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
          Category Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name')}
          id="categoryName"
          type="text"
          placeholder="e.g., Work, Personal, Shopping"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
          disabled={isSubmitting}
          aria-invalid={errors.name ? 'true' : 'false'}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Color Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color <span className="text-red-500">*</span>
        </label>
        
        {/* Preset Colors */}
        <div className="flex gap-2 flex-wrap mb-3">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={`w-8 h-8 rounded-md transition-transform hover:scale-110 ${
                selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
              disabled={isSubmitting}
            />
          ))}
        </div>

        {/* Custom Color Input */}
        <div className="flex items-center gap-2">
          <input
            {...register('color')}
            type="color"
            className="h-10 w-20 rounded border border-gray-300 cursor-pointer disabled:opacity-50"
            disabled={isSubmitting}
          />
          <input
            {...register('color')}
            type="text"
            placeholder="#3B82F6"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            disabled={isSubmitting}
          />
        </div>
        {errors.color && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.color.message}
          </p>
        )}
      </div>

      {/* Preview */}
      <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
        <p className="text-sm text-gray-600 mb-2">Preview:</p>
        <span
          className="inline-block px-3 py-1 rounded-md text-sm font-medium"
          style={{
            backgroundColor: `${selectedColor}20`,
            color: selectedColor,
          }}
        >
          {watch('name') || 'Category Name'}
        </span>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

interface CategoryListProps {
  categories: Category[];
  onDelete: (id: string) => Promise<void>;
}

export function CategoryList({ categories, onDelete }: CategoryListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Failed to delete category:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No categories yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-sm font-medium text-gray-900">{category.name}</span>
          </div>

          <button
            onClick={() => setConfirmDeleteId(category.id)}
            disabled={deletingId === category.id}
            className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deletingId === category.id ? 'Deleting...' : 'Delete'}
          </button>

          {/* Delete Confirmation Modal */}
          {confirmDeleteId === category.id && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                <h3 className="text-lg font-semibold mb-2">Delete Category</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete &quot;{category.name}&quot;? This will remove the category from all associated todos.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    disabled={deletingId === category.id}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    disabled={deletingId === category.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {deletingId === category.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
