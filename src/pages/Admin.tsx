import { useEffect, useState } from "react";

import { Archive, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useAnnouncementQuery,
  useUpdateAnnouncementMutation,
} from "@/hooks/useAnnouncements";
import {
  useAppSettingsQuery,
  useUpdateAppSettingsMutation,
} from "@/hooks/useAppSettings";
import {
  useArchiveLadderMutation,
  useCreateLadderMutation,
  useLaddersQuery,
} from "@/hooks/useLadders";
import {
  useCurrentUserQuery,
  useUpdateUserMutation,
  useUsersQuery,
} from "@/hooks/useUsers";
import { canEditRoles } from "@/lib/admin";
import { mockedUsers } from "@/lib/mockedUsers";

import type { Announcement, Ladder, User } from "@/types/api";

interface AnnouncementFormData {
  title: string;
  body: string;
  enabled: boolean;
  links: Array<{ label: string; url: string }>;
}

interface LadderFormData {
  name: string;
  year: number;
  season?: string;
  startDate: string;
}

export const Admin = () => {
  const { data: currentUser } = useCurrentUserQuery();
  const { data: appSettings, isLoading: settingsLoading } =
    useAppSettingsQuery();
  const { data: announcement, isLoading: announcementLoading } =
    useAnnouncementQuery();
  const { data: users, isLoading: usersLoading } = useUsersQuery();
  const { data: ladders, isLoading: laddersLoading } = useLaddersQuery();

  const updateSettings = useUpdateAppSettingsMutation();
  const updateAnnouncement = useUpdateAnnouncementMutation();
  const updateUser = useUpdateUserMutation();
  const createLadder = useCreateLadderMutation();
  const archiveLadder = useArchiveLadderMutation();

  const [announcementForm, setAnnouncementForm] =
    useState<AnnouncementFormData>({
      title: "",
      body: "",
      enabled: false,
      links: [],
    });

  const [ladderForm, setLadderForm] = useState<LadderFormData>({
    name: "",
    year: new Date().getFullYear(),
    season: "",
    startDate: new Date().toISOString().split("T")[0],
  });

  const [userRoles, setUserRoles] = useState<Record<string, string>>({});

  const isSuperUser = canEditRoles(currentUser || null);

  useEffect(() => {
    if (announcement) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Initialize form from loaded announcement
      setAnnouncementForm({
        title: announcement.title,
        body: announcement.body,
        enabled: announcement.enabled,
        links: announcement.links || [],
      });
    }
  }, [announcement]);

  const handleBookingsToggle = async (enabled: boolean) => {
    try {
      await updateSettings.mutateAsync({ bookingsEnabled: enabled });
      toast.success(
        enabled ? "Bokningar aktiverade" : "Bokningar inaktiverade"
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Kunde inte uppdatera bokningsinställningar"
      );
    }
  };

  const handleAnnouncementSave = async () => {
    try {
      const updates: Partial<Announcement> = {
        title: announcementForm.title,
        body: announcementForm.body,
        enabled: announcementForm.enabled,
        links:
          announcementForm.links.length > 0
            ? announcementForm.links
            : undefined,
      };
      await updateAnnouncement.mutateAsync(updates);
      toast.success("Meddelande uppdaterat");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kunde inte uppdatera meddelande"
      );
    }
  };

  const handleAddLink = () => {
    setAnnouncementForm((prev) => ({
      ...prev,
      links: [...prev.links, { label: "", url: "" }],
    }));
  };

  const handleRemoveLink = (index: number) => {
    setAnnouncementForm((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  };

  const handleLinkChange = (
    index: number,
    field: "label" | "url",
    value: string
  ) => {
    setAnnouncementForm((prev) => ({
      ...prev,
      links: prev.links.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const handleRoleChange = (uid: string, role: string) => {
    setUserRoles((prev) => ({ ...prev, [uid]: role }));
  };

  const handleSaveUserRole = async (user: User) => {
    try {
      const newRole = userRoles[user.uid];
      const roleValue =
        newRole === "admin"
          ? "admin"
          : newRole === "superuser"
            ? "superuser"
            : newRole === "user"
              ? "user"
              : undefined;

      await updateUser.mutateAsync({
        uid: user.uid,
        updates: { role: roleValue },
      });
      toast.success(`Roll uppdaterad för ${user.displayName || user.email}`);
      setUserRoles((prev) => {
        const updated = { ...prev };
        delete updated[user.uid];
        return updated;
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kunde inte uppdatera roll"
      );
    }
  };

  const handleCreateLadder = async () => {
    try {
      if (!ladderForm.name || !ladderForm.year || !ladderForm.startDate) {
        toast.error("Fyll i alla obligatoriska fält");
        return;
      }

      const newLadder: Omit<Ladder, "id" | "createdAt"> = {
        name: ladderForm.name,
        year: ladderForm.year,
        season: ladderForm.season || undefined,
        startDate: new Date(ladderForm.startDate).toISOString(),
        status: "active",
        participants: [],
      };

      await createLadder.mutateAsync(newLadder);
      toast.success("Stege skapad");
      setLadderForm({
        name: "",
        year: new Date().getFullYear(),
        season: "",
        startDate: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kunde inte skapa stege"
      );
    }
  };

  const handleArchiveLadder = async (ladderId: string, ladderName: string) => {
    try {
      await archiveLadder.mutateAsync(ladderId);
      toast.success(`${ladderName} arkiverad`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kunde inte arkivera stege"
      );
    }
  };

  const allUsers = [...(users || []), ...mockedUsers];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-muted-foreground">
          Hantera appinställningar, meddelanden och användarroller
        </p>
      </div>

      {settingsLoading || announcementLoading || usersLoading || laddersLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
          <span className="sr-only">Laddar...</span>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Bokningsinställningar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="bookings-toggle">Aktivera bokningar</Label>
                  <p className="text-sm text-muted-foreground">
                    Tillåt eller blockera nya bokningar i systemet
                  </p>
                </div>
                <Switch
                  id="bookings-toggle"
                  checked={appSettings?.bookingsEnabled ?? true}
                  onCheckedChange={handleBookingsToggle}
                  disabled={updateSettings.isPending}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meddelande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="announcement-title">Titel</Label>
                <Input
                  id="announcement-title"
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Meddelandetitel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="announcement-body">Text</Label>
                <Textarea
                  id="announcement-body"
                  value={announcementForm.body}
                  onChange={(e) =>
                    setAnnouncementForm((prev) => ({
                      ...prev,
                      body: e.target.value,
                    }))
                  }
                  placeholder="Meddelande..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Länkar (valfritt)</Label>
                <div className="space-y-2">
                  {announcementForm.links.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Länktext"
                        value={link.label}
                        onChange={(e) =>
                          handleLinkChange(index, "label", e.target.value)
                        }
                      />
                      <Input
                        placeholder="URL"
                        value={link.url}
                        onChange={(e) =>
                          handleLinkChange(index, "url", e.target.value)
                        }
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveLink(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={handleAddLink}>
                    <Plus className="mr-2 h-4 w-4" />
                    Lägg till länk
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="announcement-enabled">Visa meddelande</Label>
                  <p className="text-sm text-muted-foreground">
                    Visa meddelandet på bokningssidan
                  </p>
                </div>
                <Switch
                  id="announcement-enabled"
                  checked={announcementForm.enabled}
                  onCheckedChange={(checked) =>
                    setAnnouncementForm((prev) => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <Button
                onClick={handleAnnouncementSave}
                disabled={updateAnnouncement.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                Spara meddelande
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Användarhantering</CardTitle>
            </CardHeader>
            <CardContent>
              {!isSuperUser && (
                <Alert className="mb-4">
                  <AlertTitle>Begränsad åtkomst</AlertTitle>
                  <AlertDescription>
                    Du kan se användarroller men endast superanvändare kan
                    redigera dem.
                  </AlertDescription>
                </Alert>
              )}
              {allUsers.length === 0 ? (
                <div className="rounded-lg border border-muted bg-muted/50 p-8 text-center">
                  <p className="text-muted-foreground">Inga användare hittades</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Namn</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Roll</TableHead>
                        {isSuperUser && <TableHead>Åtgärder</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.map((user) => {
                        const hasChanges = user.uid in userRoles;
                        const currentRole = userRoles[user.uid] || user.role || "user";

                        return (
                          <TableRow key={user.uid}>
                            <TableCell className="font-medium">
                              {user.email}
                            </TableCell>
                            <TableCell>{user.displayName || "-"}</TableCell>
                            <TableCell>{user.phone || "-"}</TableCell>
                            <TableCell>
                              {isSuperUser ? (
                                <Select
                                  value={currentRole}
                                  onValueChange={(value) =>
                                    handleRoleChange(user.uid, value)
                                  }
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="superuser">
                                      Superuser
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : user.role ? (
                                <Badge variant="secondary">
                                  {user.role === "admin"
                                    ? "Admin"
                                    : user.role === "superuser"
                                      ? "Superuser"
                                      : "User"}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            {isSuperUser && (
                              <TableCell>
                                {hasChanges && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveUserRole(user)}
                                    disabled={updateUser.isPending}
                                  >
                                    Spara
                                  </Button>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stege Hantering</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isSuperUser && (
                <Alert className="mb-4">
                  <AlertTitle>Begränsad åtkomst</AlertTitle>
                  <AlertDescription>
                    Du kan se steginformation men endast superanvändare kan
                    skapa och arkivera stegar.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Alla Stegar</h3>
                {!ladders || ladders.length === 0 ? (
                  <div className="rounded-lg border border-muted bg-muted/50 p-8 text-center">
                    <p className="text-muted-foreground">Inga stegar hittades</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Namn</TableHead>
                          <TableHead>År</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Deltagare</TableHead>
                          <TableHead>Startdatum</TableHead>
                          {isSuperUser && <TableHead>Åtgärder</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ladders.map((ladder) => {
                          const isActive = ladder.status === "active";
                          const startDate = new Date(
                            ladder.startDate
                          ).toLocaleDateString("sv-SE");

                          return (
                            <TableRow key={ladder.id}>
                              <TableCell className="font-medium">
                                {ladder.name}
                              </TableCell>
                              <TableCell>{ladder.year}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={isActive ? "default" : "secondary"}
                                >
                                  {isActive ? "Aktiv" : "Arkiverad"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {ladder.participants.length}
                              </TableCell>
                              <TableCell>{startDate}</TableCell>
                              {isSuperUser && (
                                <TableCell>
                                  {isActive && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleArchiveLadder(
                                          ladder.id,
                                          ladder.name
                                        )
                                      }
                                      disabled={archiveLadder.isPending}
                                    >
                                      <Archive className="mr-2 h-4 w-4" />
                                      Arkivera
                                    </Button>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {isSuperUser && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Skapa Ny Stege</h3>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ladder-name">Namn *</Label>
                      <Input
                        id="ladder-name"
                        value={ladderForm.name}
                        onChange={(e) =>
                          setLadderForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="t.ex. Stegen 2026"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="ladder-year">År *</Label>
                        <Input
                          id="ladder-year"
                          type="number"
                          value={ladderForm.year}
                          onChange={(e) =>
                            setLadderForm((prev) => ({
                              ...prev,
                              year: parseInt(e.target.value, 10),
                            }))
                          }
                          placeholder="2026"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ladder-season">Säsong (valfritt)</Label>
                        <Input
                          id="ladder-season"
                          value={ladderForm.season}
                          onChange={(e) =>
                            setLadderForm((prev) => ({
                              ...prev,
                              season: e.target.value,
                            }))
                          }
                          placeholder="t.ex. vår, höst"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ladder-startDate">Startdatum *</Label>
                      <Input
                        id="ladder-startDate"
                        type="date"
                        value={ladderForm.startDate}
                        onChange={(e) =>
                          setLadderForm((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <Button
                      onClick={handleCreateLadder}
                      disabled={createLadder.isPending}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Skapa Stege
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
