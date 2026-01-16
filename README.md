# HTK Tennis V2

A modern web application for Hogelids Tennis Klubb (HTK), built with React, TypeScript, and Firebase authentication and user management.

## 🚀 Features

- ⚡️ **Vite (Rolldown)** - Lightning fast build tool powered by Rust-based Rolldown bundler
- ⚛️ **React 19** - Latest React with TypeScript
- 🔥 **Firebase** - Authentication and Firestore database
- 🔐 **Protected Routes** - Route guards with Firebase Auth integration
- 🎨 **Tailwind CSS v4** - Utility-first CSS framework
- 🧩 **shadcn/ui** - Beautiful, accessible components built on Radix UI primitives
- 🛣️ **TanStack Router** - Type-safe file-based routing with auto-generated route tree
- 🔄 **TanStack Query** - Powerful data fetching and caching
- ✅ **Vitest** - Fast unit testing with coverage
- 🔍 **ESLint** - Code linting with import ordering and unused imports detection
- 💅 **Prettier** - Code formatting (integrated with ESLint)
- 🤖 **GitHub Actions** - CI/CD pipeline
- 📱 **Responsive** - Mobile-first design

### About Rolldown-Vite

This boilerplate uses [rolldown-vite](https://vite.dev/guide/migration#rolldown-migration) (aliased as `vite`), Vite's experimental Rust-based bundler that's 5-10x faster than the JavaScript bundler. It's a drop-in replacement providing identical API and significantly improved build performance.

## 📦 Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── AuthDialog.tsx      # Auth dialog (sign in/sign up)
│   │   └── LoginForm.tsx       # Login/signup form component
│   ├── layout/
│   │   └── AppShell.tsx        # Main layout wrapper with auth state
│   └── ui/                      # shadcn/ui components
├── pages/
│   ├── Landing.tsx              # Login page (/) - unauthenticated users
│   └── App.tsx                  # Users table (/app) - authenticated users
├── routes/                      # TanStack Router routes
│   ├── __root.tsx               # Root layout
│   ├── index.tsx                # / route (redirects to /app if authenticated)
│   └── app.tsx                  # /app route (protected, requires auth)
├── hooks/
│   ├── useAuth.ts               # Firebase auth hook
│   ├── usePosts.ts              # Example query hooks
│   └── useUsers.ts              # Users query hook (Firestore)
├── lib/
│   ├── api.ts                   # API client with Firestore integration
│   ├── auth.ts                  # Firebase auth functions
│   ├── firebase.ts              # Firebase configuration
│   ├── queryClient.ts           # TanStack Query configuration
│   └── utils.ts                 # Utility functions
├── types/
│   └── api.ts                   # API type definitions (Post, User)
├── router.tsx                   # Router configuration
├── main.tsx                     # App entry point
└── index.css                    # Global styles
```

## 🔐 Authentication & Authorization

This app uses Firebase Authentication with the following flow:

1. **Unauthenticated Users**: Redirected to `/` (landing page with login form)
2. **Authenticated Users**: Redirected to `/app` (protected users table)

### Route Guards

Routes use `beforeLoad` guards to check authentication:

- `/` - Redirects authenticated users to `/app`
- `/app` - Redirects unauthenticated users to `/`

### Auth Functions

```tsx
import { signIn, signUp, signOut } from "@/lib/auth";

// Sign in with email/password
await signIn("user@example.com", "password");

// Sign up new user
await signUp("user@example.com", "password");

// Sign out
await signOut();
```

### Using Auth State

```tsx
import { useAuth } from "@/hooks/useAuth";

const MyComponent = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;

  return <div>Welcome, {user.email}!</div>;
};
```

## 🛠️ Getting Started

### Prerequisites

You need Firebase project credentials. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then fill in your Firebase configuration values:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

Build process runs type checking, linting, tests, and builds the app. Any failure stops the build.

## 📝 Available Scripts

### Development

- `npm run dev` - Start dev server with hot reload

### Building

- `npm run build` - Full production build (runs type-check, lint, test, then builds)
- `npm run preview` - Preview production build locally

### Type Checking & Linting

- `npm run generate:routes` - Generate TanStack Router route tree (auto-run by type-check)
- `npm run type-check` - Run TypeScript type checking (generates routes first)
- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files are formatted correctly

### Testing

- `npm run test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Quality Checks

- `npm run ci` - Run all quality checks (type-check, lint, test) - used in CI pipeline
- `npm run check` - Alias for `ci`
- `npm run check:full` - Run all checks including build (most comprehensive)

## 🎨 Adding Components

Add shadcn/ui components:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

Components will be installed in `src/components/ui/`.

## 🛣️ Adding Routes

TanStack Router uses file-based routing with automatic route tree generation.

1. Create a new file in `src/routes/`:

```tsx
// src/routes/about.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return <div>About Page</div>;
}
```

2. The route tree is auto-generated:
   - TanStack Router Vite plugin watches `src/routes/` for changes
   - Generates `src/routeTree.gen.ts` automatically (git-ignored)
   - No manual registration needed - just create route files and they work!

**Note:** You don't need to manually run `generate:routes` - it happens automatically during development and before type-checking.

## 🔄 Data Fetching with TanStack Query

TanStack Query is configured with sensible defaults for automatic caching, background refetching, and optimistic updates.

### Query Configuration

The global QueryClient is configured in `src/lib/queryClient.ts`:

- **staleTime**: 5 minutes - data is fresh for this duration
- **gcTime**: 30 minutes - unused data stays in cache
- **retry**: 1 - queries retry once on failure
- **refetchOnWindowFocus**: true - refetch when window regains focus
- **refetchOnReconnect**: true - refetch when network reconnects

### Creating Query Hooks

Create custom hooks in `src/hooks/`:

```tsx
// src/hooks/usePosts.ts
import { useQuery } from "@tanstack/react-query";
import { postsApi } from "@/lib/api";

export const usePostsQuery = (params?: PaginationParams) => {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: () => postsApi.getPosts(params),
  });
};
```

### Using Queries in Components

```tsx
import { usePostsQuery } from "@/hooks/usePosts";

const MyComponent = () => {
  const { data, isLoading, isError, error } = usePostsQuery();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return <div>{/* Render data */}</div>;
};
```

### Mutations with Optimistic Updates

```tsx
import { useUpdatePostMutation } from "@/hooks/usePosts";

const MyComponent = () => {
  const updatePost = useUpdatePostMutation();

  const handleUpdate = () => {
    updatePost.mutate({
      id: 1,
      data: { title: "Updated Title" },
    });
  };

  return <button onClick={handleUpdate}>Update</button>;
};
```

### DevTools

React Query Devtools are included in development mode. Click the floating icon to:

- Inspect query cache
- View query states
- Manually trigger refetches
- Debug query configurations

## 🗄️ Firestore Data Structure

### Users Collection

The app expects a `users` collection in Firestore with documents containing:

```typescript
{
  email: string;          // User email address
  displayName?: string;   // Optional display name
  createdAt?: string;     // ISO date string
}
```

Documents are identified by the Firebase Auth UID as the document ID.

### Remaining Firebase Setup & Metadata

- Create the `bookings` collection indexes for `startDate` (ascending/descending) as outlined in `docs/booking-data-structure.md`.
- Ensure booking documents can store ladder metadata (`playerAId`, `playerBId`, `ladderStatus`, `winnerId`, `comment`).
- Update Firestore security rules to allow ladder match fields for authorized users.

## 🎯 Layout System

The `AppShell` component provides:

- Sticky header with navigation
- Responsive container (max-width + padding)
- Consistent spacing across pages
- Mobile-first responsive design
- Footer

All pages automatically use this layout via the root route.

## 🧪 Testing

This project uses **Vitest** with **@testing-library/react** for comprehensive testing.

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Test Files

Create test files with `.test.tsx` or `.test.ts` extension, co-located with the code they test:

```tsx
// button.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "./button";

describe("Button", () => {
  it("handles click events", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole("button"));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing with React Query

For components using TanStack Query, use the provided test utilities:

```tsx
import { renderWithQueryClient } from "@/test/utils";

it("fetches and displays data", async () => {
  renderWithQueryClient(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText("Data loaded")).toBeInTheDocument();
  });
});
```

📚 **[Complete Testing Guide](./docs/testing.md)** - Detailed testing strategies, patterns, and best practices

## 🔧 VS Code Setup

Recommended extensions (auto-suggested when opening the project):

- ESLint
- Prettier
- Tailwind CSS IntelliSense

Settings are pre-configured for:

- Format on save
- Auto-fix ESLint issues
- Consistent line endings

## 🚀 CI/CD

GitHub Actions workflow is included (`.github/workflows/ci.yml`):

- Runs on push/PR to main/master/develop
- Type checking
- Linting
- Testing
- Building

## 📚 Learn More

- [Vite Documentation](https://vite.dev)
- [React Documentation](https://react.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TanStack Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Vitest](https://vitest.dev)

## 📄 License

MIT

## 🤝 Contributing

Feel free to customize this boilerplate for your needs!
