# Booking Data Structure

## Standard Format (Going Forward)

All new bookings should use the following structure in Firestore:

```typescript
{
  userId: string,           // Firebase Auth UID
  startDate: Timestamp,    // Firestore Timestamp for start date/time
  endDate: Timestamp,      // Firestore Timestamp for end date/time
  createdAt: Timestamp      // Firestore Timestamp for when booking was created
}
```

## Field Names

- **startDate** / **endDate**: Use these field names (not `startTime`/`endTime` or `startAt`/`endAt`)
- **userId**: Always required, string type
- **createdAt**: Automatically set on creation

## TypeScript Interface

```typescript
export interface Booking {
  id: string;
  userId: string;
  startDate: string; // ISO datetime string
  endDate: string; // ISO datetime string
  createdAt: string; // ISO datetime string
}
```

## Migration Notes

- Legacy bookings may use `startTime`/`endTime` fields
- The API layer handles both formats for backward compatibility
- New bookings should always use `startDate`/`endDate`

## Firestore Indexes Required

For efficient querying, create these indexes:

1. **Collection**: `bookings`
   - **Fields**: `startDate` (Descending)
   - **Purpose**: List all bookings sorted by date

2. **Collection**: `bookings`
   - **Fields**: `startDate` (Ascending)
   - **Purpose**: Query bookings by date range
