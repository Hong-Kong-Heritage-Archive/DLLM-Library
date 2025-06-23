import * as admin from "firebase-admin";
const { Storage } = require("@google-cloud/storage");
import {
  Resolvers,
  Location,
  Item,
  User,
  ContactMethod,
} from "./generated/graphql";
import { GetSignedUrlConfig } from "@google-cloud/storage";
var serviceAccount = require("./dllm-libray-firebase-adminsdk.json");
export const googleMapsApiKey = serviceAccount.google_maps_api_key ?? "";

const projectId = process.env.GCLOUD_PROJECT || "dllm-libray";
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

interface LoginUser {
  uid: string;
  email: string;
  emailVerified?: boolean; // Optional, if you want to check email verification
}

const db = admin.firestore();
const auth = admin.auth();
//const storage = admin.storage();
//const bucket = storage.bucket();

function getLoginUserFromToken(token: string): Promise<LoginUser | null> {
  return new Promise((resolve, reject) => {
    auth
      .verifyIdToken(token)
      .then((decodedToken) => {
        const loginUser: LoginUser = {
          uid: decodedToken.uid,
          email: decodedToken.email || "",
          emailVerified: decodedToken.email_verified || false, // Optional, if you want to check email verification
        };
        resolve(loginUser);
      })
      .catch((error) => {
        console.error("Error verifying token:", error);
        resolve(null);
      });
  });
}

async function GenerateSignedUrlForUpload(
  userId: string,
  fileName: string,
  contentType: string,
  folder?: string
): Promise<{ expires: number; signedUrl: string; gsUrl: string }> {
  //let bucketName = process.env.GCLOUD_STORAGE_BUCKET || 'dllm-libray.appspot.com';
  const fullPath = folder
    ? `${folder}/${userId}/${fileName}`
    : `${userId}/${fileName}`;

  const expires = Date.now() + 15 * 60 * 1000; // 15 minutes

  const cfg: GetSignedUrlConfig = {
    version: "v4",
    action: "write",
    //contentType: contentType,
    contentType: "application/octet-stream",
    expires: expires,
    extensionHeaders: {
      "x-goog-content-length-range": "0,52428800", // 50MB max
    },
  };
  const bucket = admin.storage().bucket(serviceAccount.bucket_name);
  const gsUrl = `gs://${bucket.name}/${fullPath}`;

  const file = bucket.file(fullPath);

  const signedUrls = await file.getSignedUrl(cfg);
  if (!signedUrls || signedUrls[0].length === 0) {
    throw new Error(`Failed to generate signed URL ${contentType}`);
  }
  return { expires, signedUrl: signedUrls[0], gsUrl };
}

export { getLoginUserFromToken, LoginUser, db, GenerateSignedUrlForUpload };
