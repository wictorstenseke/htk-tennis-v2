import type { ReactNode } from "react";
import { useState } from "react";

import {
  CalendarIcon,
  HomeIcon,
  ListOrdered,
  LogOutIcon,
  Menu,
  Settings,
  UserIcon,
} from "lucide-react";

import { Link, useNavigate } from "@tanstack/react-router";

import { AuthDialog } from "@/components/auth/AuthDialog";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUserQuery } from "@/hooks/useUsers";
import { canAccessAdmin } from "@/lib/admin";
import { signOut } from "@/lib/auth";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, loading } = useAuth();
  const { data: currentUser } = useCurrentUserQuery();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const navigate = useNavigate();

  const isAdmin = canAccessAdmin(currentUser || null);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate({ to: "/" });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);
    navigate({ to: "/app" });
  };

  const handleAppClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setAuthDialogOpen(true);
    }
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full border-b bg-background py-4">
        <div className="container mx-auto max-w-screen-2xl px-2 sm:px-4 md:px-6 lg:px-8">
          {/* Desktop Menu */}
          <nav className="hidden items-center justify-between lg:flex">
            <div className="flex items-center gap-6">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2">
                <span className="text-lg font-semibold tracking-tighter">
                  HTK Tennis
                </span>
              </Link>
              {/* Desktop Nav Links */}
              <div className="flex items-center gap-6">
                <Link
                  to="/"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-accent-foreground"
                  activeProps={{ className: "bg-muted text-accent-foreground" }}
                >
                  <HomeIcon className="mr-2 h-4 w-4" />
                  Hem
                </Link>
                <Link
                  to="/app"
                  onClick={handleAppClick}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-accent-foreground"
                  activeProps={{ className: "bg-muted text-accent-foreground" }}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Boka
                </Link>
                <Link
                  to="/stegen"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-accent-foreground"
                  activeProps={{ className: "bg-muted text-accent-foreground" }}
                >
                  <ListOrdered className="mr-2 h-4 w-4" />
                  Stegen
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-accent-foreground"
                    activeProps={{ className: "bg-muted text-accent-foreground" }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Admin
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!loading && (
                <>
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || undefined} alt={displayName} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <span className="hidden truncate sm:inline">{displayName}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="truncate">
                          {user.email}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/profile" className="cursor-pointer">
                            <UserIcon className="mr-2 h-4 w-4" />
                            Profil
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut}>
                          <LogOutIcon className="mr-2 h-4 w-4" />
                          Logga ut
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAuthDialogOpen(true)}
                    >
                      Logga in
                    </Button>
                  )}
                </>
              )}
              <ModeToggle />
            </div>
          </nav>

          {/* Mobile Menu */}
          <div className="block lg:hidden">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2">
                <span className="text-lg font-semibold tracking-tighter">
                  HTK Tennis
                </span>
              </Link>
              <div className="flex items-center gap-2">
                {!loading && !user && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAuthDialogOpen(true)}
                  >
                    Logga in
                  </Button>
                )}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>
                        <Link to="/" className="flex items-center gap-2">
                          <span className="text-lg font-semibold tracking-tighter">
                            HTK Tennis
                          </span>
                        </Link>
                      </SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-6 p-4">
                      <nav className="flex flex-col gap-4">
                        <Link
                          to="/"
                          className="flex items-center gap-2 text-md font-semibold"
                        >
                          <HomeIcon className="h-4 w-4" />
                          Hem
                        </Link>
                        <Link
                          to="/app"
                          onClick={handleAppClick}
                          className="flex items-center gap-2 text-md font-semibold"
                        >
                          <CalendarIcon className="h-4 w-4" />
                          Boka
                        </Link>
                        <Link
                          to="/stegen"
                          className="flex items-center gap-2 text-md font-semibold"
                        >
                          <ListOrdered className="h-4 w-4" />
                          Stegen
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 text-md font-semibold"
                          >
                            <Settings className="h-4 w-4" />
                            Admin
                          </Link>
                        )}
                      </nav>

                      {!loading && user && (
                        <div className="flex flex-col gap-3 border-t pt-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.photoURL || undefined} alt={displayName} />
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold">{displayName}</span>
                              <span className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            asChild
                          >
                            <Link to="/profile">
                              <UserIcon className="mr-2 h-4 w-4" />
                              Profil
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={handleSignOut}
                          >
                            <LogOutIcon className="mr-2 h-4 w-4" />
                            Logga ut
                          </Button>
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onSuccess={handleAuthSuccess}
      />

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto max-w-screen-2xl px-2 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 sm:py-6 md:py-8">
        <div className="container mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-4 px-2 sm:px-4 md:flex-row md:px-6 lg:px-8">
          <p className="text-center text-xs sm:text-sm leading-loose text-muted-foreground md:text-left">
            Built with React, Vite, and shadcn/ui
          </p>
        </div>
      </footer>
    </div>
  );
}
