import { AddTodo } from './components/AddTodo';
import { TodoList } from './components/TodoList';
import { useTodos } from './hooks/useTodos';

function App() {
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodos();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          My Todo List
        </h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <AddTodo onAdd={addTodo} />
          <TodoList
            todos={todos}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
