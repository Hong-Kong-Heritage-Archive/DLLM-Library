import { Request, Response } from "express";
import { readFile } from "fs";
import path from "path";

import * as fs from "fs";
import { isBotRequest, getBotType } from "./botDetection";
import { CategoryService } from "./categoryService";
import { ItemService } from "./itemService";
import { UserService } from "./userService";
import { TransactionService } from "./transactionService";
import { BinderService } from "./binderService";

const categoryService = new CategoryService();
const itemService = new ItemService(categoryService);
const userService = new UserService(itemService, categoryService);
const transactionService = new TransactionService(itemService, userService);
const binderService = new BinderService(itemService, userService);
// Get Config
const getConfig = () => {
  const clientConfigPath = path.join(
    process.cwd(),
    "..",
    "client",
    "public",
    "dllm-client-config.json",
  );
  try {
    if (fs.existsSync(clientConfigPath)) {
      const configData = fs.readFileSync(clientConfigPath, "utf8");
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error("Error reading client config:", error);
  }
  return { baseUrl: "${getBaseUrl()}" };
};

// Get base URL
const getBaseUrl = () => {
  const config = getConfig();
  return process.env.NODE_ENV === "production"
    ? config.baseUrl
    : "http://localhost:3000";
};

// Get logo URL
const getLogoUrl = (): string => {
  return `${getBaseUrl()}/logo512.png`;
};

/**
 * Helper function to render HTML with Open Graph tags
 */
export const renderHtmlWithOgTags = (
  res: Response,
  htmlData: string,
  ogTags: string,
) => {
  // Add base tag for correct path resolution
  const baseUrl = getBaseUrl();

  let modifiedHtml = htmlData
    .replace(/<title>.*?<\/title>/, "")
    .replace(/<meta name="description" content=".*?"\s*\/?>/, "");

  // Add base tag to ensure correct path resolution
  const baseTag = `<base href="${baseUrl}/">`;

  modifiedHtml = modifiedHtml.replace("<head>", `<head>\n${baseTag}`);
  modifiedHtml = modifiedHtml.replace("</head>", `${ogTags}</head>`);
  res.setHeader("Content-Type", "text/html");
  res.send(modifiedHtml);
};

/**
 * Handle home page SSR
 */
export const handleHomePageSSR = (
  req: Request,
  res: Response,
  redirectPath?: string,
) => {
  const indexPath = path.join(__dirname, "..", "index.html");
  readFile(indexPath, "utf8", (err, htmlData) => {
    if (err) {
      console.error(
        "Error reading index.html from functions folder. Make sure it is copied during the build.",
        err,
      );
      return res.status(500).send("Could not load the page.");
    }

    const newTitle = "無大台 Decentralized Local Library Module";
    const newDescription = "香港・雪梨・無大台圖書館模組";
    const newImageUrl = getLogoUrl();

    // Create redirect script if redirectPath is provided
    let redirectScript = "";
    if (redirectPath) {
      redirectScript = `
<script type="text/javascript">
  // Store the intended path in sessionStorage for client-side routing
  window.addEventListener('DOMContentLoaded', function() {
    sessionStorage.setItem('redirectPath', ${JSON.stringify(redirectPath)});
  });
</script>
        `;
    }

    const ogTags = `
<title>${newTitle}</title>
<meta name="description" content="${newDescription}" />
<meta property="og:title" content="${newTitle}" />
<meta property="og:description" content="${newDescription}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${getBaseUrl()}/" />
<meta property="og:image" content="${newImageUrl}" />
<meta property="og:image:width" content="512" />
<meta property="og:image:height" content="512" />
${redirectScript}
        `;

    renderHtmlWithOgTags(res, htmlData, ogTags);
  });
};

/**
 * Generate client-side redirection script
 */
const generateRedirectScript = (itemId: string, req: Request) => {
  return `
<!-- Client-side redirection script -->
<script type="text/javascript">
  // Store the item ID for the client app to use
  sessionStorage.setItem('viewItemId', '${itemId}');
</script>
  `;
};

/**
 * Generate client-side redirection script for user profile
 */
const generateUserRedirectScript = (userId: string, req: Request) => {
  return `
<!-- Client-side redirection script -->
<script type="text/javascript">
  // Store the user ID for the client app to use
  sessionStorage.setItem('viewUserId', '${userId}');
</script>
  `;
};

/**
 * Generate client-side redirection script for transaction
 */
const generateTransactionRedirectScript = (
  transactionId: string,
  req: Request,
) => {
  return `
<!-- Client-side redirection script -->
<script type="text/javascript">
  // Store the transaction ID for the client app to use
  sessionStorage.setItem('viewTransactionId', '${transactionId}');
</script>
  `;
};

/**
 * Generate client-side redirection script for binder
 */
const generateBinderRedirectScript = (binderId: string, req: Request) => {
  return `
<!-- Client-side redirection script -->
<script type="text/javascript">
  // Store the binder ID for the client app to use
  sessionStorage.setItem('viewBinderId', '${binderId}');
</script>
  `;
};

/**
 * Handle user profile page SSR
 */
export const handleUserProfileSSR = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const indexPath = path.join(__dirname, "..", "index.html");

    // Read the HTML template
    readFile(indexPath, "utf8", async (err, htmlData) => {
      if (err) {
        console.error("Error reading index.html from functions folder.", err);
        return res.status(500).send("Could not load the page.");
      }

      try {
        // Get user data from Firestore
        const user = await userService.userById(userId);
        if (user === null) {
          // If user doesn't exist, still render the page but with generic OG tags and redirect
          const redirectScript = generateUserRedirectScript(userId, req);
          const ogTags = `
<title>User Not Found - DLLM Library</title>
<meta name="description" content="The requested user profile could not be found." />
<meta property="og:title" content="User Not Found - DLLM Library" />
<meta property="og:description" content="The requested user profile could not be found." />
<meta property="og:type" content="profile" />
<meta property="og:url" content="${getBaseUrl()}/user/${userId}" />
<meta property="og:image" content="${getLogoUrl()}" />
${redirectScript}
          `;
          renderHtmlWithOgTags(res, htmlData, ogTags);
          return;
        }

        // Get user data
        const userName = user.nickname || user.email;
        const userEmail = user.email || "Email not available";
        const userStatus = user.isActive
          ? user.isVerified
            ? "Active & Verified"
            : "Active"
          : "Inactive";

        // Get profile image or use default
        let imageUrl = getLogoUrl(); // Default image
        // Note: User type doesn't have profileImage field, using default logo

        // Create Open Graph tags with a client-side redirection script
        const redirectScript = generateUserRedirectScript(userId, req);

        // Create an enhanced description with email and status
        const enhancedDescription = `Email: ${userEmail} | Status: ${userStatus}`;

        const ogTags = `
<title>${userName} - DLLM Library</title>
<meta name="description" content="${enhancedDescription}" />
<meta property="og:title" content="${userName} - DLLM Library" />
<meta property="og:description" content="${enhancedDescription}" />
<meta property="og:type" content="profile" />
<meta property="og:url" content="${getBaseUrl()}/user/${userId}" />
<meta property="og:image" content="${imageUrl}" />
<meta property="profile:first_name" content="${userName.split(" ")[0] || userName}" />
<meta property="profile:last_name" content="${userName.split(" ").slice(1).join(" ") || ""}" />
${redirectScript}
        `;

        renderHtmlWithOgTags(res, htmlData, ogTags);
      } catch (error) {
        console.error("Error generating user SSR content:", error);
        // Fallback to generic tags with redirect
        const redirectScript = generateUserRedirectScript(userId, req);
        const ogTags = `
<title>DLLM Library User</title>
<meta name="description" content="View this user profile in the DLLM Library." />
<meta property="og:title" content="DLLM Library User" />
<meta property="og:description" content="View this user profile in the DLLM Library." />
<meta property="og:type" content="profile" />
<meta property="og:url" content="${getBaseUrl()}/user/${userId}" />
<meta property="og:image" content="${getLogoUrl()}" />
${redirectScript}
        `;
        renderHtmlWithOgTags(res, htmlData, ogTags);
      }
    });
  } catch (error) {
    console.error("Error in user SSR route:", error);
    res.status(500).send("Server error");
  }
};

/**
 * Handle transaction detail page SSR
 */
export const handleTransactionDetailSSR = async (
  req: Request,
  res: Response,
) => {
  try {
    const transactionId = req.params.id;
    const indexPath = path.join(__dirname, "..", "index.html");

    // Read the HTML template
    readFile(indexPath, "utf8", async (err, htmlData) => {
      if (err) {
        console.error("Error reading index.html from functions folder.", err);
        return res.status(500).send("Could not load the page.");
      }

      try {
        // Get transaction data from Firestore
        const transaction =
          await transactionService.transactionById(transactionId);
        if (transaction === null) {
          // If transaction doesn't exist, still render the page but with generic OG tags and redirect
          const redirectScript = generateTransactionRedirectScript(
            transactionId,
            req,
          );
          const ogTags = `
<title>Transaction Not Found - DLLM Library</title>
<meta name="description" content="The requested transaction could not be found." />
<meta property="og:title" content="Transaction Not Found - DLLM Library" />
<meta property="og:description" content="The requested transaction could not be found." />
<meta property="og:type" content="website" />
<meta property="og:url" content="${getBaseUrl()}/transaction/${transactionId}" />
<meta property="og:image" content="${getLogoUrl()}" />
${redirectScript}
          `;
          renderHtmlWithOgTags(res, htmlData, ogTags);
          return;
        }

        // Get transaction data
        const itemName = transaction.item?.name || "Unknown Item";
        const transactionStatus = transaction.status;
        const requestorName =
          transaction.requestor?.nickname ||
          transaction.requestor?.email ||
          "Unknown User";
        const holderName = "Unknown Holder"; // Transaction type doesn't have holder field

        // Create description based on transaction details
        const transactionDescription = `Transaction for ${itemName} - Requested by ${requestorName}, Held by ${holderName} | Status: ${transactionStatus}`;

        // Get item image or use default
        let imageUrl = getLogoUrl(); // Default image
        if (
          transaction.item?.thumbnails &&
          transaction.item.thumbnails.length > 0
        ) {
          imageUrl = transaction.item.thumbnails[0];
        } else if (
          transaction.item?.images &&
          transaction.item.images.length > 0
        ) {
          imageUrl = transaction.item.images[0];
        }

        // Create Open Graph tags with a client-side redirection script
        const redirectScript = generateTransactionRedirectScript(
          transactionId,
          req,
        );

        const ogTags = `
<title>Transaction: ${itemName} - DLLM Library</title>
<meta name="description" content="${transactionDescription}" />
<meta property="og:title" content="Transaction: ${itemName} - DLLM Library" />
<meta property="og:description" content="${transactionDescription}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${getBaseUrl()}/transaction/${transactionId}" />
<meta property="og:image" content="${imageUrl}" />
<meta property="article:section" content="Status: ${transactionStatus}" />
${redirectScript}
        `;

        renderHtmlWithOgTags(res, htmlData, ogTags);
      } catch (error) {
        console.error("Error generating transaction SSR content:", error);
        // Fallback to generic tags with redirect
        const redirectScript = generateTransactionRedirectScript(
          transactionId,
          req,
        );
        const ogTags = `
<title>DLLM Library Transaction</title>
<meta name="description" content="View this transaction in the DLLM Library." />
<meta property="og:title" content="DLLM Library Transaction" />
<meta property="og:description" content="View this transaction in the DLLM Library." />
<meta property="og:type" content="website" />
<meta property="og:url" content="${getBaseUrl()}/transaction/${transactionId}" />
<meta property="og:image" content="${getLogoUrl()}" />
${redirectScript}
        `;
        renderHtmlWithOgTags(res, htmlData, ogTags);
      }
    });
  } catch (error) {
    console.error("Error in transaction SSR route:", error);
    res.status(500).send("Server error");
  }
};

/**
 * Handle item detail page SSR
 */
export const handleItemDetailSSR = async (req: Request, res: Response) => {
  try {
    const itemId = req.params.id;
    const indexPath = path.join(__dirname, "..", "index.html");

    // Read the HTML template
    readFile(indexPath, "utf8", async (err, htmlData) => {
      if (err) {
        console.error("Error reading index.html from functions folder.", err);
        return res.status(500).send("Could not load the page.");
      }

      try {
        // Get item data from Firestore
        const item = await itemService.itemById(itemId);
        if (item === null) {
          // If item doesn't exist, still render the page but with generic OG tags and redirect
          const redirectScript = generateRedirectScript(itemId, req);
          const ogTags = `
<title>Item Not Found - DLLM Library</title>
<meta name="description" content="The requested item could not be found." />
<meta property="og:title" content="Item Not Found - DLLM Library" />
<meta property="og:description" content="The requested item could not be found." />
<meta property="og:type" content="website" />
<meta property="og:url" content="${getBaseUrl()}/item/${itemId}" />
<meta property="og:image" content="${getLogoUrl()}" />
${redirectScript}
                    `;
          renderHtmlWithOgTags(res, htmlData, ogTags);
          return;
        }

        // Get item data
        const itemName = item.name;
        const itemDescription = item.description || "No description available";
        const itemStatus = item.status;

        // Get thumbnail or image URL
        let imageUrl = getLogoUrl(); // Default image
        if (item.thumbnails && item.thumbnails.length > 0) {
          imageUrl = item.thumbnails[0];
        } else if (item?.images && item.images.length > 0) {
          imageUrl = item.images[0];
        }

        // Create Open Graph tags with a client-side redirection script
        const redirectScript = generateRedirectScript(itemId, req);

        // Create an enhanced description with status
        const enhancedDescription = `${itemDescription.substring(0, 120)}${
          itemDescription.length > 120 ? "..." : ""
        } | Status: ${itemStatus}`;

        const ogTags = `
<title>${itemName} - DLLM Library</title>
<meta name="description" content="${enhancedDescription}" />
<meta property="og:title" content="${itemName} - DLLM Library" />
<meta property="og:description" content="${enhancedDescription}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${getBaseUrl()}/item/${itemId}" />
<meta property="og:image" content="${imageUrl}" />
<meta property="article:section" content="Status: ${itemStatus}" />
${redirectScript}
                `;

        renderHtmlWithOgTags(res, htmlData, ogTags);
      } catch (error) {
        console.error("Error generating item SSR content:", error);
        // Fallback to generic tags with redirect
        const redirectScript = generateRedirectScript(itemId, req);
        const ogTags = `
<title>DLLM Library Item</title>
<meta name="description" content="View this item in the DLLM Library." />
<meta property="og:title" content="DLLM Library Item" />
<meta property="og:description" content="View this item in the DLLM Library." />
<meta property="og:type" content="website" />
<meta property="og:url" content="${getBaseUrl()}/item/${itemId}" />
<meta property="og:image" content="${getLogoUrl()}" />
${redirectScript}
                `;
        renderHtmlWithOgTags(res, htmlData, ogTags);
      }
    });
  } catch (error) {
    console.error("Error in item SSR route:", error);
    res.status(500).send("Server error");
  }
};

/**
 * Handle binder detail page SSR
 */
export const handleBinderDetailSSR = async (req: Request, res: Response) => {
  try {
    const binderId = req.params.id;
    const indexPath = path.join(__dirname, "..", "index.html");

    // Read the HTML template
    readFile(indexPath, "utf8", async (err, htmlData) => {
      if (err) {
        console.error("Error reading index.html from functions folder.", err);
        return res.status(500).send("Could not load the page.");
      }

      try {
        // Get binder data from Firestore
        const binder = await binderService.binder(binderId);
        if (binder === null) {
          // If binder doesn't exist, still render the page but with generic OG tags and redirect
          const redirectScript = generateBinderRedirectScript(binderId, req);
          const ogTags = `
<title>Binder Not Found - DLLM Library</title>
<meta name="description" content="The requested binder could not be found." />
<meta property="og:title" content="Binder Not Found - DLLM Library" />
<meta property="og:description" content="The requested binder could not be found." />
<meta property="og:type" content="website" />
<meta property="og:url" content="${getBaseUrl()}/binder/${binderId}" />
<meta property="og:image" content="${getLogoUrl()}" />
${redirectScript}
          `;
          renderHtmlWithOgTags(res, htmlData, ogTags);
          return;
        }

        // Get binder data
        const binderName = binder.name;
        const binderDescription =
          binder.description || "No description available";
        const ownerName =
          binder.owner?.nickname || binder.owner?.email || "Unknown Owner";
        const bindedCount = binder.bindedCount || 0;

        // Get thumbnail or image URL
        let imageUrl = getLogoUrl(); // Default image
        if (binder.thumbnails && binder.thumbnails.length > 0) {
          imageUrl = binder.thumbnails[0];
        } else if (binder.images && binder.images.length > 0) {
          imageUrl = binder.images[0];
        }

        // Create Open Graph tags with a client-side redirection script
        const redirectScript = generateBinderRedirectScript(binderId, req);

        // Create an enhanced description with item count and owner
        const enhancedDescription = `${binderDescription.substring(0, 120)}${
          binderDescription.length > 120 ? "..." : ""
        } | ${bindedCount} item(s) | By: ${ownerName}`;

        const ogTags = `
<title>${binderName} - DLLM Library</title>
<meta name="description" content="${enhancedDescription}" />
<meta property="og:title" content="${binderName} - DLLM Library" />
<meta property="og:description" content="${enhancedDescription}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${getBaseUrl()}/binder/${binderId}" />
<meta property="og:image" content="${imageUrl}" />
${redirectScript}
        `;

        renderHtmlWithOgTags(res, htmlData, ogTags);
      } catch (error) {
        console.error("Error generating binder SSR content:", error);
        // Fallback to generic tags with redirect
        const redirectScript = generateBinderRedirectScript(binderId, req);
        const ogTags = `
<title>DLLM Library Binder</title>
<meta name="description" content="View this binder in the DLLM Library." />
<meta property="og:title" content="DLLM Library Binder" />
<meta property="og:description" content="View this binder in the DLLM Library." />
<meta property="og:type" content="website" />
<meta property="og:url" content="${getBaseUrl()}/binder/${binderId}" />
<meta property="og:image" content="${getLogoUrl()}" />
${redirectScript}
        `;
        renderHtmlWithOgTags(res, htmlData, ogTags);
      }
    });
  } catch (error) {
    console.error("Error in binder SSR route:", error);
    res.status(500).send("Server error");
  }
};
