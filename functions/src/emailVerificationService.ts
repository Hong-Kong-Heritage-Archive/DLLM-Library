import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { db, LoginUser, sendEmailWithOptions } from "./platform";

const userCollection = db.collection("users");

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

type EmailVerificationState = {
  requestId: string;
  codeHash: string;
  salt: string;
  expiresAt: Timestamp;
  attempts: number;
  lastSentAt: Timestamp;
};

function hashCode(code: string, salt: string): Buffer {
  return scryptSync(code, salt, 32);
}

export class EmailVerificationService {
  async requestCode(loginUser: LoginUser | null): Promise<boolean> {
    if (!loginUser) throw new Error("Not authenticated");
    if (!loginUser.email) throw new Error("Authenticated account has no email");

    const userRef = userCollection.doc(loginUser.uid);
    const code = randomInt(0, 10 ** OTP_LENGTH)
      .toString()
      .padStart(OTP_LENGTH, "0");
    const salt = randomBytes(16).toString("hex");
    const requestId = randomBytes(16).toString("hex");
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(Date.now() + OTP_TTL_MS);
    const codeHash = hashCode(code, salt).toString("hex");

    const shouldSend = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error("User profile not found");
      }

      const userData = userDoc.data() as {
        isVerified?: boolean;
        emailVerification?: EmailVerificationState;
      };

      if (userData.isVerified) return false;

      const previous = userData.emailVerification;
      if (
        previous?.lastSentAt &&
        Date.now() - previous.lastSentAt.toMillis() < OTP_RESEND_COOLDOWN_MS
      ) {
        throw new Error("Please wait before requesting another verification code");
      }

      transaction.update(userRef, {
        emailVerification: {
          requestId,
          codeHash,
          salt,
          expiresAt,
          attempts: 0,
          lastSentAt: now,
        },
      });

      return true;
    });

    if (!shouldSend) {
      // Firestore may already be verified from an earlier partial completion.
      // Ensure Firebase Auth is repaired as well before treating this as done.
      await getAuth().updateUser(loginUser.uid, { emailVerified: true });
      return true;
    }

    try {
      await sendEmailWithOptions({
        to: [loginUser.email],
        subject: "Your BookGuide verification code",
        text: `Your BookGuide verification code is ${code}.\n\nThis code expires in 10 minutes. If you did not request this code, you can ignore this email.`,
      });
    } catch (error) {
      // Only remove the state created by this failed delivery. A newer request
      // from another tab must never be deleted by an older failed request.
      await db.runTransaction(async (transaction) => {
        const latestDoc = await transaction.get(userRef);
        const latest = latestDoc.data() as
          | { emailVerification?: EmailVerificationState }
          | undefined;
        if (latest?.emailVerification?.requestId === requestId) {
          transaction.update(userRef, {
            emailVerification: FieldValue.delete(),
          });
        }
      });
      throw error;
    }

    return true;
  }

  async confirmCode(
    loginUser: LoginUser | null,
    code: string,
  ): Promise<boolean> {
    if (!loginUser) throw new Error("Not authenticated");
    if (!/^\d{6}$/.test(code)) {
      throw new Error("Verification code must be 6 digits");
    }

    const userRef = userCollection.doc(loginUser.uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error("User profile not found");

    const userData = userDoc.data() as {
      isVerified?: boolean;
      emailVerification?: EmailVerificationState;
    };

    if (userData.isVerified) {
      // Make completion idempotent. If a previous attempt updated Firestore
      // but failed before updating Firebase Auth, retry repairs Firebase.
      await getAuth().updateUser(loginUser.uid, { emailVerified: true });
      if (userData.emailVerification) {
        await userRef.update({ emailVerification: FieldValue.delete() });
      }
      return true;
    }

    const verification = userData.emailVerification;
    if (!verification) throw new Error("No verification code has been requested");

    if (verification.expiresAt.toMillis() < Date.now()) {
      await userRef.update({ emailVerification: FieldValue.delete() });
      throw new Error("Verification code has expired");
    }

    if ((verification.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      throw new Error("Too many verification attempts. Request a new code");
    }

    const suppliedHash = hashCode(code, verification.salt);
    const storedHash = Buffer.from(verification.codeHash, "hex");
    const isMatch =
      suppliedHash.length === storedHash.length &&
      timingSafeEqual(suppliedHash, storedHash);

    if (!isMatch) {
      await userRef.update({
        "emailVerification.attempts": FieldValue.increment(1),
      });
      throw new Error("Invalid verification code");
    }

    // Update Firebase first. If the following Firestore write fails, the
    // existing me() compatibility sync can safely promote Firestore on retry.
    // If Firebase fails, the OTP remains available so the user can retry.
    await getAuth().updateUser(loginUser.uid, { emailVerified: true });

    await userRef.update({
      isVerified: true,
      emailVerification: FieldValue.delete(),
    });

    return true;
  }

  async assertVerified(loginUser: LoginUser | null): Promise<void> {
    if (!loginUser) throw new Error("Not authenticated");

    const userDoc = await userCollection.doc(loginUser.uid).get();
    if (!userDoc.exists) throw new Error("User profile not found");

    if (userDoc.data()?.isVerified !== true) {
      throw new Error(
        "Email verification required before starting or completing a transaction",
      );
    }
  }
}
