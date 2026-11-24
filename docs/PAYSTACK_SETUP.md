# Paystack setup

Create test or live API keys in the Paystack dashboard and set `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` and (where configured) `PAYSTACK_WEBHOOK_SECRET` in the server environment. Never prefix secret variables with `NEXT_PUBLIC_`.

Configure the webhook URL as `https://YOUR_DOMAIN/api/webhooks/paystack`. The application reads the raw request body and validates `X-Paystack-Signature` with HMAC-SHA512 before verifying the transaction through Paystack.

Official sources:

- [Initialize a transaction](https://paystack.com/docs/api/transaction/#initialize)
- [Verify a transaction](https://paystack.com/docs/v2/payments/online/verify-payments)
- [Paystack webhooks](https://paystack.com/docs/payments/webhooks/)
