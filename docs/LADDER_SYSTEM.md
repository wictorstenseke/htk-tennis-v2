# Opt-in Ladder System Documentation

## Overview

The opt-in ladder system allows users to voluntarily join year-based ladder tournaments. Only participants who have explicitly joined a ladder can challenge other players and compete in ladder matches.

## Key Features

### 1. Year-Based Ladders
- Each ladder represents a season (e.g., "Stegen 2026")
- Only one ladder can be active at a time
- Historical ladders are archived for record-keeping

### 2. Opt-in Participation
- Users must explicitly join a ladder to participate
- Non-participants can view the ladder but cannot challenge players
- Clear visual indicators show participation status

### 3. Filtered Rankings
- Only ladder participants appear in the rankings
- Statistics are tracked per participant
- Clean separation between participants and non-participants

### 4. Ladder-Specific Matches
- Each match booking is linked to a specific ladder
- Historical data is preserved when ladders are archived

## Data Model

### Ladder Interface
```typescript
interface Ladder {
  id: string;              // Unique identifier
  name: string;            // e.g., "Stegen 2026"
  year: number;            // 2026
  season?: string;         // optional: "vår", "höst", etc.
  startDate: string;       // ISO timestamp
  endDate?: string;        // ISO timestamp when archived
  status: "active" | "archived";
  participants: string[];  // Array of user UIDs
  createdAt: string;       // ISO timestamp
}
```

### Updated Booking Interface
```typescript
interface Booking {
  // ... existing fields
  ladderId?: string;  // Links booking to specific ladder
}
```

## API Functions

### Ladders API (`src/lib/api.ts`)

```typescript
// Get all ladders
laddersApi.getLadders(): Promise<Ladder[]>

// Get active ladder
laddersApi.getActiveLadder(): Promise<Ladder | null>

// Get specific ladder
laddersApi.getLadder(ladderId: string): Promise<Ladder>

// Join ladder (user self-service)
laddersApi.joinLadder(ladderId: string, userId: string): Promise<void>

// Leave ladder (optional, not exposed in UI yet)
laddersApi.leaveLadder(ladderId: string, userId: string): Promise<void>

// Create ladder (admin only)
laddersApi.createLadder(ladder: Omit<Ladder, 'id' | 'createdAt'>): Promise<Ladder>

// Archive ladder (admin only)
laddersApi.archiveLadder(ladderId: string): Promise<void>
```

## React Hooks

### Ladder Hooks (`src/hooks/useLadders.ts`)

```typescript
// Fetch all ladders
const { data: ladders } = useLaddersQuery();

// Fetch active ladder
const { data: activeLadder } = useActiveLadderQuery();

// Fetch specific ladder
const { data: ladder } = useLadderQuery(ladderId);

// Join ladder mutation
const joinMutation = useJoinLadderMutation();
joinMutation.mutate({ ladderId, userId });

// Leave ladder mutation
const leaveMutation = useLeaveLadderMutation();
leaveMutation.mutate({ ladderId, userId });

// Create ladder mutation (admin)
const createMutation = useCreateLadderMutation();
createMutation.mutate(ladderData);

// Archive ladder mutation (admin)
const archiveMutation = useArchiveLadderMutation();
archiveMutation.mutate(ladderId);
```

### Updated Ladder Matches Hook

```typescript
// Fetch matches for specific ladder
const { data: matches } = useLadderMatchesQuery(ladderId);
```

## UI Components

### Stegen Page Updates

The Stegen page (`src/pages/Stegen.tsx`) now includes:

#### For Non-Participants
- Read-only view of the ladder
- Badge showing "Du är inte med i stegen"
- Prominent "Join Ladder" card with explanation
- Challenge functionality disabled

#### For Participants
- Full interactive ladder view
- Badge showing current placement
- Challenge functionality enabled
- Booking form includes `ladderId` in metadata

#### Ladder Header
- Displays ladder name (e.g., "Stegen 2026")
- Shows participant count
- Shows total players in system
- User's placement badge (if participant)

## Security Rules

### Ladder Collection Rules

```javascript
match /ladders/{ladderId} {
  // All authenticated users can read ladders
  allow read: if isAuthenticated();

  // Only admins can create or delete ladders
  allow create, delete: if isAdminOrSuperUser();

  // Users can add themselves as participants
  allow update: if isAuthenticated() && (
    request.resource.data.participants.hasAll(resource.data.participants)
    && request.resource.data.participants.removeAll(resource.data.participants).hasOnly([request.auth.uid])
  );

  // Admins can update anything
  allow update: if isAdminOrSuperUser();
}
```

### Bookings Rules Update

```javascript
// ladderId field validation added
allow create: if isAuthenticated()
  && (!('ladderId' in request.resource.data) || request.resource.data.ladderId is string);
```

## Setup & Initialization

### 1. Create Initial Ladder

You can create a ladder through:

#### Option A: Firebase Console
1. Go to Firestore Database
2. Create a new document in the `ladders` collection
3. Add the following fields:
   ```
   name: "Stegen 2026"
   year: 2026
   startDate: <timestamp for 2026-01-01>
   status: "active"
   participants: []
   createdAt: <current timestamp>
   ```

#### Option B: Using the Init Script
```bash
# Set up your Firebase Admin SDK
# Then run:
node scripts/init-test-ladder.js
```

#### Option C: Via Admin Interface (Future Enhancement)
Admin page with ladder management UI (not yet implemented)

### 2. Test the Flow

1. **View as Non-Participant**:
   - Navigate to Stegen page
   - Verify you see "Du är inte med i stegen" badge
   - Verify "Join Ladder" card is displayed
   - Verify challenge functionality is disabled

2. **Join Ladder**:
   - Click "Gå med i stegen" button
   - Verify success toast appears
   - Verify UI updates to participant view

3. **Challenge as Participant**:
   - Click on a player to challenge them
   - Verify booking form opens
   - Create a booking
   - Verify booking includes `ladderId` field

4. **Verify Match Filtering**:
   - Matches should only show for the active ladder
   - Non-ladder bookings should not appear

## Migration Strategy

### For Existing Data

1. **Create "Stegen 2025" Ladder**:
   ```typescript
   {
     name: "Stegen 2025",
     year: 2025,
     startDate: "2025-01-01T00:00:00Z",
     endDate: "2025-12-31T23:59:59Z",
     status: "archived",
     participants: [], // Or import existing users
     createdAt: <timestamp>
   }
   ```

2. **Create "Stegen 2026" Ladder**:
   ```typescript
   {
     name: "Stegen 2026",
     year: 2026,
     startDate: "2026-01-01T00:00:00Z",
     status: "active",
     participants: [],
     createdAt: <timestamp>
   }
   ```

3. **Decision: Auto-enroll vs Manual Join**:
   - **Manual Join (Recommended)**: Let users opt-in themselves
   - **Auto-enroll**: Add all current users to participants array

### Backward Compatibility

- Existing bookings without `ladderId` continue to work
- They won't appear in ladder-filtered views
- They remain visible in the main bookings page

## Future Enhancements

### Phase 2 Features

1. **Admin Interface**:
   - Create new ladders
   - Archive current ladder
   - View archived ladders
   - Manage participants
   - Export statistics

2. **Leave Ladder Functionality**:
   - Add UI button for leaving ladder
   - Consider rules (e.g., can't leave mid-season)
   - Handle match obligations

3. **Season Statistics**:
   - Track stats per ladder season
   - Show historical performance
   - Compare seasons

4. **Multiple Active Ladders**:
   - Support multiple concurrent ladders
   - Different formats (singles, doubles)
   - Different skill levels

5. **Notifications**:
   - Notify when new ladder starts
   - Remind users to join
   - Season end notifications

## Testing

### Test Coverage

41 tests passing, including:
- 8 tests for ladder participant filtering
- 6 tests for ladder logic
- All existing tests continue to pass

### Manual Testing Checklist

- [ ] View ladder as non-authenticated user (should redirect to login)
- [ ] View ladder as non-participant
- [ ] Join ladder
- [ ] Challenge player as participant
- [ ] Verify match booking includes ladderId
- [ ] Verify only ladder matches shown for active ladder
- [ ] Verify security rules work correctly
- [ ] Test with multiple users
- [ ] Test ladder archiving (via admin)
- [ ] Test creating new ladder (via admin)

## Troubleshooting

### No Active Ladder Displayed
- Check Firestore: Ensure at least one ladder has `status: "active"`
- Check console for API errors
- Verify Firebase configuration

### Can't Join Ladder
- Verify user is authenticated
- Check Firestore security rules are deployed
- Check browser console for errors

### Matches Not Showing
- Verify match has `ladderId` field matching active ladder
- Check that match participants are in ladder
- Verify query filters in browser console

### Security Rule Errors
- Ensure rules are deployed: `firebase deploy --only firestore:rules`
- Verify user has authentication token
- Check that rule conditions are met

## Developer Notes

### Code Locations

- **Types**: `src/types/api.ts`
- **API Layer**: `src/lib/api.ts` (laddersApi)
- **Hooks**: `src/hooks/useLadders.ts`
- **Ladder Logic**: `src/lib/ladder.ts` (buildLadderPlayers updated)
- **Match Filtering**: `src/hooks/useLadderMatches.ts`
- **UI**: `src/pages/Stegen.tsx`
- **Security Rules**: `firestore.rules`
- **Tests**: `src/lib/ladder-filters.test.ts`

### Key Design Decisions

1. **Opt-in by Default**: Users must explicitly join
2. **Single Active Ladder**: Simplifies UI and UX
3. **Self-service Join**: Users can join without admin approval
4. **Backward Compatible**: Existing code continues to work
5. **Filtered Views**: Participants-only in ladder rankings

## Support

For issues or questions, contact the development team or open an issue in the repository.
