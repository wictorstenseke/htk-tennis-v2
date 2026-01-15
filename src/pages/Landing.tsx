import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function Landing() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12 md:py-24">
      {/* Hero Section */}
      <div className="flex max-w-4xl flex-col items-center space-y-4 text-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
          Welcome to Your App
        </h1>
        <p className="max-w-2xl text-xl text-muted-foreground">
          A modern React boilerplate with Vite, TypeScript, Tailwind CSS,
          shadcn/ui, TanStack Router, and TanStack Query. Built with best
          practices and ready to scale.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link to="/example">Get Started</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/query-demo">Query Demo</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a
              href="https://github.com/wictorstenseke/vite-react-fe"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full max-w-6xl pt-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              Fast Development
            </h3>
            <p className="text-sm text-muted-foreground">
              Hot Module Replacement with Vite for instant feedback during
              development.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              Type Safe
            </h3>
            <p className="text-sm text-muted-foreground">
              Full TypeScript support with strict mode enabled for better code
              quality.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              Modern UI
            </h3>
            <p className="text-sm text-muted-foreground">
              Beautiful components from shadcn/ui with Tailwind CSS for easy
              customization.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              TanStack Ecosystem
            </h3>
            <p className="text-sm text-muted-foreground">
              TanStack Router for type-safe routing and TanStack Query for
              powerful data fetching with automatic caching.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              Testing Ready
            </h3>
            <p className="text-sm text-muted-foreground">
              Vitest configured with coverage support for reliable testing.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              CI/CD Ready
            </h3>
            <p className="text-sm text-muted-foreground">
              GitHub Actions workflow included for automated testing and
              deployment.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              ESLint & Prettier
            </h3>
            <p className="text-sm text-muted-foreground">
              Code quality tools pre-configured to maintain consistent style and
              catch errors early.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              React 19
            </h3>
            <p className="text-sm text-muted-foreground">
              Built with the latest React version featuring improved performance
              and new APIs.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              Developer Experience
            </h3>
            <p className="text-sm text-muted-foreground">
              Optimized setup with hot reload, type checking, and modern tooling
              for productive development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
