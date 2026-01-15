import { BookingForm } from "@/components/booking/BookingForm";
import { BookingsList } from "@/components/booking/BookingsList";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUsersQuery } from "@/hooks/useUsers";

export const App = () => {
  const { data: users, isLoading, error } = useUsersQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
        <span className="sr-only">Laddar...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        <h3 className="font-semibold">Fel vid laddning av användare</h3>
        <p className="text-sm">
          {error instanceof Error ? error.message : "Ett fel uppstod"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Ny matchbokning</h2>
        <p className="text-muted-foreground">
          Boka match genom att välja start- och sluttider
        </p>
        <div className="mt-4">
          <BookingForm />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold">Alla bokningar</h2>
        <p className="text-muted-foreground">
          Visa alla matchbokningar från alla användare
        </p>
        <div className="mt-4">
          <BookingsList />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold">Användare</h2>
        <p className="text-muted-foreground">
          Hantera och visa alla registrerade användare
        </p>
        <div className="mt-4">
          {!users || users.length === 0 ? (
            <div className="rounded-lg border border-muted bg-muted/50 p-8 text-center">
              <p className="text-muted-foreground">Inga användare hittades</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>UID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">
                        {user.email}
                      </TableCell>
                      <TableCell>{user.displayName || "-"}</TableCell>
                      <TableCell>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {user.uid}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
