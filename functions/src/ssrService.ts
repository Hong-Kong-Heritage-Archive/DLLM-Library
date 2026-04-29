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

type BrandingConfig = {
  appTitle: string;
  appDescription: string;
  logoPath: string;
  ogImagePath: string;
};

const defaultBranding: BrandingConfig = {
  appTitle: "Book Guide - Staging",
  appDescription: "Decentralized Local Library Module",
  logoPath: "/logo512.png",
  ogImagePath: "/logo512.png",
};

//let cachedConfig: Record<string, any> | null = null;
let cachedConfig: any = null;

// Get Config

//const getConfig = (): Record<string, any> => {
const getConfig = () => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const candidatePaths = [
    path.join(
      process.cwd(),
      "..",
      "client",
      "public",
      "dllm-client-config.json",
    ),
    path.join(process.cwd(), "dllm-client-config.json"),
    path.join(process.cwd(), "dist", "dllm-client-config.json"),
    path.join(process.cwd(), "lib", "dllm-client-config.json"),
    path.join(__dirname, "..", "dllm-client-config.json"),
    path.join(__dirname, "..", "dist", "dllm-client-config.json"),
  ];

  try {
    for (const configPath of candidatePaths) {
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, "utf8");
        const parsedConfig = JSON.parse(configData);

        cachedConfig = parsedConfig || {};
        if (!cachedConfig.baseUrl) {
          cachedConfig.baseUrl = "${getBaseUrl()}";
        }
        if (!cachedConfig.branding) {
          cachedConfig.branding = defaultBranding;
        }

        return cachedConfig;
      }
    }
    console.warn(
      `Config file not found in any candidate path: ${candidatePaths.join(", ")}`,
    );
  } catch (error) {
    console.error("Error reading client config:", error);
  }

  cachedConfig = { baseUrl: "${getBaseUrl()}", branding: defaultBranding };
  return cachedConfig;
};

// Get base URL
const getBaseUrl = () => {
  const config = getConfig();
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  return config.baseUrl || "http://localhost:3000";
};

const toAbsoluteUrl = (url: string): string => {
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("//")
  ) {
    return url;
  }

  const baseUrl = getBaseUrl();
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

const getBranding = (): BrandingConfig => {
  const config = getConfig();
  const branding = config.branding || {};

  return {
    appTitle: branding.appTitle || defaultBranding.appTitle,
    appDescription: branding.appDescription || defaultBranding.appDescription,
    logoPath: branding.logoPath || defaultBranding.logoPath,
    ogImagePath:
      branding.ogImagePath || branding.logoPath || defaultBranding.ogImagePath,
  };
};

// Get logo URL
const getLogoUrl = (): string => {
  return toAbsoluteUrl(getBranding().ogImagePath);
};

const formatBrandTitle = (prefix?: string): string => {
  const brandTitle = getBranding().appTitle;
  return prefix ? `${prefix} - ${brandTitle}` : brandTitle;
};

const defaultBrandDescription = (): string => getBranding().appDescription;

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

    const newTitle = formatBrandTitle();
    const newDescription = defaultBrandDescription();
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
<title>${formatBrandTitle("User Not Found")}</title>
<meta name="description" content="The requested user profile could not be found." />
<meta property="og:title" content="${formatBrandTitle("User Not Found")}" />
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
<title>${formatBrandTitle(userName)}</title>
<meta name="description" content="${enhancedDescription}" />
<meta property="og:title" content="${formatBrandTitle(userName)}" />
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
<title>${formatBrandTitle("User")}</title>
<meta name="description" content="View this user profile in ${getBranding().appTitle}." />
<meta property="og:title" content="${formatBrandTitle("User")}" />
<meta property="og:description" content="View this user profile in ${getBranding().appTitle}." />
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
<title>${formatBrandTitle("Transaction Not Found")}</title>
<meta name="description" content="The requested transaction could not be found." />
<meta property="og:title" content="${formatBrandTitle("Transaction Not Found")}" />
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
<title>${formatBrandTitle(`Transaction: ${itemName}`)}</title>
<meta name="description" content="${transactionDescription}" />
<meta property="og:title" content="${formatBrandTitle(`Transaction: ${itemName}`)}" />
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
<title>${formatBrandTitle("Transaction")}</title>
<meta name="description" content="View this transaction in ${getBranding().appTitle}." />
<meta property="og:title" content="${formatBrandTitle("Transaction")}" />
<meta property="og:description" content="View this transaction in ${getBranding().appTitle}." />
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
        const item = await itemService.itemById(null, itemId, true);
        if (item === null) {
          // If item doesn't exist, still render the page but with generic OG tags and redirect
          const redirectScript = generateRedirectScript(itemId, req);
          const ogTags = `
<title>${formatBrandTitle("Item Not Found")}</title>
<meta name="description" content="The requested item could not be found." />
<meta property="og:title" content="${formatBrandTitle("Item Not Found")}" />
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
<title>${formatBrandTitle(itemName)}</title>
<meta name="description" content="${enhancedDescription}" />
<meta property="og:title" content="${formatBrandTitle(itemName)}" />
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
<title>${formatBrandTitle("Item")}</title>
<meta name="description" content="View this item in ${getBranding().appTitle}." />
<meta property="og:title" content="${formatBrandTitle("Item")}" />
<meta property="og:description" content="View this item in ${getBranding().appTitle}." />
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
<title>${formatBrandTitle("Binder Not Found")}</title>
<meta name="description" content="The requested binder could not be found." />
<meta property="og:title" content="${formatBrandTitle("Binder Not Found")}" />
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
<title>${formatBrandTitle(binderName)}</title>
<meta name="description" content="${enhancedDescription}" />
<meta property="og:title" content="${formatBrandTitle(binderName)}" />
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
<title>${formatBrandTitle("Binder")}</title>
<meta name="description" content="View this binder in ${getBranding().appTitle}." />
<meta property="og:title" content="${formatBrandTitle("Binder")}" />
<meta property="og:description" content="View this binder in ${getBranding().appTitle}." />
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
