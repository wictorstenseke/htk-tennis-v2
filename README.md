# HTK Tennis V2

A modern web application for Hogelids Tennis Klubb (HTK), built with React, TypeScript, and Firebase.

## 🚀 Features

- ⚡️ **Vite (Rolldown)** - Lightning fast build tool powered by Rust-based Rolldown bundler
- ⚛️ **React 19** - Latest React with TypeScript
- 🔥 **Firebase** - Authentication and Firestore database
- 🎨 **Tailwind CSS v4** - Utility-first CSS framework
- 🧩 **shadcn/ui** - Beautiful, accessible components built on Radix UI primitives
- 🛣️ **TanStack Router** - Type-safe file-based routing with auto-generated route tree
- 🔄 **TanStack Query** - Powerful data fetching and caching
- ✅ **Vitest** - Fast unit testing with coverage
- 🔍 **ESLint** - Code linting with import ordering and unused imports detection
- 💅 **Prettier** - Code formatting (integrated with ESLint)
- 🤖 **GitHub Actions** - CI/CD pipeline
- 📱 **Responsive** - Mobile-first design

## 📦 Project Structure

```
src/
├── components/
│   ├── auth/                  # Authentication components
│   │   ├── AuthDialog.tsx     # Login dialog
│   │   └── LoginForm.tsx      # Login form
│   ├── layout/
│   │   └── AppShell.tsx       # Main layout wrapper
│   └── ui/                    # shadcn/ui components
├── pages/                     # Page components
├── routes/                    # TanStack Router routes
│   └── __root.tsx             # Root layout
├── hooks/                     # Custom React hooks
├── lib/
│   ├── firebase.ts            # Firebase initialization
│   ├── auth.ts                # Authentication utilities
│   ├── queryClient.ts         # TanStack Query configuration
│   └── utils.ts               # Utility functions
├── types/                     # TypeScript type definitions
├── router.tsx                 # Router configuration
├── main.tsx                   # App entry point
└── index.css                  # Global styles
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project (see Firebase Setup below)

### Install dependencies

```bash
npm install
```

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password or other providers)
3. Create a Firestore database
4. Copy your Firebase configuration
5. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

6. Fill in your Firebase credentials in the `.env` file:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Start development server

```bash
npm run dev
```

### Firebase Emulators (Optional)

For local development without using production Firebase:

```bash
firebase emulators:start
```

This starts:
- Authentication emulator on port 9099
- Firestore emulator on port 8080
- Firebase UI on port 4000

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
// src/hooks/useMatches.ts
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const useMatchesQuery = () => {
  return useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "matches"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  });
};
```

### Using Queries in Components

```tsx
import { useMatchesQuery } from "@/hooks/useMatches";

const MyComponent = () => {
  const { data, isLoading, isError, error } = useMatchesQuery();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return <div>{/* Render data */}</div>;
};
```

### DevTools

React Query Devtools are included in development mode. Click the floating icon to:

- Inspect query cache
- View query states
- Manually trigger refetches
- Debug query configurations

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

## 📋 Cursor Rules

This project uses modular cursor rules stored in `.cursor/rules/` to maintain consistent coding standards:

- `global.mdc` - Project-wide conventions and TypeScript standards
- `react-components.mdc` - React component patterns and JSX conventions
- `firebase.mdc` - Firebase and Firestore patterns
- `tanstack-query.mdc` - TanStack Query patterns for data fetching
- `tanstack-router.mdc` - TanStack Router file-based routing conventions
- `testing.mdc` - Vitest testing conventions
- `ui-components.mdc` - Shadcn UI component patterns (Radix UI/Base UI)

These rules are authoritative and should be read before making changes to the codebase.

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

## 🔥 Firebase Deployment

### Setup

```bash
npm install -g firebase-tools
firebase login
firebase init
```

### Deploy

```bash
npm run build
firebase deploy
```

### Firestore Security Rules

The project includes Firestore security rules in `firestore.rules`. Currently set to DEV MODE (open access):

⚠️ **WARNING**: Before deploying to production, update the security rules to restrict access appropriately:

```javascript
// Example production rules
match /databases/{database}/documents {
  match /{document=**} {
    allow read: if isAuthenticated();
    allow write: if isAdminOrSuperUser();
  }
}
```

Helper functions for role-based access control are already defined in the rules file.

## 📄 License

MIT

## 🏸 About HTK

Hogelids Tennis Klubb is a tennis club providing facilities and activities for tennis enthusiasts.
