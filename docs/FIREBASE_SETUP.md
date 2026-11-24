# Firebase setup for BUYOL

This document covers the Stage 4A Firebase infrastructure only. Authentication flows, Firestore data models, Security Rules, Storage Rules, and Cloud Functions are intentionally not implemented yet.

## 1. Create a Firebase project

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Create a project for BUYOL.
3. Keep development and production projects separate.
4. Enable billing when required by the Firebase services you plan to use.

## 2. Register the BUYOL web application

1. Open Project settings.
2. Add a Web app to the Firebase project.
3. Copy the generated configuration values into a local `.env.local` file.
4. Use the variable names from `.env.example`:

```text
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

The `NEXT_PUBLIC_` values are browser configuration, not Admin SDK secrets. Firebase Security Rules and server-side authorization must protect data and operations.

## 3. Enable Authentication

From Firebase Console:

1. Open Build > Authentication.
2. Select Get started.
3. Enable only the sign-in providers BUYOL has approved.

Authentication UI and account workflows are intentionally deferred to a later stage.

## 4. Create Firestore

1. Open Build > Firestore Database.
2. Create the database in the required region.
3. Choose the region carefully because it affects latency and cannot be changed casually later.
4. Do not use permissive production rules.

Firestore collections and security rules will be introduced in a later stage. No application data model is defined by Stage 4A.

## 5. Enable Storage

1. Open Build > Storage.
2. Create the default bucket in the intended region.
3. Record the bucket name for `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` and, when needed, `FIREBASE_ADMIN_STORAGE_BUCKET`.
4. Do not deploy permissive Storage Rules.

Storage upload flows and rules are deferred.

## 6. Local environment configuration

Copy the template and fill in only the local file:

```powershell
Copy-Item .env.example .env.local
```

`.env.local` is ignored by Git. Never commit it or paste its contents into source files, issues, logs, or pull requests.

The application can run lint and build without these values because Firebase initialization is lazy. A Firebase operation will produce a clear configuration error until the required environment is present.

## 7. Admin SDK authentication

The Admin SDK is available only through `src/lib/firebase/admin.ts`. It is not imported by the browser client module.

### Deployed environments

Use Application Default Credentials where the hosting environment supports them. Configure the hosting platform's service identity with only the permissions BUYOL requires. Do not upload service-account JSON files to the repository.

### Local development with Application Default Credentials

Install and authenticate the Google Cloud CLI, then set an untracked credential path:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\secure\buyol-service-account.json"
```

The file must remain outside the repository or match the ignored service-account patterns.

### Local development with environment credentials

Alternatively set all of these values in `.env.local`:

```text
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_STORAGE_BUCKET=
```

The private key usually contains escaped newlines. The Admin module converts `\\n` into real newlines before creating the credential.

Do not configure both partial environment credentials and Application Default Credentials. If any Admin credential variable is provided, all three required credential variables must be provided.

## 8. Module boundaries

Use the modules deliberately:

```text
src/lib/firebase/config.ts  # Validated public browser configuration
src/lib/firebase/client.ts  # Firebase Client SDK; browser-safe only
src/lib/firebase/admin.ts   # Firebase Admin SDK; trusted server only
```

Client Components may import `client.ts` when browser Firebase operations are required. Server Actions, Route Handlers, and future Cloud Functions may import `admin.ts`. Never import `admin.ts` into a Client Component or any module reachable from browser code.

## 9. Security precautions

- Firebase browser configuration is not a substitute for Security Rules.
- Admin credentials must never use `NEXT_PUBLIC_` variables.
- Never commit `.env.local`, service-account JSON, private keys, or credential dumps.
- Do not use the Admin SDK to bypass authorization checks in application code.
- Keep Firestore and Storage rules restrictive when they are added.
- Use separate Firebase projects for development, staging, and production.
- Rotate credentials immediately if they are exposed.
- Grant service identities the minimum required IAM permissions.
