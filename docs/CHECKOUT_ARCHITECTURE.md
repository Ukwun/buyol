# Checkout architecture

Checkout quotes are created by trusted server code from the current cart, catalogue, inventory, configured shipping methods and configured tax rules. Quotes expire after ten minutes and include immutable item, address, shipping, tax and price snapshots.

Checkout submission uses a customer-scoped idempotency key. The server creates one parent order and one vendor order per vendor. Orders remain `pending_payment`; Stage 9 owns payment initialization and confirmation.

The transaction is bounded to 50 cart items. Larger carts are rejected because Firestore transaction limits must not be hidden behind a false atomicity claim.

Mixed-currency carts are rejected until a trusted exchange-rate policy is configured. No payment operation is performed in Stage 8.
