'use client';

interface EmptyStateProps {
  type: 'no-todos' | 'no-results' | 'first-time';
  onAction?: () => void;
}

export default function EmptyState({ type, onAction }: EmptyStateProps) {
  const states = {
    'no-todos': {
      icon: '📝',
      title: 'No todos yet',
      description: 'Get organized by creating your first todo item.',
      actionLabel: 'Create Your First Todo',
    },
    'no-results': {
      icon: '🔍',
      title: 'No matching todos',
      description: 'Try adjusting your filters to see more results.',
      actionLabel: 'Clear Filters',
    },
    'first-time': {
      icon: '👋',
      title: 'Welcome to your Todo App!',
      description: 'Start managing your tasks efficiently. Create a todo to begin your journey.',
      actionLabel: 'Get Started',
    },
  };

  const state = states[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="text-7xl mb-4">{state.icon}</div>

        {/* Title */}
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          {state.title}
        </h3>

        {/* Description */}
        <p className="text-gray-500 mb-6">
          {state.description}
        </p>

        {/* Action Button */}
        {onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
          >
            {state.actionLabel}
          </button>
        )}

        {/* Additional Tips for First Time */}
        {type === 'first-time' && (
          <div className="mt-8 text-left">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Tips:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>Use priorities to organize tasks by importance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>Add categories to group related todos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>Set due dates to never miss a deadline</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>Use filters to focus on what matters most</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
