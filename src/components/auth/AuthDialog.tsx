import { Dialog, DialogContent } from "@/components/ui/dialog";

import { LoginForm } from "./LoginForm";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultMode?: "signin" | "signup";
}

export const AuthDialog = ({
  open,
  onOpenChange,
  onSuccess,
  defaultMode = "signin",
}: AuthDialogProps) => {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <LoginForm onSuccess={handleSuccess} defaultMode={defaultMode} />
      </DialogContent>
    </Dialog>
  );
};
