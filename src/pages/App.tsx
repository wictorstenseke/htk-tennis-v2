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
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        <h3 className="font-semibold">Error loading users</h3>
        <p className="text-sm">
          {error instanceof Error ? error.message : "An error occurred"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">New Booking</h2>
        <p className="text-muted-foreground">
          Create a new booking by selecting start and end times
        </p>
        <div className="mt-4">
          <BookingForm />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold">All Bookings</h2>
        <p className="text-muted-foreground">
          View all bookings from all users
        </p>
        <div className="mt-4">
          <BookingsList />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold">Users</h2>
        <p className="text-muted-foreground">
          Manage and view all registered users
        </p>
        <div className="mt-4">
          {!users || users.length === 0 ? (
            <div className="rounded-lg border border-muted bg-muted/50 p-8 text-center">
              <p className="text-muted-foreground">No users found</p>
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
