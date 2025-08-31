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

const projectId = process.env.GCLOUD_PROJECT || "lib-20min";
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
    contentType: contentType,
    expires: expires,
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

async function GetPublicUrlForGSFile(gsFileUrl: string): Promise<string> {
  // get the bucket name from gsfilePath
  if (!gsFileUrl.startsWith("gs://")) {
    throw new Error(`Invalid gsFilePath: ${gsFileUrl}`);
  }
  const parts = gsFileUrl.split("/");
  if (parts.length < 3) {
    throw new Error(`Invalid gsFilePath: ${gsFileUrl}`);
  }
  const bucketName = parts[2];
  if (!bucketName) {
    throw new Error(`Invalid bucket name in gsFilePath: ${gsFileUrl}`);
  }
  const gsFilePath = parts.slice(3).join("/");
  if (!gsFilePath) {
    throw new Error(`Invalid gsFilePath: ${gsFileUrl}`);
  }
  const bucket = admin.storage().bucket(bucketName);
  const file = bucket.file(gsFilePath);

  const [exists] = await file.exists();
  if (!exists) {
    throw new Error(`File does not exist: ${gsFilePath}`);
  }
  await file.makePublic();
  // Get the public URL for the file
  const publicUrl = `https://storage.googleapis.com/${bucketName}/${gsFilePath}`;
  return publicUrl;
}

async function UploadBufferToGCS(uploadPath: string, buffer: Buffer, contentType: string): Promise<string> {
  const bucket = admin.storage().bucket(serviceAccount.bucket_name);
  const uploadFile = bucket.file(uploadPath);
  await uploadFile.save(buffer, {
    metadata: {
      contentType: contentType
    },
  });
  await uploadFile.makePublic();
  return `gs://${serviceAccount.bucket_name}/${uploadPath}`;
}

async function sendNotificationViaEmail(
  to: string[],
  cc: string[],
  subject: string,
  body: string
): Promise<void> {
  const mailOptions = {
    to,
    cc,
    subject,
    text: body,
  };
  try {
    await admin.firestore().collection("mail").add(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
  // Note: This is a placeholder function. In a real application, you would use a mail service like SendGrid, Mailgun, or similar
  // to send the email. The above code assumes you have a Firestore collection named "mail" where email messages are queued
  // for processing. Replace this implementation with a proper email-sending service for production use.
}

export {
  sendNotificationViaEmail,
  getLoginUserFromToken,
  LoginUser,
  db,
  GenerateSignedUrlForUpload,
  GetPublicUrlForGSFile,
  UploadBufferToGCS,
};
