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
import { createTransporter, emailConfig } from "./email-config";

var serviceAccount = require("./dllm-libray-firebase-adminsdk.json");
export const googleMapsApiKey = serviceAccount.google_maps_api_key ?? "";

const projectId = process.env.GCLOUD_PROJECT || "dllm-libray";
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

interface LoginUser {
  uid: string;
  email: string;
  emailVerified?: boolean;
}

const db = admin.firestore();
const auth = admin.auth();

function getLoginUserFromToken(token: string): Promise<LoginUser | null> {
  return new Promise((resolve, reject) => {
    auth
      .verifyIdToken(token)
      .then((decodedToken) => {
        const loginUser: LoginUser = {
          uid: decodedToken.uid,
          email: decodedToken.email || "",
          emailVerified: decodedToken.email_verified || false,
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
  const publicUrl = `https://storage.googleapis.com/${bucketName}/${gsFilePath}`;
  return publicUrl;
}

async function UploadBufferToGCS(
  uploadPath: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const bucket = admin.storage().bucket(serviceAccount.bucket_name);
  const uploadFile = bucket.file(uploadPath);
  await uploadFile.save(buffer, {
    metadata: {
      contentType: contentType,
    },
  });
  await uploadFile.makePublic();
  return `gs://${serviceAccount.bucket_name}/${uploadPath}`;
}

interface EmailOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
  actionUrl?: string;
  actionText?: string;
}

async function sendNotificationViaEmail(
  to: string[],
  cc: string[],
  subject: string,
  body: string,
  subpath?: string
): Promise<void> {
  try {
    const transporter = createTransporter();

    // Generate the full URL if subpath is provided
    const actionUrl = subpath
      ? `${serviceAccount.hosting_url}/${subpath.replace(/^\//, "")}`
      : null;

    const mailOptions = {
      from: `DLLM Library <${emailConfig.user}>`,
      to: to.join(", "),
      cc: cc.length > 0 ? cc.join(", ") : undefined,
      subject: subject,
      text: body + (actionUrl ? `\n\nView details: ${actionUrl}` : ""),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">DLLM Library</h1>
          </div>
          <div style="background-color: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px;">
            <div style="background-color: white; padding: 20px; border-radius: 4px; line-height: 1.6;">
              ${body.replace(/\n/g, "<br>")}
            </div>
            ${
              actionUrl
                ? `
            <div style="text-align: center; margin-top: 30px;">
              <a href="${actionUrl}" 
                 style="display: inline-block; 
                        background-color: #1976d2; 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 4px; 
                        font-weight: bold;
                        font-size: 16px;">
                View Details
              </a>
            </div>
            <p style="text-align: center; margin-top: 15px; font-size: 12px; color: #666;">
              Or copy this link: <a href="${actionUrl}" style="color: #1976d2;">${actionUrl}</a>
            </p>
            `
                : ""
            }
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
              This is an automated message from DLLM Library. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    console.log("Accepted recipients:", info.accepted);
    console.log("Rejected recipients:", info.rejected);
    if (actionUrl) {
      console.log("Action URL:", actionUrl);
    }
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email: ${error}`);
  }
}

async function sendEmailWithOptions(options: EmailOptions): Promise<void> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `DLLM Library <${emailConfig.user}>`,
      to: options.to.join(", "),
      cc:
        options.cc && options.cc.length > 0 ? options.cc.join(", ") : undefined,
      bcc:
        options.bcc && options.bcc.length > 0
          ? options.bcc.join(", ")
          : undefined,
      subject: options.subject,
      text:
        options.text +
        (options.actionUrl
          ? `\n\n${options.actionText || "View details"}: ${options.actionUrl}`
          : ""),
      html:
        options.html ||
        (options.text
          ? `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">DLLM Library</h1>
          </div>
          <div style="background-color: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px;">
            <div style="background-color: white; padding: 20px; border-radius: 4px; line-height: 1.6;">
              ${options.text.replace(/\n/g, "<br>")}
            </div>
            ${
              options.actionUrl
                ? `
            <div style="text-align: center; margin-top: 30px;">
              <a href="${options.actionUrl}" 
                 style="display: inline-block; 
                        background-color: #1976d2; 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 4px; 
                        font-weight: bold;
                        font-size: 16px;">
                ${options.actionText || "View Details"}
              </a>
            </div>
            <p style="text-align: center; margin-top: 15px; font-size: 12px; color: #666;">
              Or copy this link: <a href="${
                options.actionUrl
              }" style="color: #1976d2;">${options.actionUrl}</a>
            </p>
            `
                : ""
            }
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
              This is an automated message from DLLM Library. Please do not reply to this email.
            </p>
          </div>
        </div>`
          : undefined),
      attachments: options.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    console.log("Accepted recipients:", info.accepted);
    if (options.actionUrl) {
      console.log("Action URL:", options.actionUrl);
    }
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email: ${error}`);
  }
}

export {
  sendNotificationViaEmail,
  sendEmailWithOptions,
  getLoginUserFromToken,
  LoginUser,
  db,
  GenerateSignedUrlForUpload,
  GetPublicUrlForGSFile,
  UploadBufferToGCS,
};
