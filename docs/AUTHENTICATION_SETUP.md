# BUYOL authentication setup

Stage 4D implements Firebase email/password authentication and server-side Firebase session cookies. It does not implement vendor onboarding, checkout, payments, or Google sign-in.

## Firebase Console configuration

In the Firebase Console for the intended project:

1. Open Authentication.
2. Enable the Email/Password provider.
3. Configure authorized domains for deployed environments.
4. Configure the email template and sender settings for verification and password reset emails.
5. Keep administrator custom claims managed only by trusted Admin SDK tooling.

No Google provider is enabled by this stage.

## Environment variables

Public browser configuration:

```text
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Trusted server configuration:

```text
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_STORAGE_BUCKET=
GOOGLE_APPLICATION_CREDENTIALS=
```

Local Auth Emulator configuration:

```text
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
```

The emulator values should be used only for local development. Do not set them in production.

## Authentication flow

1. The browser uses Firebase Client SDK email/password methods.
2. Registration sends a verification email and synchronizes the identity through `/api/auth/sync-user`.
3. Unverified users are not issued an application session.
4. A verified sign-in obtains a Firebase ID token.
5. The browser sends that token to `/api/auth/session`.
6. The server verifies the token with Firebase Admin SDK and creates an HttpOnly session cookie.
7. The browser signs out of the Client SDK after the session cookie is created.
8. Server-rendered protected layouts verify and revoke-check the session cookie.

The session cookie is:

- HttpOnly
- `SameSite=Lax`
- Secure in production
- Scoped to `/`
- Limited to five days

## Protected areas

- `/account` requires an active authenticated user document.
- `/vendor` requires at least one active vendor membership.
- `/admin` requires the trusted `admin` custom claim.
- Suspended and deleted user documents are rejected.

Client navigation is not used as authorization. Protected layouts perform server-side checks before rendering private content.

## Local development

The Firebase Auth Emulator is configured at `127.0.0.1:9099` in `firebase.json`. Start it with the existing emulator command when Java 21+ is available:

```powershell
npm run emulators
```

The current repository’s Firebase CLI requires JDK 21 or newer for emulator execution.

## Security notes

- Never log passwords, ID tokens, or session cookies.
- Never place session cookies or Admin credentials in browser storage.
- Session-changing routes validate same-origin requests.
- Password reset responses are intentionally generic to reduce account enumeration.
- User registration never assigns admin claims or vendor memberships.
- Vendor memberships and administrator claims must be created through trusted server-side processes.
