import { Link } from "@mui/material";

export const convertLinksToClickable = (text: string) => {
  // Regex components for matching URLs with or without protocols
  // Match protocol (http, https, ftp) or www.
  const protocolPattern = "(?:https?:\\/\\/|ftp:\\/\\/|www\\.)";
  // Match the main part of the URL (no spaces or certain punctuation)
  const mainUrlPattern = "[^\\s<>()[\\]{}'\\\"]+";
  // Match domain names (e.g., example.com)
  const domainLabel = "[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?";
  const tldPattern = "(\\.[a-zA-Z]{2,})+";
  // Match any additional path/query after the domain
  const extraPattern = "([^\\s<>()[\\]{}'\\\"]*)?";
  // Combine for URLs with protocol
  const urlWithProtocol = `(${protocolPattern}${mainUrlPattern})`;
  // Combine for URLs without protocol (just domain)
  const urlWithoutProtocol = `(${domainLabel}${tldPattern}${extraPattern})`;
  // Final regex: match either with protocol or just domain
  const urlRegex = new RegExp(`${urlWithProtocol}|${urlWithoutProtocol}`, "gi");
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    // Reset regex for testing individual parts
    const testRegex = new RegExp(`${urlWithProtocol}|${urlWithoutProtocol}`, "gi");
    // Reset lastIndex for global regex before testing individual parts
    testRegex.lastIndex = 0;
    if (testRegex.test(part)) {
      let href = part;

      // Add protocol if missing
      if (!part.match(/^https?:\/\//i)) {
        if (part.match(/^www\./i)) {
          href = `https://${part}`;
        } else if (part.match(/^ftp\./i)) {
          href = `https://${part}`;
        } else if (part.includes('.')) {
          // If it contains a dot but no protocol, assume https
          href = `https://${part}`;
        }
      }

      return (
        <Link
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            wordBreak: 'break-all',
            color: 'primary.main',
            textDecoration: 'underline',
            '&:hover': {
              textDecoration: 'underline',
              opacity: 0.8,
            }
          }}
        >
          {part}
        </Link>
      );
    }
    return part;
  });
};