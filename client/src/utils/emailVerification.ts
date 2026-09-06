import { auth } from "../firebase";
import * as config from "../dllm-client-config.json";

const graphqlUrl = String(config.graphql || "");
const apiBaseUrl = graphqlUrl.replace(/\/graphql\/?$/, "");

export const EMAIL_VERIFICATION_COMPLETED_EVENT =
  "bookguide:email-verification-completed";

async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in first");
  return user.getIdToken();
}

async function ensureUserProfile(token: string) {
  const response = await fetch(graphqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query: "query EnsureUserProfile { me { id } }" }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.errors?.length) {
    throw new Error(
      payload?.errors?.[0]?.message || "Unable to prepare your user profile",
    );
  }
}

async function postVerification(path: string, body?: Record<string, unknown>) {
  const token = await getAuthToken();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body || {}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success !== true) {
    throw new Error(payload?.error || "Email verification failed");
  }

  return true;
}

export async function requestEmailVerificationCode() {
  const token = await getAuthToken();
  await ensureUserProfile(token);
  return postVerification("/email-verification/request");
}

export async function confirmEmailVerificationCode(code: string) {
  await postVerification("/email-verification/confirm", { code });
  await auth.currentUser?.reload();
  await auth.currentUser?.getIdToken(true);
  window.dispatchEvent(new CustomEvent(EMAIL_VERIFICATION_COMPLETED_EVENT));
  return true;
}

export function openEmailVerificationDialog() {
  window.dispatchEvent(new CustomEvent("bookguide:email-verification-required"));
}
