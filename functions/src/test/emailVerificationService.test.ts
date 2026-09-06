import * as platform from "../platform";
import * as authModule from "firebase-admin/auth";
import { EmailVerificationService } from "../emailVerificationService";

jest.mock("firebase-admin/firestore", () => {
  class MockTimestamp {
    constructor(private readonly milliseconds: number) {}

    static now() {
      return new MockTimestamp(Date.now());
    }

    static fromMillis(milliseconds: number) {
      return new MockTimestamp(milliseconds);
    }

    toMillis() {
      return this.milliseconds;
    }
  }

  return {
    Timestamp: MockTimestamp,
    FieldValue: {
      delete: () => ({ __operation: "delete" }),
      increment: (amount: number) => ({ __operation: "increment", amount }),
    },
  };
});

jest.mock("firebase-admin/auth", () => {
  const updateUser = jest.fn();
  return {
    getAuth: jest.fn(() => ({ updateUser })),
    __mockUpdateUser: updateUser,
  };
});

jest.mock("../platform", () => {
  const applyUpdate = (target: Record<string, any>, patch: Record<string, any>) => {
    for (const [path, value] of Object.entries(patch)) {
      const parts = path.split(".");
      let cursor = target;

      for (let index = 0; index < parts.length - 1; index += 1) {
        const part = parts[index];
        cursor[part] = cursor[part] || {};
        cursor = cursor[part];
      }

      const key = parts[parts.length - 1];
      if (value?.__operation === "delete") {
        delete cursor[key];
      } else if (value?.__operation === "increment") {
        cursor[key] = (cursor[key] || 0) + value.amount;
      } else {
        cursor[key] = value;
      }
    }
  };

  const doc = (id: string) => ({
    id,
    get: async () => {
      const data = (globalThis as any).__emailVerificationUsers.get(id);
      return {
        exists: Boolean(data),
        data: () => data,
      };
    },
    update: async (patch: Record<string, any>) => {
      const data = (globalThis as any).__emailVerificationUsers.get(id);
      if (!data) throw new Error("Missing test user");
      applyUpdate(data, patch);
    },
  });

  const userCollection = { doc };
  const db = {
    collection: jest.fn(() => userCollection),
    runTransaction: jest.fn(async (callback: (transaction: any) => any) =>
      callback({
        get: (ref: any) => ref.get(),
        update: (ref: any, patch: Record<string, any>) => ref.update(patch),
      }),
    ),
  };

  return {
    db,
    sendEmailWithOptions: jest.fn(),
  };
});

type TestUser = {
  isVerified: boolean;
  emailVerification?: any;
};

const loginUser = {
  uid: "user-1",
  email: "reader@example.com",
  emailVerified: false,
};

const users = () =>
  (globalThis as any).__emailVerificationUsers as Map<string, TestUser>;
const sendEmail = platform.sendEmailWithOptions as jest.Mock;
const updateFirebaseUser = (authModule as any).__mockUpdateUser as jest.Mock;

function sentCode(): string {
  const text = sendEmail.mock.calls[0]?.[0]?.text || "";
  const match = text.match(/\b\d{6}\b/);
  if (!match) throw new Error("Verification code was not included in the test email");
  return match[0];
}

describe("EmailVerificationService", () => {
  beforeEach(() => {
    (globalThis as any).__emailVerificationUsers = new Map<string, TestUser>([
      [loginUser.uid, { isVerified: false }],
    ]);
    jest.clearAllMocks();
  });

  it("stores only hashed OTP state and sends the generated code", async () => {
    const service = new EmailVerificationService();

    await service.requestCode(loginUser);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        to: [loginUser.email],
        subject: "Your BookGuide verification code",
      }),
    );

    const code = sentCode();
    const state = users().get(loginUser.uid)?.emailVerification;
    expect(code).toMatch(/^\d{6}$/);
    expect(state).toEqual(
      expect.objectContaining({
        requestId: expect.any(String),
        codeHash: expect.any(String),
        salt: expect.any(String),
        attempts: 0,
      }),
    );
    expect(state).not.toHaveProperty("code");
    expect(state.codeHash).not.toBe(code);
  });

  it("enforces the resend cooldown before sending another email", async () => {
    const service = new EmailVerificationService();

    await service.requestCode(loginUser);

    await expect(service.requestCode(loginUser)).rejects.toThrow(
      "Please wait before requesting another verification code",
    );
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("increments the attempt count for an invalid code", async () => {
    const service = new EmailVerificationService();
    await service.requestCode(loginUser);
    const code = sentCode();
    const wrongCode = code === "000000" ? "000001" : "000000";

    await expect(service.confirmCode(loginUser, wrongCode)).rejects.toThrow(
      "Invalid verification code",
    );

    expect(users().get(loginUser.uid)?.emailVerification?.attempts).toBe(1);
    expect(users().get(loginUser.uid)?.isVerified).toBe(false);
  });

  it("rejects an expired code and clears the stored OTP state", async () => {
    const service = new EmailVerificationService();
    await service.requestCode(loginUser);
    const code = sentCode();
    const state = users().get(loginUser.uid)?.emailVerification;
    state.expiresAt = { toMillis: () => Date.now() - 1 };

    await expect(service.confirmCode(loginUser, code)).rejects.toThrow(
      "Verification code has expired",
    );

    expect(users().get(loginUser.uid)?.emailVerification).toBeUndefined();
  });

  it("marks Firebase Auth and Firestore verified for a valid code", async () => {
    const service = new EmailVerificationService();
    await service.requestCode(loginUser);
    const code = sentCode();

    await expect(service.confirmCode(loginUser, code)).resolves.toBe(true);

    expect(updateFirebaseUser).toHaveBeenCalledWith(loginUser.uid, {
      emailVerified: true,
    });
    expect(users().get(loginUser.uid)?.isVerified).toBe(true);
    expect(users().get(loginUser.uid)?.emailVerification).toBeUndefined();
  });

  it("blocks unverified users and allows verified users through the gate", async () => {
    const service = new EmailVerificationService();

    await expect(service.assertVerified(loginUser)).rejects.toThrow(
      "Email verification required before starting or completing a transaction",
    );

    users().get(loginUser.uid)!.isVerified = true;
    await expect(service.assertVerified(loginUser)).resolves.toBeUndefined();
  });
});
