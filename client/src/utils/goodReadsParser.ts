/**
 * Utility for parsing GoodReads CSV export files.
 *
 * GoodReads CSV columns typically include:
 *   Book Id, Title, Author, Author l-f, Additional Authors,
 *   ISBN, ISBN13, My Rating, Average Rating, Publisher,
 *   Binding, Number of Pages, Year Published, Original Publication Year,
 *   Date Read, Date Added, Bookshelves, ...
 *
 * We extract: Title, Author, Publisher.
 */

export interface GoodReadsBook {
  title: string;
  author: string;
  publisher: string;
  isbn?: string;
  isbn13?: string;
  publishedYear?: string;
}

/**
 * Parse a raw CSV string (GoodReads export) into an array of books.
 * Handles quoted fields that may contain commas and newlines.
 */
export function parseGoodReadsCsv(
  csvText: string,
  display: boolean,
): GoodReadsBook[] {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const titleIdx = header.findIndex((h) => h === "title");
  const authorIdx = header.findIndex((h) => h === "author");
  const publisherIdx = header.findIndex((h) => h === "publisher");
  const isbnIdx = header.findIndex((h) => h === "isbn");
  const isbn13Idx = header.findIndex((h) => h === "isbn13");
  const publishedYearIdx = header.findIndex(
    (h) => h === "year published" || h === "published year",
  );

  if (titleIdx === -1) {
    throw new Error(
      "CSV does not contain a 'Title' column. Is this a GoodReads export?",
    );
  }

  const books: GoodReadsBook[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || (row.length === 1 && row[0].trim() === ""))
      continue;

    if (display) {
      books.push({
        title: row[titleIdx]?.trim() ?? "",
        author: authorIdx !== -1 ? (row[authorIdx]?.trim() ?? "") : "",
        publisher: publisherIdx !== -1 ? (row[publisherIdx]?.trim() ?? "") : "",
      });
    } else {
      let isbn: string = isbnIdx !== -1 ? (row[isbnIdx]?.trim() ?? "") : "";
      let isbn13: string =
        isbn13Idx !== -1 ? (row[isbn13Idx]?.trim() ?? "") : "";
      if (isbn[0] === "=") {
        isbn = isbn.slice(1).replace(/"/g, "");
      }
      if (isbn13[0] === "=") {
        isbn13 = isbn13.slice(1).replace(/"/g, "");
      }
      books.push({
        title: row[titleIdx]?.trim() ?? "",
        author: authorIdx !== -1 ? (row[authorIdx]?.trim() ?? "") : "",
        publisher: publisherIdx !== -1 ? (row[publisherIdx]?.trim() ?? "") : "",
        // Optional: You could also include ISBN and published year if desired
        isbn: isbn,
        isbn13: isbn13,
        publishedYear:
          publishedYearIdx !== -1 ? (row[publishedYearIdx]?.trim() ?? "") : "",
      });
    }
  }

  return books;
}

/**
 * RFC 4180-compliant CSV row parser.
 * Handles quoted fields with embedded commas, quotes, and newlines.
 */
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const { row, nextIndex } = parseRow(text, i);
    rows.push(row);
    i = nextIndex;
  }

  return rows;
}

function parseRow(
  text: string,
  start: number,
): { row: string[]; nextIndex: number } {
  const fields: string[] = [];
  let i = start;
  const len = text.length;

  while (i < len) {
    if (text[i] === '"') {
      // Quoted field
      const { value, nextIndex } = parseQuotedField(text, i);
      fields.push(value);
      i = nextIndex;
    } else if (text[i] === ",") {
      fields.push("");
      i++;
    } else if (text[i] === "\n" || text[i] === "\r") {
      // End of row
      i++;
      if (i < len && text[i - 1] === "\r" && text[i] === "\n") i++;
      return { row: fields, nextIndex: i };
    } else {
      // Unquoted field
      let end = i;
      while (
        end < len &&
        text[end] !== "," &&
        text[end] !== "\n" &&
        text[end] !== "\r"
      ) {
        end++;
      }
      fields.push(text.substring(i, end));
      i = end;
    }

    // After a field, expect comma or end-of-row
    if (i < len && text[i] === ",") {
      i++;
      // If comma is at end of text/row, add empty trailing field
      if (i >= len || text[i] === "\n" || text[i] === "\r") {
        fields.push("");
      }
    } else if (i < len && (text[i] === "\n" || text[i] === "\r")) {
      i++;
      if (i < len && text[i - 1] === "\r" && text[i] === "\n") i++;
      return { row: fields, nextIndex: i };
    }
  }

  return { row: fields, nextIndex: i };
}

function parseQuotedField(
  text: string,
  start: number,
): { value: string; nextIndex: number } {
  let i = start + 1; // skip opening quote
  let value = "";
  const len = text.length;

  while (i < len) {
    if (text[i] === '"') {
      if (i + 1 < len && text[i + 1] === '"') {
        // Escaped quote
        value += '"';
        i += 2;
      } else {
        // End of quoted field
        i++; // skip closing quote
        return { value, nextIndex: i };
      }
    } else {
      value += text[i];
      i++;
    }
  }

  return { value, nextIndex: i };
}
