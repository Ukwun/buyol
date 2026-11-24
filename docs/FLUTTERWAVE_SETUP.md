# Flutterwave setup

Set `FLUTTERWAVE_SECRET_KEY`, optional `FLUTTERWAVE_PUBLIC_KEY`, and the webhook secret hash configured for the account in `FLUTTERWAVE_SECRET_HASH`. Keep all secret values server-side.

Configure `https://YOUR_DOMAIN/api/webhooks/flutterwave`. The webhook is authenticated with the configured `verif-hash` value and every successful event is verified server-side using the transaction ID. No Flutterwave account or sandbox transaction is assumed by this repository.

Official sources:

- [Flutterwave Standard checkout](https://developer.flutterwave.com/docs/collections-inflow/flutterwave-standard)
- [Transaction verification](https://developer.flutterwave.com/docs/transaction-verification)
- [Webhooks](https://developer.flutterwave.com/docs/webhooks)
