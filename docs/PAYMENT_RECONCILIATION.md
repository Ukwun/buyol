# Payment reconciliation

The `reconciliationExceptions` collection records amount/currency/reference mismatches and verified payments received after inventory reservations were released. These records are admin-readable and client-immutable.

A scheduled trusted job should call the server-only `reconcilePendingPayments` entry point. It queries old attempts, verifies them with the relevant provider adapter, applies the same guarded state transition used by webhooks, expires stale attempts and invokes the idempotent reservation release service. The scheduled job is not deployed in this stage. Manual review is required for late payments and unresolved mismatches; no automatic refund or vendor payout is performed.
