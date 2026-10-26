# Security Specification & Threat Model

## Data Invariants
1. A female account document at `/female_users/{femaleUid}` is owned by the user whose `request.auth.uid == femaleUid`.
2. A female account can be created and updated by the authenticated female owner.
3. A male companion who possesses the verified secret code can read the linked female account and subcollections (`cycles`, `daily_logs`) to support her.
4. The male companion can update his name (`partnerName` on female_users and `maleName` on pair_codes) and set `partnerConnected: true`.
5. Secret codes must be unique and valid format `^[A-Z0-9_-]{4,16}$`.
6. No female user can modify another female user's cycle records or daily logs.
7. Timestamps and string fields are strictly constrained in size to prevent denial of wallet attacks.

## The Dirty Dozen Payloads
1. Unauthenticated user attempts to read `/female_users/random_uid` without a valid secret code -> PERMISSION_DENIED.
2. Authenticated user A attempts to overwrite `/female_users/userB` -> PERMISSION_DENIED.
3. Malicious user attempts to inject 100KB string payload into `customNote` -> PERMISSION_DENIED (capped at 2000 chars).
4. Malicious client attempts to delete the `/pair_codes` directory -> PERMISSION_DENIED.
5. User attempts to create a cycle record with invalid date format or without required fields -> PERMISSION_DENIED.
6. User attempts to spoof `femaleUid` to mismatch parent document ID -> PERMISSION_DENIED.
7. Unauthenticated user attempts to write to `/female_users/{uid}/daily_logs/{date}` -> PERMISSION_DENIED.
8. Authenticated user attempts to modify someone else's daily log -> PERMISSION_DENIED.
9. Attacker attempts to list all female accounts across the database -> PERMISSION_DENIED.
10. Attacker attempts to brute-force list all secret codes -> PERMISSION_DENIED (only single document `get` by exact code is allowed).
11. Attacker attempts to claim an already connected pairing code for a second user -> REJECTED.
12. Attacker attempts to pass non-string IDs to collection paths -> PERMISSION_DENIED.
