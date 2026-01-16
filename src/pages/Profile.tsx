import { useEffect, useState } from "react";

import { Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateUserMutation, useUserQuery } from "@/hooks/useUsers";

export const Profile = () => {
  const { user: authUser } = useAuth();
  const { data: user, isLoading } = useUserQuery(authUser?.uid || "");
  const updateUser = useUpdateUserMutation();

  const [formData, setFormData] = useState(() => ({
    displayName: user?.displayName || "",
    phone: user?.phone || "",
  }));
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Initialize form from loaded user data
      setFormData({
        displayName: user.displayName || "",
        phone: user.phone || "",
      });
      setHasChanges(false);
    }
  }, [user]);

  const handleDisplayNameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, displayName: value }));
    setHasChanges(true);
  };

  const handlePhoneChange = (value: string) => {
    setFormData((prev) => ({ ...prev, phone: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!authUser?.uid) {
      toast.error("Ingen användare inloggad");
      return;
    }

    try {
      await updateUser.mutateAsync({
        uid: authUser.uid,
        updates: {
          displayName: formData.displayName.trim() || undefined,
          phone: formData.phone.trim() || undefined,
        },
      });
      toast.success("Profil uppdaterad");
      setHasChanges(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kunde inte uppdatera profil"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
        <span className="sr-only">Laddar...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Profil</h1>
        <p className="text-muted-foreground">
          Redigera ditt visningsnamn och telefonnummer
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Personuppgifter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={authUser?.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email kan inte ändras
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Visningsnamn</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              placeholder="Ditt namn"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefonnummer (valfritt)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="070-123 45 67"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateUser.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            Spara ändringar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
