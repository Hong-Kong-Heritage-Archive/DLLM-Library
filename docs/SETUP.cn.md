# 項目設定

本文件提供設定和運行專案的說明，該專案包含一個使用 GraphQL 的 Firebase 後端函式和一個 React 客戶端應用程式。

## 目錄

- [前提條件](#前提條件)
- [Firebase 專案設定](#firebase-專案設定)
- [Gmail 應用程式密碼設定 (電子郵件通知必要)](#gmail-應用程式密碼設定-電子郵件通知必要)
- [後端設定 (Firebase Functions)](#後端設定-firebase-functions)
- [客戶端設定](#客戶端設定)
- [在本機端運行](#在本機端運行)
- [部署](#部署)

## 前提條件

在開始之前，請確保您已安裝以下工具：

- [Node.js](https://nodejs.org/) (v22 或更高版本，以符合 Firebase 的 `nodejs22` 執行環境)
- [NPM](https://www.npmjs.com/get-npm) 或 [Yarn](https://yarnpkg.com/getting-started/install)
- [Firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli)
- Firebase Admin SDK JSON KEY (從我們的 Google Drive 下載)
- 用於發送電子郵件通知的 Gmail 帳戶

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

## Gmail 應用程式密碼設定 (電子郵件通知必要)

應用程式使用 Gmail 發送電子郵件通知。請按照以下步驟產生應用程式密碼並進行設定：

### 步驟 1: 啟用兩步驟驗證

1.  **前往您的 Google 帳戶：**
    導航至 [https://myaccount.google.com/](https://myaccount.google.com/)

2.  **存取安全性設定：**

    - 點擊左側欄中的「安全性」
    - 向下捲動至「登入 Google 的方式」

3.  **啟用兩步驟驗證：**
    - 點擊「兩步驟驗證」
    - 如果尚未啟用，請按照提示進行設定
    - 您需要使用手機驗證您的身份

### 步驟 2: 產生應用程式密碼

1.  **存取應用程式密碼：**

    - 啟用兩步驟驗證後，返回安全性設定
    - 向下捲動並點擊「應用程式密碼」
    - 您可能需要再次登入

2.  **建立新的應用程式密碼：**

    - 在「選取應用程式」下，選擇「郵件」
    - 在「選取裝置」下，選擇「其他(自訂名稱)」
    - 輸入名稱，例如「DLLM Library」或「Firebase Functions」
    - 點擊「產生」

3.  **儲存應用程式密碼：**
    - Google 會顯示一個 16 字元的密碼
    - **立即複製此密碼** - 您將無法再次看到它
    - 密碼格式類似：`abcd efgh ijkl mnop`(有空格)
    - 使用時可以移除空格：`abcdefghijklmnop`

### 步驟 3: 設定 Firebase Admin SDK JSON

1.  **找到您的 Firebase Admin SDK JSON 檔案：**
    檔案應命名為 `dllm-libray-firebase-adminsdk.json`，位於 `functions/src/` 目錄中。

2.  **新增電子郵件設定：**
    開啟 JSON 檔案並新增以下欄位：

    ```json
    {
      // ...現有欄位 (如 project_id, private_key, client_email 等)...
      "gmail_user": "your-email@gmail.com",
      "gmail_app_password": "abcdefghijklmnop",
      "hosting_url": "https://dllm-library.web.app"
    }
    ```

    將值替換為：

    - `gmail_user`: 您的 Gmail 地址 (例如：`library@gmail.com`)
    - `gmail_app_password`: 您產生的 16 字元應用程式密碼 (不含空格)
    - `hosting_url`: 您的 Firebase Hosting URL (通常是 `https://your-project-id.web.app`)

3.  **設定範例：**

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

4.  **安全性注意事項：**
    - ⚠️ **切勿將此檔案提交到版本控制系統** (Git)
    - 該檔案應該已在 `.gitignore` 中
    - 請妥善保管此檔案，不要分享
    - 如果密碼洩露，請在您的 Google 帳戶設定中撤銷它並產生新的密碼

### 步驟 4: 安裝電子郵件依賴套件

1.  **導航至 functions 目錄：**

    ```bash
    cd functions
    ```

2.  **安裝必要的套件：**
    ```bash
    npm install nodemailer
    npm install --save-dev @types/nodemailer
    ```

### Gmail 發送限制

請注意 Gmail 的發送限制：

- **免費 Gmail 帳戶**：每天 500 封電子郵件
- **Google Workspace 帳戶**：每天 2,000 封電子郵件
- **速率限制**：每則訊息最多 100 個收件者

### 測試電子郵件設定

設定完成後，您可以測試電子郵件是否正常運作：

```bash
cd functions
npm run build
firebase emulators:start
```

然後觸發一個會發送電子郵件的動作（例如建立交易）並檢查 Firebase Functions 日誌。

## 後端設定 (Firebase Functions)

Firebase Functions 位於 `functions` 目錄中，並提供一個 GraphQL API。

0.  **導航至專案根目錄。**

    ```bash
    cd <your-project-root-directory>
    ```

1.  **前往 `functions` 目錄：**

    ```bash
    cd functions
    ```

2.  **將 `firebase-admin-key.json` 檔案移動到 `functions/src/` 目錄：**

    ```bash
    mv ~/Downloads/dllm-libray-firebase-adminsdk.json ./src/
    ```

3.  **安裝依賴套件：**
    ```bash
    npm install
    ```

> **請注意：** 當在本機端運行專案時，您可以跳過下方的步驟 4 和 5。詳細資訊請參閱 [在本機端運行](#在本機端運行) 章節。

4.  **產生 GraphQL 型別：**
    本專案使用 GraphQL Code Generator 從 GraphQL schema 產生 TypeScript 型別。

    ```bash
    npm run compile
    ```

    此指令會讀取 `schema.graphql` 並產生 `src/generated/graphql.ts`。

5.  **建置專案：**
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
    - Firebase Emulator UI 將在 `http://localhost:4000` 上可用。您可以使用它來查看模擬器的日誌和指標。

## 部署 (請注意：未經許可，請勿將專案部署到 Firebase，這會覆蓋現有專案)

若要將專案部署到 Firebase：

1.  **前往專案根目錄。**

2.  **部署：**
    ```bash
    firebase deploy --only functions
    ```
    此指令將會：
    - 從 `functions` 目錄建置 Firebase Functions (根據 `firebase.json` 中的 `predeploy` 指令稿定義)。
    - 部署函式。
    - 建置客戶端應用程式 (如果尚未納入您的部署工作流程，您可能需要先在 `client` 目錄中執行 `npm run build`)。`firebase.json` 已設定為部署 `client/build` 的內容。
    - 將客戶端部署到 Firebase Hosting。

## 故障排除

### 電子郵件未發送

如果電子郵件未發送，請檢查以下項目：

1. **驗證應用程式密碼是否正確** 在 `dllm-libray-firebase-adminsdk.json` 中
2. **檢查兩步驟驗證是否已啟用** 在您的 Gmail 帳戶上
3. **驗證 Gmail 地址** 是否正確
4. **檢查 Firebase Functions 日誌** 以查看錯誤訊息：
   ```bash
   firebase functions:log
   ```
5. **直接測試 Gmail** - 嘗試在應用程式外使用相同的憑證發送電子郵件

### 應用程式密碼問題

如果您遇到身份驗證錯誤：

1. **重新產生應用程式密碼：**

   - 前往 [Google 帳戶安全性](https://myaccount.google.com/security)
   - 導航至「應用程式密碼」
   - 刪除舊密碼
   - 產生新密碼
   - 更新您的 JSON 檔案中的 `gmail_app_password`

2. **驗證兩步驟驗證仍然啟用** - 這是應用程式密碼的必要條件

3. **檢查錯字** - 確保 JSON 檔案中的密碼沒有空格

### 常見錯誤訊息

- `"Invalid login"` - 錯誤的電子郵件或應用程式密碼
- `"Application-specific password required"` - 需要使用應用程式密碼，而不是一般密碼
- `"Username and Password not accepted"` - 可能未啟用兩步驟驗證
