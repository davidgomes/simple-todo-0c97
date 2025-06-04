
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTodo = async (input: UpdateTodoInput): Promise<Todo> => {
  try {
    // Build the update values object, only including fields that are provided
    const updateValues: Partial<typeof todosTable.$inferInsert> = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.title !== undefined) {
      updateValues.title = input.title;
    }

    if (input.description !== undefined) {
      updateValues.description = input.description;
    }

    if (input.completed !== undefined) {
      updateValues.completed = input.completed;
    }

    // Update the todo and return the updated record
    const result = await db.update(todosTable)
      .set(updateValues)
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Todo with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Todo update failed:', error);
    throw error;
  }
};
