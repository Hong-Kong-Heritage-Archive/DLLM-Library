# Project Setup

This document provides instructions for setting up and running the project, which consists of a Firebase backend with GraphQL functions and a React client application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Firebase Project Setup](#firebase-project-setup)
- [Gmail App Password Setup (Required for Email Notifications)](#gmail-app-password-setup-required-for-email-notifications)
- [Backend Setup (Firebase Functions)](#backend-setup-firebase-functions)
- [Client Setup](#client-setup)
- [Running Locally](#running-locally)
- [Deployment](#deployment)

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v22 or later, to match the Firebase runtime `nodejs22`)
- [NPM](https://www.npmjs.com/get-npm) or [Yarn](https://yarnpkg.com/getting-started/install)
- [Firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli)
- Firebase Admin SDK JSON KEY (Downloaded from our Google Drive)
- A Gmail account for sending email notifications

## Firebase Project Setup

0.  **Install Firebase CLI (if not already installed)**

    ```bash
    npm install -g firebase-tools
    ```

1.  **Log in to Firebase:**

    ```bash
    firebase login
    ```

2.  **Configure Firebase Project:**
    This project is configured to use the Firebase project `dllm-library`. To connect your local environment to this project, run:
    ```bash
    firebase use dllm-library
    ```
    If you want to use a different Firebase project, you can add it using `firebase use --add`.

## Gmail App Password Setup (Required for Email Notifications)

The application uses Gmail to send email notifications. Follow these steps to generate an App Password and configure it:

### Step 1: Enable 2-Step Verification

1.  **Go to your Google Account:**
    Navigate to [https://myaccount.google.com/](https://myaccount.google.com/)

2.  **Access Security settings:**

    - Click on "Security" in the left sidebar
    - Scroll down to "How you sign in to Google"

3.  **Enable 2-Step Verification:**
    - Click on "2-Step Verification"
    - Follow the prompts to set it up if not already enabled
    - You'll need to verify your identity with your phone

### Step 2: Generate App Password

1.  **Access App Passwords:**

    - After enabling 2-Step Verification, go back to Security settings
    - Scroll down and click on "App passwords"
    - You may need to sign in again

2.  **Create a new App Password:**

    - Under "Select app", choose "Mail"
    - Under "Select device", choose "Other (Custom name)"
    - Enter a name like "DLLM Library" or "Firebase Functions"
    - Click "Generate"

3.  **Save the App Password:**
    - Google will display a 16-character password
    - **Copy this password immediately** - you won't be able to see it again
    - The password will look like: `abcd efgh ijkl mnop` (with spaces)
    - You can remove the spaces when using it: `abcdefghijklmnop`

### Step 3: Configure Firebase Admin SDK JSON

1.  **Locate your Firebase Admin SDK JSON file:**
    The file should be named `dllm-libray-firebase-adminsdk.json` in the `functions/src/` directory.

2.  **Add email configuration:**
    Open the JSON file and add the following fields:

    ```json
    {
      // ...existing fields (like project_id, private_key, client_email, etc.)...
      "gmail_user": "your-email@gmail.com",
      "gmail_app_password": "abcdefghijklmnop",
      "hosting_url": "https://dllm-library.web.app"
    }
    ```

    Replace the values with:

    - `gmail_user`: Your Gmail address (e.g., `library@gmail.com`)
    - `gmail_app_password`: The 16-character App Password you generated (without spaces)
    - `hosting_url`: Your Firebase Hosting URL (usually `https://your-project-id.web.app`)

3.  **Example configuration:**

    ```json
    {
      "type": "service_account",
      "project_id": "dllm-library",
      "private_key_id": "abc123...",
      "private_key": "-----BEGIN PRIVATE KEY-----\n...",
      "client_email": "firebase-adminsdk-xxxxx@dllm-library.iam.gserviceaccount.com",
      "client_id": "123456789",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/...",
      "gmail_user": "dllmlibrary@gmail.com",
      "gmail_app_password": "abcdefghijklmnop",
      "hosting_url": "https://dllm-library.web.app"
    }
    ```

4.  **Security Note:**
    - ⚠️ **Never commit this file to version control** (Git)
    - The file should already be in `.gitignore`
    - Keep this file secure and don't share it
    - If the password is compromised, revoke it in your Google Account settings and generate a new one

### Step 4: Install Email Dependencies

1.  **Navigate to the functions directory:**

    ```bash
    cd functions
    ```

2.  **Install required packages:**
    ```bash
    npm install nodemailer
    npm install --save-dev @types/nodemailer
    ```

### Gmail Sending Limits

Be aware of Gmail's sending limits:

- **Free Gmail Account**: 500 emails per day
- **Google Workspace Account**: 2,000 emails per day
- **Rate limit**: Maximum 100 recipients per message

### Testing Email Configuration

After configuration, you can test if emails are working:

```bash
cd functions
npm run build
firebase emulators:start
```

Then trigger an action that sends an email (like creating a transaction) and check the Firebase Functions logs.

## Backend Setup (Firebase Functions)

The Firebase Functions are located in the `functions` directory and expose a GraphQL API.

0. **Navigate to the project root directory.**

   ```bash
   cd <your-project-root-directory>
   ```

1. **Navigate to the functions directory:**

   ```bash
   cd functions
   ```

2. **Move the `firebase-admin-key.json` file to the `functions/src/` directory:**

   ```bash
   mv ~/Downloads/dllm-libray-firebase-adminsdk.json ./src/
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

> **Note:** When running the project locally, you can skip steps 4 and 5 below. See the [Running Locally](#running-locally) section for details.

4.  **Generate GraphQL types:**
    This project uses GraphQL Code Generator to create TypeScript types from the GraphQL schema.

    ```bash
    npm run compile
    ```

    This command reads `schema.graphql` and generates `src/generated/graphql.ts`.

5.  **Build the project:**
    The TypeScript code needs to be compiled to JavaScript.
    ```bash
    npm run build
    ```
    This will create a `dist` directory with the compiled code.

## Client Setup

The client is a React application located in the `client` directory.

1.  **Navigate to the client directory:**

    ```bash
    cd client
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Generate GraphQL types:**
    The client also uses GraphQL Code Generator.
    ```bash
    npm run codegen
    ```

## Running Locally

The Firebase Emulator Suite allows you to run the entire project locally.

1.  **Navigate to the project functions directory.**

    ```bash
    cd functions
    ```

2.  **Start the emulators:**
    ```bash
    npm run start:inspect
    ```
    This will start emulators for Functions and Hosting.
    - The GraphQL API will be available at the URL shown in the emulator output (usually `http://localhost:5001/dllm-library/us-central1/graphql`).
    - The client application will be running and served by the Hosting emulator (usually at `http://localhost:5000`).
    - The Firebase Emulator UI will be available at `http://localhost:4000`. You can use this to view the logs and metrics of the emulators.

## Deployment (Note: please don't deploy the project to Firebase without permission, it will override the existing project)

To deploy the project to Firebase:

1.  **Navigate to the project root directory.**

2.  **Deploy:**
    ```bash
    firebase deploy --only functions
    ```
    This command will:
    - Build the Firebase Functions from the `functions` directory (as defined by the `predeploy` script in `firebase.json`).
    - Deploy the functions.
    - Build the client application (you might need to run `npm run build` in the `client` directory first if not included in your deployment workflow). The `firebase.json` is configured to deploy the contents of `client/build`.
    - Deploy the client to Firebase Hosting.

## Troubleshooting

### Email Not Sending

If emails are not being sent, check the following:

1. **Verify App Password is correct** in `dllm-libray-firebase-adminsdk.json`
2. **Check 2-Step Verification is enabled** on your Gmail account
3. **Verify the Gmail address** is correct
4. **Check Firebase Functions logs** for error messages:
   ```bash
   firebase functions:log
   ```
5. **Test with Gmail directly** - try sending an email using the same credentials outside of the app

### App Password Issues

If you get authentication errors:

1. **Regenerate the App Password:**

   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Navigate to "App passwords"
   - Delete the old password
   - Generate a new one
   - Update `gmail_app_password` in your JSON file

2. **Verify 2-Step Verification is still enabled** - it's required for App Passwords

3. **Check for typos** - ensure there are no spaces in the password in the JSON file

### Common Error Messages

- `"Invalid login"` - Wrong email or app password
- `"Application-specific password required"` - Need to use App Password, not regular password
- `"Username and Password not accepted"` - 2-Step Verification may not be enabled
