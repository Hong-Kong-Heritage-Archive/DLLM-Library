import * as nodemailer from "nodemailer";

var serviceAccount = require("./dllm-libray-firebase-adminsdk.json");

interface EmailConfig {
  user: string;
  appPassword: string;
}

const emailConfig: EmailConfig = {
  user: serviceAccount.gmail_user || "",
  appPassword: serviceAccount.gmail_app_password || "",
};

function createTransporter() {
  if (!emailConfig.user || !emailConfig.appPassword) {
    throw new Error(
      "Gmail credentials not configured. Please add gmail_user and gmail_app_password to your service account JSON."
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailConfig.user,
      pass: emailConfig.appPassword,
    },
  });

  return transporter;
}

export { createTransporter, emailConfig };
