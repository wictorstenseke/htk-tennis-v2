import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function Landing() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12 md:py-24">
      {/* Hero Section */}
      <div className="flex max-w-4xl flex-col items-center space-y-4 text-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
          HTK Tennis V2
        </h1>
        <p className="max-w-2xl text-xl text-muted-foreground">
          Hogelids Tennis Klubb - A modern web application for managing tennis
          club activities, built with React, TypeScript, and Firebase.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link to="/example">View Examples</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a
              href="https://github.com/wictorstenseke/htk-tennis-v2"
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
              Firebase Authentication
            </h3>
            <p className="text-sm text-muted-foreground">
              Secure user authentication with Firebase Auth for club members.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              Cloud Firestore
            </h3>
            <p className="text-sm text-muted-foreground">
              Real-time database for managing club data, schedules, and member information.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              Modern UI
            </h3>
            <p className="text-sm text-muted-foreground">
              Beautiful, responsive interface built with shadcn/ui and Tailwind CSS.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              Type Safe
            </h3>
            <p className="text-sm text-muted-foreground">
              Full TypeScript support for better code quality and developer experience.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              Fast & Reliable
            </h3>
            <p className="text-sm text-muted-foreground">
              Built with Vite for lightning-fast development and optimized production builds.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              Mobile Responsive
            </h3>
            <p className="text-sm text-muted-foreground">
              Mobile-first design ensures great experience on all devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
