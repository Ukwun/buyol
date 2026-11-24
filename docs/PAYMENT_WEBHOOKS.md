# Payment webhooks

`/api/webhooks/paystack` and `/api/webhooks/flutterwave` consume raw request bodies. Invalid signatures are rejected before JSON processing. Events receive deterministic provider-scoped document IDs, so duplicate deliveries are safe. A normalized event is persisted without raw payloads, authorization headers or secrets.

Webhook authenticity is not payment confirmation. The service calls the provider verification endpoint, then checks the internal reference, immutable order amount and currency before changing order state.
