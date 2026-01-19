# Booking Data Structure

## Standard Format (Going Forward)

All new bookings should use the following structure in Firestore:

```typescript
{
  userId: string,           // Firebase Auth UID
  startDate: Timestamp,    // Firestore Timestamp for start date/time
  endDate: Timestamp,      // Firestore Timestamp for end date/time
  createdAt: Timestamp,     // Firestore Timestamp for when booking was created
  playerAId?: string,       // Optional ladder match: challenger UID
  playerBId?: string,       // Optional ladder match: opponent UID
  ladderStatus?: "planned" | "completed", // Optional ladder match status
  winnerId?: string,        // Optional ladder match winner UID
  comment?: string          // Optional ladder match comment
}
```

## Field Names

- **startDate** / **endDate**: Use these field names (not `startTime`/`endTime` or `startAt`/`endAt`)
- **userId**: Always required, string type
- **createdAt**: Automatically set on creation
- **playerAId** / **playerBId**: Optional for ladder matches
- **ladderStatus**, **winnerId**, **comment**: Optional ladder match metadata

## TypeScript Interface

```typescript
export interface Booking {
  id: string;
  userId: string;
  startDate: string; // ISO datetime string
  endDate: string; // ISO datetime string
  createdAt: string; // ISO datetime string
  playerAId?: string;
  playerBId?: string;
  ladderStatus?: "planned" | "completed";
  winnerId?: string;
  comment?: string;
}
```

## Migration Notes

- Legacy bookings may use `startTime`/`endTime` fields
- The API layer handles both formats for backward compatibility
- New bookings should always use `startDate`/`endDate`

## Firestore Indexes

Firestore automatically creates single-field indexes, so no composite indexes are currently required for the bookings collection.

**Automatic Indexes:**
- `startDate` (Ascending/Descending) - automatically available
- All other single fields - automatically indexed

**Composite Indexes:**
- None required at this time

**Note:** A legacy composite index (`status` + `startTime`) exists in the deployed project but is no longer used. It can be safely deleted via the Firebase Console if desired.
