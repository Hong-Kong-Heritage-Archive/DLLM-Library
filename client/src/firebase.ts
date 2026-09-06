import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import * as config from "./dllm-client-config.json";

const firebaseConfig = config;

const app = initializeApp(firebaseConfig);
console.log("Firebase app initialized:", app.name);

export const auth = getAuth(app);

// Temporary compatibility shim for the existing Home action. It no longer
// uses Firebase's verification-link email. Existing unverified users are sent
// a BookGuide 6-digit OTP and the new verification dialog is opened instead.
export async function sendVerificationEmail() {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in first");

  const graphqlUrl = String(config.graphql || "");
  const apiBaseUrl = graphqlUrl.replace(/\/graphql\/?$/, "");
  const token = await user.getIdToken();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Older Firebase-auth users may not have an application profile yet.
  // Calling me() keeps this entry point backward-compatible with those users.
  const profileResponse = await fetch(graphqlUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: "query EnsureUserProfile { me { id } }" }),
  });
  const profilePayload = await profileResponse.json().catch(() => ({}));
  if (!profileResponse.ok || profilePayload?.errors?.length) {
    throw new Error(
      profilePayload?.errors?.[0]?.message || "Unable to prepare your user profile",
    );
  }

  const response = await fetch(`${apiBaseUrl}/email-verification/request`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success !== true) {
    throw new Error(payload?.error || "Unable to send verification code");
  }

  window.dispatchEvent(new CustomEvent("bookguide:email-verification-required"));
}
