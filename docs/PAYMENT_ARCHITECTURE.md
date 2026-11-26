# BUYLO payment architecture

The parent order is the customer payment aggregation unit. Each payment attempt is an immutable attempt history record under `payments`; retrying creates another attempt rather than overwriting a failed one. The browser supplies only an order ID, provider choice and idempotency key. The server reads the immutable order total and customer email.

Provider adapters are server-only. They initialize and verify transactions, validate provider-specific webhook signatures, and return normalized results. Paystack uses the transaction reference and HMAC-SHA512 signature. Flutterwave uses its transaction ID for verification and the configured webhook secret hash. Provider payloads are not stored verbatim.

Verified success updates the payment, parent order, vendor-order payment summaries and active reservations in a Firestore transaction. A payment that arrives after reservations were released is recorded as a reconciliation exception and is not silently treated as fulfilment-ready. Failed payments preserve a valid retry window.

No vendor payout, commission settlement, refund execution or card data storage is included in this stage.
