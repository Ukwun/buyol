# Shipping architecture

Shipping is configured per vendor in `vendorShippingConfigs/{vendorId}`. A configuration contains explicitly enabled methods and integer-minor-unit prices. Checkout rejects a vendor with no configured method; it does not invent free or carrier pricing.

The configuration shape is intentionally provider-neutral so a future carrier adapter can supply rates and delivery estimates. No carrier API is active in Stage 8.
