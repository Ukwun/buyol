# Tax architecture

Tax rules are explicitly configured in `taxRules/{countryCode}`. Checkout rejects destinations without a rule. Rules provide a basis-point rate and policy metadata; calculations use integer money arithmetic and preserve the rule snapshot on the quote/order.

This foundation is not a legal or tax-compliance determination. Country-specific requirements must be reviewed before production use.
