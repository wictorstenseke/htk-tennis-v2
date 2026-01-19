import { useEffect, useState } from "react";

import {
  CalendarIcon,
  HomeIcon,
  ListOrdered,
  LogOutIcon,
  PlusCircle,
  Settings,
  UserIcon,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUserQuery } from "@/hooks/useUsers";
import { canAccessAdmin } from "@/lib/admin";

interface CommandPaletteProps {
  onOpenBookingDialog: () => void;
  onSignOut: () => void;
}

export const CommandPalette = ({
  onOpenBookingDialog,
  onSignOut,
}: CommandPaletteProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: currentUser } = useCurrentUserQuery();

  const isAdmin = canAccessAdmin(currentUser || null);
  const isMac =
    typeof navigator !== "undefined"
      ? /Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
        /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
      : false;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleNavigate = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  const handleAction = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Kommandopalett"
      description="Sök efter sidor och åtgärder"
    >
      <CommandInput placeholder="Sök efter åtgärder och sidor..." />
      <CommandList>
        <CommandEmpty>Inga resultat hittades.</CommandEmpty>

        {user && (
          <CommandGroup heading="Åtgärder">
            <CommandItem onSelect={() => handleAction(onOpenBookingDialog)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              <span>Boka ny match</span>
            </CommandItem>
            <CommandItem onSelect={() => handleAction(onSignOut)}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              <span>Logga ut</span>
            </CommandItem>
          </CommandGroup>
        )}

        {user && <CommandSeparator />}

        <CommandGroup heading="Navigering">
          <CommandItem onSelect={() => handleNavigate("/")}>
            <HomeIcon className="mr-2 h-4 w-4" />
            <span>Hem</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("/app")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>Bokningar</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("/stegen")}>
            <ListOrdered className="mr-2 h-4 w-4" />
            <span>Stegen</span>
          </CommandItem>
          {user && (
            <CommandItem onSelect={() => handleNavigate("/profile")}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </CommandItem>
          )}
          {isAdmin && (
            <CommandItem onSelect={() => handleNavigate("/admin")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Admin</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
      <div className="border-t p-2">
        <p className="text-xs text-muted-foreground text-center">
          Tryck{" "}
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            {isMac ? "⌘" : "Ctrl"}+K
          </kbd>{" "}
          för att öppna
        </p>
      </div>
    </CommandDialog>
  );
};
