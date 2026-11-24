# Inventory reservations

Order creation reserves stock transactionally by increasing `reserved`; it does not reduce `onHand`. Availability remains `onHand - reserved`. Reservation IDs are deterministic from order and SKU, and duplicate checkout submissions resolve through the idempotency record.

`releaseExpiredReservations()` is the trusted scheduled-job entry point. Deploy a Firebase Functions Gen 2 scheduler or equivalent trusted scheduler to invoke this function periodically. Firestore TTL must not be used as the release mechanism. Payment confirmation, cancellation and expiry must all use the same idempotent state-transition pattern in later stages.
