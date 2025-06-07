# 項目設定

本文件提供設定和運行專案的說明，該專案包含一個使用 GraphQL 的 Firebase 後端函式和一個 React 客戶端應用程式。

## 前提條件

在開始之前，請確保您已安裝以下工具：

- [Node.js](https://nodejs.org/) (v22 或更高版本，以符合 Firebase 的 `nodejs22` 執行環境)
- [NPM](https://www.npmjs.com/get-npm) 或 [Yarn](https://yarnpkg.com/getting-started/install)
- [Firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli)

## Firebase 專案設定

0.  **安裝 Firebase CLI (如果尚未安裝)**

    ```bash
    npm install -g firebase-tools
    ```

1.  **登入 Firebase：**

    ```bash
    firebase login
    ```

2.  **設定 Firebase 專案：**
    本專案設定為使用 Firebase 專案 `dllm-library`。若要將您的本機環境連接到此專案，請執行：
    ```bash
    firebase use dllm-library
    ```
    如果您想使用不同的 Firebase 專案，可以使用 `firebase use --add` 來新增。

## 後端設定 (Firebase Functions)

Firebase Functions 位於 `functions` 目錄中，並提供一個 GraphQL API。

1.  **前往 `functions` 目錄：**

    ```bash
    cd functions
    ```

2.  **安裝依賴套件：**
    ```bash
    npm install
    ```

> **請注意：** 當在本機端運行專案時，您可以跳過下方的步驟 3 和 4。詳細資訊請參閱 [在本機端運行](#在本機端運行) 章節。

3.  **產生 GraphQL 型別：**
    本專案使用 GraphQL Code Generator 從 GraphQL schema 產生 TypeScript 型別。

    ```bash
    npm run compile
    ```

    此指令會讀取 `schema.graphql` 並產生 `src/generated/graphql.ts`。

4.  **建置專案：**
    TypeScript 程式碼需要編譯成 JavaScript。
    ```bash
    npm run build
    ```
    這將會在 `dist` 目錄中建立已編譯的程式碼。

## 客戶端設定

客戶端是一個位於 `client` 目錄中的 React 應用程式。

1.  **前往 `client` 目錄：**

    ```bash
    cd client
    ```

2.  **安裝依賴套件：**

    ```bash
    npm install
    ```

3.  **產生 GraphQL 型別：**
    客戶端也使用 GraphQL Code Generator。
    ```bash
    npm run codegen
    ```

## 在本機端運行

Firebase Emulator Suite 可讓您在本機端運行整個專案。

1.  **前往專案 functions 目錄。**

    ```bash
    cd functions
    ```

2.  **啟動模擬器：**
    ```bash
    npm run start:inspect
    ```
    這將會啟動 Functions 和 Hosting 的模擬器。
    - GraphQL API 將會透過模擬器輸出的 URL 提供 (通常是 `http://localhost:5001/dllm-library/us-central1/graphql`)。
    - 客戶端應用程式將會由 Hosting 模擬器運行並提供 (通常在 `http://localhost:5000`)。

## 部署 (請注意：未經許可，請勿將專案部署到 Firebase，這會覆蓋現有專案)

若要將專案部署到 Firebase：

1.  **前往專案 functions 目錄。**

2.  **部署：**
    ```bash
    firebase deploy --only functions
    ```
    此指令將會：
    - 從 `functions` 目錄建置 Firebase Functions (根據 `firebase.json` 中的 `predeploy` 指令稿定義)。
    - 部署函式。
    - 建置客戶端應用程式 (如果尚未納入您的部署工作流程，您可能需要先在 `client` 目錄中執行 `npm run build`)。`firebase.json` 已設定為部署 `client/build` 的內容。
    - 將客戶端部署到 Firebase Hosting。
