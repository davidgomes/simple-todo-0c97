
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a test todo first
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing deletion',
        completed: false
      })
      .returning()
      .execute();

    const todoId = insertResult[0].id;
    const input: DeleteTodoInput = { id: todoId };

    // Delete the todo
    const result = await deleteTodo(input);

    // Should return success
    expect(result.success).toBe(true);

    // Verify todo is deleted from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false for non-existent todo', async () => {
    const input: DeleteTodoInput = { id: 999 };

    const result = await deleteTodo(input);

    // Should return false when no todo exists
    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting', async () => {
    // Create multiple test todos
    const insertResult = await db.insert(todosTable)
      .values([
        {
          title: 'Todo 1',
          description: 'First todo',
          completed: false
        },
        {
          title: 'Todo 2', 
          description: 'Second todo',
          completed: true
        }
      ])
      .returning()
      .execute();

    const [todo1, todo2] = insertResult;
    const input: DeleteTodoInput = { id: todo1.id };

    // Delete only the first todo
    const result = await deleteTodo(input);

    expect(result.success).toBe(true);

    // Verify first todo is deleted
    const deletedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo1.id))
      .execute();

    expect(deletedTodos).toHaveLength(0);

    // Verify second todo still exists
    const remainingTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo2.id))
      .execute();

    expect(remainingTodos).toHaveLength(1);
    expect(remainingTodos[0].title).toEqual('Todo 2');
  });
});
