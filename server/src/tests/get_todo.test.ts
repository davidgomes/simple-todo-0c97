
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodoInput } from '../schema';
import { getTodo } from '../handlers/get_todo';

describe('getTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a todo by id', async () => {
    // Create a test todo first
    const testTodo = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing',
        completed: false
      })
      .returning()
      .execute();

    const input: GetTodoInput = {
      id: testTodo[0].id
    };

    const result = await getTodo(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testTodo[0].id);
    expect(result!.title).toEqual('Test Todo');
    expect(result!.description).toEqual('A todo for testing');
    expect(result!.completed).toEqual(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent todo', async () => {
    const input: GetTodoInput = {
      id: 999
    };

    const result = await getTodo(input);

    expect(result).toBeNull();
  });

  it('should get completed todo correctly', async () => {
    // Create a completed test todo
    const testTodo = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: 'A completed todo',
        completed: true
      })
      .returning()
      .execute();

    const input: GetTodoInput = {
      id: testTodo[0].id
    };

    const result = await getTodo(input);

    expect(result).not.toBeNull();
    expect(result!.completed).toEqual(true);
    expect(result!.title).toEqual('Completed Todo');
  });
});
