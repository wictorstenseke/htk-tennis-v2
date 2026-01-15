import { Dialog, DialogContent } from "@/components/ui/dialog";

import { LoginForm } from "./LoginForm";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <LoginForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
};
