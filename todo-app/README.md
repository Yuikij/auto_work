# Todo List Application

A simple and modern todo list application built with React and TypeScript.

## Features

- ✅ Add new todo items
- ✅ Mark items as complete
- ✅ Delete items
- ✅ Data persistence with localStorage
- ✅ Clean, modern UI with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

## Technology Stack

- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **localStorage** - Data persistence

## Project Structure

```
src/
├── components/
│   ├── AddTodo.tsx    # Form for adding new todos
│   ├── TodoItem.tsx   # Individual todo item component
│   └── TodoList.tsx   # List container for todos
├── hooks/
│   └── useTodos.ts    # Custom hook for todo management
├── types/
│   └── todo.ts        # TypeScript interfaces
├── App.tsx            # Main application component
├── main.tsx           # Application entry point
└── index.css          # Global styles with Tailwind
```
