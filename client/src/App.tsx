
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit, Plus, CheckCircle2, Circle, Sun, Moon } from 'lucide-react';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => 
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );

  // Form state for creating new todos
  const [newTodoForm, setNewTodoForm] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  // Form state for editing todos
  const [editTodoForm, setEditTodoForm] = useState<UpdateTodoInput>({
    id: 0,
    title: '',
    description: null,
    completed: false
  });

  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Toggle theme function
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoForm.title.trim()) return;

    setIsCreating(true);
    try {
      const newTodo = await trpc.createTodo.mutate(newTodoForm);
      setTodos((prev: Todo[]) => [newTodo, ...prev]);
      setNewTodoForm({ title: '', description: null });
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    setIsLoading(true);
    try {
      const updatedTodo = await trpc.updateTodo.mutate({
        id: todo.id,
        completed: !todo.completed
      });
      setTodos((prev: Todo[]) => 
        prev.map((t: Todo) => t.id === todo.id ? updatedTodo : t)
      );
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setEditTodoForm({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTodoForm.title?.trim()) return;

    setIsLoading(true);
    try {
      const updatedTodo = await trpc.updateTodo.mutate(editTodoForm);
      setTodos((prev: Todo[]) => 
        prev.map((t: Todo) => t.id === editTodoForm.id ? updatedTodo : t)
      );
      setIsEditDialogOpen(false);
      setEditingTodo(null);
    } catch (error) {
      console.error('Failed to update todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteTodo.mutate({ id: todoId });
      setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold mb-2">✅ My Todo List</h1>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="ml-4">
              {theme === 'light' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </Button>
          </div>
          <p className="text-muted-foreground">Stay organized and get things done!</p>
          {totalCount > 0 && (
            <div className="mt-4 flex justify-center gap-4">
              <Badge variant="secondary" className="text-sm">
                Total: {totalCount}
              </Badge>
              <Badge variant="default" className="text-sm bg-green-500">
                Completed: {completedCount}
              </Badge>
              <Badge variant="outline" className="text-sm">
                Remaining: {totalCount - completedCount}
              </Badge>
            </div>
          )}
        </div>

        {/* Create Todo Form */}
        <Card className="mb-8 shadow-lg border-0 bg-card text-card-foreground backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Plus className="w-5 h-5" />
              Add New Todo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTodo} className="space-y-4">
              <Input
                placeholder="What do you need to do? 🎯"
                value={newTodoForm.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTodoForm((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                }
                className="text-lg"
                required
              />
              <Textarea
                placeholder="Add some details... (optional)"
                value={newTodoForm.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNewTodoForm((prev: CreateTodoInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                rows={3}
              />
              <Button 
                type="submit" 
                disabled={isCreating || !newTodoForm.title.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isCreating ? 'Adding...' : '➕ Add Todo'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todo List */}
        {todos.length === 0 ? (
          <Card className="text-center py-12 shadow-lg border-0 bg-card text-card-foreground backdrop-blur">
            <CardContent>
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">No todos yet!</h3>
              <p className="text-muted-foreground">Create your first todo above to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {todos.map((todo: Todo) => (
              <Card 
                key={todo.id} 
                className={`shadow-lg border-0 transition-all duration-200 hover:shadow-xl ${
                  todo.completed 
                    ? 'bg-card/80 backdrop-blur border-l-4 border-l-green-500' 
                    : 'bg-card/80 backdrop-blur border-l-4 border-l-blue-500'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="flex items-center pt-1">
                      <button
                        onClick={() => handleToggleComplete(todo)}
                        disabled={isLoading}
                        className="hover:scale-110 transition-transform"
                      >
                        {todo.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-400 hover:text-blue-600" />
                        )}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold mb-2 ${
                        todo.completed ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p className={`text-muted-foreground mb-3 ${
                          todo.completed ? 'line-through opacity-75' : ''
                        }`}>
                          {todo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created: {todo.created_at.toLocaleDateString()}</span>
                        {todo.updated_at.getTime() !== todo.created_at.getTime() && (
                          <span>Updated: {todo.updated_at.toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Dialog open={isEditDialogOpen && editingTodo?.id === todo.id} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTodo(todo)}
                            className="hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Edit Todo</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleUpdateTodo} className="space-y-4">
                            <Input
                              placeholder="Todo title"
                              value={editTodoForm.title || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setEditTodoForm((prev: UpdateTodoInput) => ({ ...prev, title: e.target.value }))
                              }
                              required
                            />
                            <Textarea
                              placeholder="Description (optional)"
                              value={editTodoForm.description || ''}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                setEditTodoForm((prev: UpdateTodoInput) => ({
                                  ...prev,
                                  description: e.target.value || null
                                }))
                              }
                              rows={3}
                            />
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="completed"
                                checked={editTodoForm.completed || false}
                                onCheckedChange={(checked: boolean) =>
                                  setEditTodoForm((prev: UpdateTodoInput) => ({ ...prev, completed: checked }))
                                }
                              />
                              <label htmlFor="completed" className="text-sm font-medium">
                                Mark as completed
                              </label>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Updating...' : 'Update'}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-red-50 hover:border-red-200"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Todo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
