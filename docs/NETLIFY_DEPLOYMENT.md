# Netlify deployment

BUYOL is a Next.js App Router application. Netlify should build it from the repository root with:

- Build command: `npm run build`
- Publish directory: `.next`
- Node version: `24.12.0`

The checked-in `netlify.toml` contains these settings. Netlify supports the App Router, server-rendered routes and API routes through its Next.js runtime.

## Connect the repository

In Netlify:

1. Select **Add new project** → **Import an existing project**.
2. Choose GitHub and select `Ukwun/buyol`.
3. Keep the repository base directory at the root.
4. Confirm the build command and publish directory from `netlify.toml`.
5. Enable deploy previews if desired.
6. Add the environment variables below in Netlify project settings before production use.

## Required environment variables

Public Firebase configuration:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Trusted server configuration:

```text
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
FIREBASE_ADMIN_STORAGE_BUCKET
```

Payment variables are optional until payment providers are configured:

```text
PAYSTACK_SECRET_KEY
PAYSTACK_PUBLIC_KEY
PAYSTACK_WEBHOOK_SECRET
FLUTTERWAVE_SECRET_KEY
FLUTTERWAVE_PUBLIC_KEY
FLUTTERWAVE_SECRET_HASH
```

Also set:

```text
NEXT_PUBLIC_APP_URL=https://your-production-domain.example
```

Do not commit `.env`, `.env.local`, service-account JSON files, private keys or payment secrets. Netlify environment variables should be scoped separately for production, deploy previews and local development.

## Continuous deployment

After the GitHub repository is connected, pushes to the configured production branch trigger a new Netlify build automatically. Pull requests can create deploy previews when deploy previews are enabled.

Netlify does not replace Firebase configuration or Firebase Security Rules. Configure Firebase Authentication authorized domains, Firestore/Storage rules, payment webhooks and any required Firebase project settings separately.
