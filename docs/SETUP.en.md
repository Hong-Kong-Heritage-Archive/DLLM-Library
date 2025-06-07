# Project Setup

This document provides instructions for setting up and running the project, which consists of a Firebase backend with GraphQL functions and a React client application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Firebase Project Setup](#firebase-project-setup)
- [Backend Setup (Firebase Functions)](#backend-setup-firebase-functions)
- [Client Setup](#client-setup)
- [Running Locally](#running-locally)
- [Deployment](#deployment)

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v22 or later, to match the Firebase runtime `nodejs22`)
- [NPM](https://www.npmjs.com/get-npm) or [Yarn](https://yarnpkg.com/getting-started/install)
- [Firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli)
- Firebase Admin SDK JSON KEY (Downloaded from our google drive)

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
2. **Move the `firebase-admin-key.json` file to the `functions/` directory:**

   ```bash
   mv ~/Downloads/dllm-libray-firebase-adminsdk.json ./
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

> **Note:** When running the project locally, you can skip steps 3 and 4 below. See the [Running Locally](#running-locally) section for details.

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

## Deployment (Noted that: please don't deploy the project to Firebase without permission, it will override the existing project)

To deploy the project to Firebase:

1.  **Navigate to the project root directory.**

2.  **Deploy:**
    ```bash
    firebase deploy --only functions
    ```
    This command will:
    - Build the Firebase Functions from the `functions` directory (as defined by the `predeploy` script in `firebase.json`).
    - Deploy the functions.
    - Build the client application (you might need to run `npm run build` in the `
