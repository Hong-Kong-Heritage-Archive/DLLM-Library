import { Request } from 'express';

/**
 * List of known bot user agents for social media crawlers and search engines
 */
const BOT_USER_AGENTS = [
  // Social Media Crawlers
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'WhatsApp',
  'TelegramBot',
  'LinkedInBot',
  'SkypeUriPreview',
  'SlackBot',
  'DiscordBot',
  
  // Search Engine Crawlers
  'Googlebot',
  'Bingbot',
  'Slurp', // Yahoo
  'DuckDuckBot',
  'Baiduspider',
  'YandexBot',
  'Applebot',
  
  // Other crawlers
  'ia_archiver', // Internet Archive
  'Wayback',
  'archive.org_bot',
  'SemrushBot',
  'AhrefsBot',
  'MJ12bot',
  'DotBot',
  'Sogou',
  
  // Preview generators
  'PreviewBot',
  'preview',
  'crawler',
  'spider',
  'bot',
];

/**
 * Detects if the request is from a bot/crawler
 */
export function isBotRequest(req: Request): boolean {
  const userAgent = req.get('User-Agent') || '';
  
  // Check for bot patterns in user agent
  const isBot = BOT_USER_AGENTS.some(botPattern => 
    userAgent.toLowerCase().includes(botPattern.toLowerCase())
  );
  
  // Additional checks
  const hasPreloadHeader = req.get('X-Purpose') === 'preview';
  const hasEmbedHeader = req.get('X-Purpose') === 'embed';
  const isHeadRequest = req.method === 'HEAD';
  
  console.log(`Bot Detection - User Agent: ${userAgent}, Is Bot: ${isBot}, Method: ${req.method}`);
  
  return isBot || hasPreloadHeader || hasEmbedHeader || isHeadRequest;
}

/**
 * Gets the bot type for logging purposes
 */
export function getBotType(req: Request): string {
  const userAgent = req.get('User-Agent') || '';
  
  for (const botPattern of BOT_USER_AGENTS) {
    if (userAgent.toLowerCase().includes(botPattern.toLowerCase())) {
      return botPattern;
    }
  }
  
  return 'unknown';
}
