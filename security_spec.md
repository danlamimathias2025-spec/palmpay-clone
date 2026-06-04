# Security Specification

## Data Invariants
1. A transaction cannot exist without a valid user ID.
2. A user can only read and write their own profile document.
3. A user can only read and write their own sub-collection of transactions.

## The "Dirty Dozen" Payloads (Examples)
1. Write to another user's profile: `{ "uid": "victim_uid", "data": { "balance": 999999 } }` (Attempted by `attacker_uid`) -> EXPECT PERMISSION_DENIED
2. Write transaction to another user's sub-collection: `{ "path": "users/victim_uid/transactions/...", "data": { ... } }` -> EXPECT PERMISSION_DENIED
3. Read another user's PII: `get(/databases/$(database)/documents/users/not_my_uid)` -> EXPECT PERMISSION_DENIED

## Test Runner (firestore.rules.test.ts placeholder)
I will implement security rules that reject these based on `request.auth.uid`.
