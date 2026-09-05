# Smart Budget — Frontend Client

Modern React + Vite + TypeScript web client for the Smart Budget system, conforming to API Contract v0.3.0.

## Tech Stack
- **Framework**: React 18, Vite 5, TypeScript 5
- **Styling**: Tailwind CSS (dark-first theme), Lucide React
- **Data & State**: TanStack React Query v5, Axios, React Hook Form, Zod
- **Routing**: React Router v6

## Getting Started

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `VITE_API_BASE_URL` points to your backend:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

## Project Structure
```
frontend/
├── src/
│   ├── api/          # Axios client & endpoint services
│   ├── components/   # UI primitives (Button, Card, Badge, Toast, etc.)
│   ├── features/     # Feature-specific state and context
│   ├── hooks/        # Reusable custom hooks (useAuth, etc.)
│   ├── layouts/      # App shell (AppLayout, Sidebar)
│   ├── lib/          # Utilities and QueryClient setup
│   ├── pages/        # Route views
│   ├── routes/       # Protected, public, and route tree
│   ├── styles/       # Tailwind CSS styles
│   └── types/        # TypeScript API models (v0.3.0)
```
