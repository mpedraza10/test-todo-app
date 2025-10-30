import { pgTable, serial, text, timestamp, boolean, integer, uuid, varchar, index, primaryKey } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Todo table schema with all required fields and constraints
export const todos = pgTable("todos", {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    is_completed: boolean("is_completed").default(false).notNull(),
    priority: integer("priority").default(2).notNull(), // 1=Low, 2=Medium, 3=High, 4=Critical
    due_date: timestamp("due_date", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    // Performance indexes for optimized queries
    user_id_idx: index("todos_user_id_idx").on(table.user_id),
    created_at_idx: index("todos_created_at_idx").on(table.created_at),
    priority_idx: index("todos_priority_idx").on(table.priority),
    is_completed_idx: index("todos_is_completed_idx").on(table.is_completed),
    due_date_idx: index("todos_due_date_idx").on(table.due_date),
    // Composite index for common query patterns
    user_completed_idx: index("todos_user_completed_idx").on(table.user_id, table.is_completed),
}));

// Category table schema for task organization
export const categories = pgTable("categories", {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 50 }).notNull(),
    color: varchar("color", { length: 7 }).notNull(), // Hex color code format (#RRGGBB)
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    // Index for user-specific category queries
    user_id_idx: index("categories_user_id_idx").on(table.user_id),
    // Unique constraint: users can't have duplicate category names
    user_name_unique: index("categories_user_name_unique").on(table.user_id, table.name),
}));

// Junction table for many-to-many relationship between todos and categories
export const todoCategories = pgTable("todo_categories", {
    todo_id: uuid("todo_id").notNull().references(() => todos.id, { onDelete: "cascade" }),
    category_id: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    // Composite primary key to prevent duplicate associations
    pk: primaryKey({ columns: [table.todo_id, table.category_id] }),
    // Indexes for efficient lookups
    todo_id_idx: index("todo_categories_todo_id_idx").on(table.todo_id),
    category_id_idx: index("todo_categories_category_id_idx").on(table.category_id),
}));

// Define relationships between tables
export const usersRelations = relations(users, ({ many }) => ({
    todos: many(todos),
    categories: many(categories),
}));

export const todosRelations = relations(todos, ({ one, many }) => ({
    user: one(users, {
        fields: [todos.user_id],
        references: [users.id],
    }),
    todoCategories: many(todoCategories),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    user: one(users, {
        fields: [categories.user_id],
        references: [users.id],
    }),
    todoCategories: many(todoCategories),
}));

export const todoCategoriesRelations = relations(todoCategories, ({ one }) => ({
    todo: one(todos, {
        fields: [todoCategories.todo_id],
        references: [todos.id],
    }),
    category: one(categories, {
        fields: [todoCategories.category_id],
        references: [categories.id],
    }),
}));

// TypeScript types inferred from schema for type safety
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Todo = InferSelectModel<typeof todos>;
export type NewTodo = InferInsertModel<typeof todos>;

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

export type TodoCategory = InferSelectModel<typeof todoCategories>;
export type NewTodoCategory = InferInsertModel<typeof todoCategories>;

// Extended types for API responses and forms
export type TodoWithCategories = Todo & {
    categories: Category[];
};

export type CategoryWithCount = Category & {
    todoCount: number;
};

// Form data types for client-side validation
export type TodoFormData = {
    title: string;
    description?: string;
    priority: number;
    due_date?: Date | null;
    category_ids?: string[];
};

export type CategoryFormData = {
    name: string;
    color: string;
};

// Priority enum for type safety
export enum Priority {
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4,
}

// Filter types for query parameters
export type TodoFilters = {
    is_completed?: boolean;
    priority?: Priority;
    category_id?: string;
    search?: string;
};

export type TodoSortOption = "due_date" | "priority" | "created_at" | "title";
export type SortDirection = "asc" | "desc";
