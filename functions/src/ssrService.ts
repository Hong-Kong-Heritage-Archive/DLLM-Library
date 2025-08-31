import { Request, Response } from 'express';
import { readFile } from 'fs';
import path from 'path';
import { db } from './platform';
import * as fs from 'fs';
import { isBotRequest, getBotType } from './botDetection';
// Get Config
const getConfig = () => {
  const clientConfigPath = path.join(process.cwd(), '..', 'client', 'public', 'dllm-client-config.json');
  try {
    if (fs.existsSync(clientConfigPath)) {
      const configData = fs.readFileSync(clientConfigPath, 'utf8');
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error('Error reading client config:', error);
  }
  return { baseUrl: '${getBaseUrl()}' };
};

// Get base URL
const getBaseUrl = () => {
  const config = getConfig();

  // Check if we're running behind ngrok
  const ngrokUrl = process.env.NGROK_URL;

  if (ngrokUrl) {
    return ngrokUrl;
  }

  return process.env.NODE_ENV === 'production'
    ? config.baseUrl
    : 'http://localhost:3000';
};

// Get logo URL
const getLogoUrl = (): string => {
  return `${getBaseUrl()}/logo512.png`;
};

/**
 * Helper function to render HTML with Open Graph tags
 */
export const renderHtmlWithOgTags = (res: Response, htmlData: string, ogTags: string) => {
  let modifiedHtml = htmlData
    .replace(/<title>.*?<\/title>/, '')
    .replace(/<meta name="description" content=".*?"\s*\/?>/, '');

  modifiedHtml = modifiedHtml.replace('</head>', `${ogTags}</head>`);
  res.setHeader('Content-Type', 'text/html');
  res.send(modifiedHtml);
};

/**
 * Handle home page SSR
 */
export const handleHomePageSSR = (req: Request, res: Response) => {
  const indexPath = path.join(__dirname, '..', 'index.html');
  readFile(indexPath, 'utf8', (err, htmlData) => {
    if (err) {
      console.error('Error reading index.html from functions folder. Make sure it is copied during the build.', err);
      return res.status(500).send('Could not load the page.');
    }

    const newTitle = "無大台 Decentralized Local Library Module";
    const newDescription = "墨爾本・無大台圖書館模組";
    const newImageUrl = getLogoUrl();

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
        `;

    renderHtmlWithOgTags(res, htmlData, ogTags);
  });
};

/**
 * Generate client-side redirection script
 */
const generateRedirectScript = (itemId: string) => {
  return `
<!-- Client detection and redirection script -->
<script type="text/javascript">
  // Check if this is a real browser (not a crawler)
  function isBrowserNotCrawler() {
    const userAgent = navigator.userAgent.toLowerCase();
    return !(
      userAgent.includes('bot') ||
      userAgent.includes('crawler') ||
      userAgent.includes('spider') ||
      userAgent.includes('facebookexternalhit') ||
      userAgent.includes('twitterbot') ||
      userAgent.includes('whatsapp') ||
      userAgent.includes('telegrambot') ||
      userAgent.includes('linkedinbot') ||
      userAgent.includes('slack')
    );
  }
  
  // Redirect real browsers to the frontend app
  if (isBrowserNotCrawler()) {
    // Check if we're not already on the frontend app
    if (window.location.href.indexOf('/graphql') > -1 || window.location.href.indexOf(':4000') > -1 || window.location.href.indexOf('ngrok') > -1 || window.location.href.indexOf(':5002') > -1) {
      // If we're on the SSR server, redirect to the frontend app
      window.location.href = '${getBaseUrl()}/item/${itemId}';
    }
  }
</script>
    `;
};

/**
 * Handle item detail page SSR
 */
export const handleItemDetailSSR = async (req: Request, res: Response) => {
  try {
    const itemId = req.params.id;
    const indexPath = path.join(__dirname, '..', 'index.html');

    // Read the HTML template
    readFile(indexPath, 'utf8', async (err, htmlData) => {
      if (err) {
        console.error('Error reading index.html from functions folder.', err);
        return res.status(500).send('Could not load the page.');
      }

      try {
        // Get item data from Firestore
        const itemDoc = await db.collection("items").doc(itemId).get();
        if (!itemDoc.exists) {
          // If item doesn't exist, still render the page but with generic OG tags and redirect
          const redirectScript = generateRedirectScript(itemId);
          const ogTags = `
<title>Item Not Found - 20 Minutes Library</title>
<meta name="description" content="The requested item could not be found." />
<meta property="og:title" content="Item Not Found - 20 Minutes Library" />
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
        const itemData = itemDoc.data();
        const itemName = itemData?.name || 'Item';
        const itemDescription = itemData?.description || 'No description available';
        const itemStatus = itemData?.status || 'Unknown';

        // Get thumbnail or image URL
        let imageUrl = getLogoUrl(); // Default image
        if (itemData?.thumbnails && itemData.thumbnails.length > 0) {
          imageUrl = itemData.thumbnails[0];
        } else if (itemData?.images && itemData.images.length > 0) {
          imageUrl = itemData.images[0];
        }

        // Create Open Graph tags with a client-side redirection script
        const redirectScript = generateRedirectScript(itemId);

        // Create an enhanced description with status
        const enhancedDescription = `${itemDescription.substring(0, 120)}${itemDescription.length > 120 ? '...' : ''} | Status: ${itemStatus}`;

        const ogTags = `
<title>${itemName} - 20 Minutes Library</title>
<meta name="description" content="${enhancedDescription}" />
<meta property="og:title" content="${itemName} - 20 Minutes Library" />
<meta property="og:description" content="${enhancedDescription}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${getBaseUrl()}/item/${itemId}" />
<meta property="og:image" content="${imageUrl}" />
<meta property="article:section" content="Status: ${itemStatus}" />
${redirectScript}
                `;

        renderHtmlWithOgTags(res, htmlData, ogTags);

      } catch (error) {
        console.error('Error generating item SSR content:', error);
        // Fallback to generic tags with redirect
        const redirectScript = generateRedirectScript(itemId);
        const ogTags = `
<title>20 Minutes Library Item</title>
<meta name="description" content="View this item in the 20 Minutes Library." />
<meta property="og:title" content="20 Minutes Library Item" />
<meta property="og:description" content="View this item in the 20 Minutes Library." />
<meta property="og:type" content="website" />
<meta property="og:url" content="${getBaseUrl()}/item/${itemId}" />
<meta property="og:image" content="${getLogoUrl()}" />
${redirectScript}
                `;
        renderHtmlWithOgTags(res, htmlData, ogTags);
      }
    });
  } catch (error) {
    console.error('Error in item SSR route:', error);
    res.status(500).send('Server error');
  }
};
