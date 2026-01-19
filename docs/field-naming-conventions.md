# Field Naming Conventions

## Overview

This document defines the standard field naming conventions used across the HTK Tennis application, including Firestore collections, TypeScript interfaces, and API contracts.

## General Principles

1. **Use camelCase** for all field names (e.g., `displayName`, not `display_name`)
2. **Be consistent** - once a field name is chosen, use it everywhere
3. **Be descriptive** - prefer clarity over brevity
4. **Avoid abbreviations** unless widely understood (e.g., `id`, `uid`)

## Firestore Collections

### Users Collection (`users`)

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `uid` | string | Yes | Firebase Auth user ID (document ID) |
| `email` | string | Yes | User's email address |
| `displayName` | string | No | User's display name |
| `phone` | string | No | User's phone number |
| `ladderWins` | number | No | Number of ladder match wins |
| `ladderLosses` | number | No | Number of ladder match losses |
| `role` | string | No | User role: `"user"`, `"admin"`, or `"superuser"` |
| `createdAt` | Timestamp | No | Account creation timestamp |

### Bookings Collection (`bookings`)

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `userId` | string | Yes | ID of user who created the booking |
| `startDate` | Timestamp | Yes | Booking start date/time |
| `endDate` | Timestamp | Yes | Booking end date/time |
| `createdAt` | Timestamp | Yes | Booking creation timestamp |
| `playerAId` | string | No | Ladder match: challenger player ID |
| `playerBId` | string | No | Ladder match: opponent player ID |
| `ladderStatus` | string | No | Ladder match status: `"planned"` or `"completed"` |
| `winnerId` | string | No | Ladder match: winner player ID |
| `comment` | string | No | Ladder match: optional comment |

### App Settings Collection (`appSettings`)

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `bookingsEnabled` | boolean | Yes | Whether bookings are enabled globally |

### Announcements Collection (`announcements`)

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `title` | string | Yes | Announcement title |
| `body` | string | Yes | Announcement body text |
| `enabled` | boolean | Yes | Whether announcement is visible |
| `links` | array | No | Array of `{label: string, url: string}` objects |

## Legacy Field Names

For backward compatibility, the application handles these legacy field names when reading from Firestore:

### Bookings Collection (Legacy)

| Legacy Name | Current Name | Status |
|-------------|--------------|--------|
| `startTime` | `startDate` | Deprecated - read only |
| `endTime` | `endDate` | Deprecated - read only |
| `startAt` | `startDate` | Deprecated - read only |
| `endAt` | `endDate` | Deprecated - read only |
| `created_at` | `createdAt` | Deprecated - read only |

**Implementation:** The `normalizeBookingFromFirestore()` function in [`src/lib/api.ts`](../src/lib/api.ts) handles mapping legacy field names to current names.

**New Data:** All new bookings use the current field names (`startDate`, `endDate`, `createdAt`).

## TypeScript Interfaces

All TypeScript interfaces mirror the Firestore field names exactly, using camelCase consistently.

**Example:**

```typescript
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  ladderWins?: number;
  ladderLosses?: number;
  role?: "user" | "admin" | "superuser";
  createdAt?: string; // ISO 8601 string in TypeScript
}
```

## API Contracts

When exchanging data with clients, use the same camelCase field names as defined in the TypeScript interfaces.

**Response Format:**

```json
{
  "uid": "abc123",
  "email": "user@example.com",
  "displayName": "John Doe",
  "ladderWins": 5,
  "ladderLosses": 3
}
```

## Migration Strategy

When adding new fields or deprecating old ones:

1. **Add new field** with proper camelCase naming
2. **Update TypeScript interfaces** to include the new field
3. **Update API layer** to read both old and new fields (if applicable)
4. **Update writes** to use only the new field name
5. **Document legacy field** in this file
6. **Do not delete** old field names from existing documents (allows rollback)

## Related Documentation

- [Booking Data Structure](booking-data-structure.md) - Detailed booking field specifications
- [Ladder Stats Feature](ladderstats-feature.md) - Ladder statistics implementation
