import { Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { syncUserRequestSchema } from "@/features/auth/schemas";
import { userSchema } from "@/features/schemas";
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { assertSameOrigin } from "@/lib/security/csrf";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = syncUserRequestSchema.parse(await request.json());
    const decoded = await getFirebaseAdminAuth().verifyIdToken(body.idToken, true);

    if (!decoded.email) {
      return NextResponse.json({ error: "An email account is required." }, { status: 400 });
    }

    const userReference = getFirebaseAdminFirestore().collection("users").doc(decoded.uid);
    await getFirebaseAdminFirestore().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(userReference);
      const now = Timestamp.now();

      if (!snapshot.exists) {
        const user = userSchema.parse({
          id: decoded.uid,
          email: decoded.email,
          displayName: body.displayName ?? decoded.name,
          phoneNumber: body.phoneNumber,
          countryCode: body.countryCode,
          defaultCurrency: body.defaultCurrency,
          status: "active",
          createdAt: now,
          updatedAt: now,
        });
        transaction.create(userReference, user);
        return;
      }

      const existing = snapshot.data() as { status?: string; createdAt?: Timestamp };
      transaction.update(userReference, {
        email: decoded.email,
        ...(body.displayName ? { displayName: body.displayName } : {}),
        ...(body.phoneNumber ? { phoneNumber: body.phoneNumber } : {}),
        ...(body.countryCode ? { countryCode: body.countryCode } : {}),
        ...(body.defaultCurrency ? { defaultCurrency: body.defaultCurrency } : {}),
        status: existing.status ?? "active",
        updatedAt: now,
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to synchronize the user.";
    const status = message.includes("Cross-site") ? 403 : 400;
    return NextResponse.json({ error: status === 403 ? message : "Unable to synchronize the user." }, { status });
  }
}
