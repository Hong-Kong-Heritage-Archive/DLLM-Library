import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate, useOutletContext } from "react-router-dom";
import { gql, useLazyQuery, useMutation } from "@apollo/client";
import { GoodReadsBook, parseGoodReadsCsv } from "../utils/goodReadsParser";
import { User, Item } from "../generated/graphql";
import PaginationControls from "../components/PaginationControls";

interface OutletContext {
  user?: User;
}

const DUPLICATE_TITLES_QUERY = gql`
  query DuplicateTitlesByUser($userId: ID!, $names: [String!]!) {
    duplicateTitlesByUser(userId: $userId, names: $names)
  }
`;

const CREATE_ITEMS_FROM_JSON = gql`
  mutation CreateItemsFromJSON($bookJson: [String!]!, $deposit: Int! = 0) {
    createItemsFromJSON(bookJson: $bookJson, deposit: $deposit) {
      id
      name
    }
  }
`;

const PAGE_SIZE = 20;

interface BookRow extends GoodReadsBook {
  selected: boolean;
  existing: boolean;
  imported: boolean;
}

const GoodReadsImport: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useOutletContext<OutletContext>();
  const [books, setBooks] = useState<BookRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [importedPages, setImportedPages] = useState<Set<number>>(new Set());
  const [rawCsvText, setRawCsvText] = useState<string>("");

  const [fetchDuplicates] = useLazyQuery<{
    duplicateTitlesByUser: string[];
  }>(DUPLICATE_TITLES_QUERY, { fetchPolicy: "network-only" });

  const [createItemsFromJSON] = useMutation<{
    createItemsFromJSON: Item[];
  }>(CREATE_ITEMS_FROM_JSON);

  // Pagination derived values
  const totalPages = Math.ceil(books.length / PAGE_SIZE);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, books.length);
  const pageBooks = useMemo(
    () => books.slice(pageStart, pageEnd),
    [books, pageStart, pageEnd],
  );

  const pageSelectedCount = pageBooks.filter((b) => b.selected).length;
  const totalSelectedCount = books.filter((b) => b.selected).length;
  const existingCount = books.filter((b) => b.existing).length;
  const isCurrentPageImported = importedPages.has(currentPage);

  // Check if all pages have been processed
  const allPagesImported = useMemo(() => {
    if (totalPages === 0) return false;
    for (let p = 1; p <= totalPages; p++) {
      if (!importedPages.has(p)) return false;
    }
    return true;
  }, [importedPages, totalPages]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setError(null);
      setLoading(true);
      setImportedPages(new Set());
      setCurrentPage(1);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          setRawCsvText(text);
          const parsed = parseGoodReadsCsv(text, true);

          // Check for duplicates if user is logged in
          let existingNames = new Set<string>();
          if (user?.id && parsed.length > 0) {
            setCheckingDuplicates(true);
            try {
              // Batch in groups of 10 (Firestore "in" query limit)
              const allTitles = parsed.map((b) => b.title);
              const batchSize = 10;
              for (let i = 0; i < allTitles.length; i += batchSize) {
                const batch = allTitles.slice(i, i + batchSize);
                const { data } = await fetchDuplicates({
                  variables: { userId: user.id, names: batch },
                });
                if (data?.duplicateTitlesByUser) {
                  console.log(
                    "Existing titles in batch:",
                    data.duplicateTitlesByUser,
                  );
                  data.duplicateTitlesByUser.forEach((name) =>
                    existingNames.add(name),
                  );
                }
              }
            } catch (dupErr) {
              console.warn("Failed to check duplicates:", dupErr);
            } finally {
              setCheckingDuplicates(false);
            }
          }

          setBooks(
            parsed.map((b) => {
              const isExisting = existingNames.has(b.title);
              return {
                ...b,
                selected: !isExisting,
                existing: isExisting,
                imported: false,
              };
            }),
          );
        } catch (err: any) {
          setError(err.message ?? "Failed to parse CSV file.");
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read file.");
        setLoading(false);
      };
      reader.readAsText(file);
    },
    [user, fetchDuplicates],
  );

  const toggleSelect = (globalIndex: number) => {
    setBooks((prev) =>
      prev.map((b, i) =>
        i === globalIndex ? { ...b, selected: !b.selected } : b,
      ),
    );
  };

  const toggleSelectAllPage = () => {
    const allPageSelected = pageBooks.every((b) => b.selected);
    setBooks((prev) =>
      prev.map((b, i) =>
        i >= pageStart && i < pageEnd
          ? { ...b, selected: !allPageSelected }
          : b,
      ),
    );
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleImport = async () => {
    const pageBooksSelected = books
      .slice(pageStart, pageEnd)
      .filter((b) => b.selected);

    if (pageBooksSelected.length === 0) return;

    setImporting(true);
    setError(null);

    try {
      // Re-parse CSV with full data (isbn, isbn13, publishedYear) for the selected titles
      const fullParsed = parseGoodReadsCsv(rawCsvText, false);
      const selectedTitles = new Set(pageBooksSelected.map((b) => b.title));

      // Build JSON strings for each selected book
      const bookJsonArr = fullParsed
        .filter((b) => selectedTitles.has(b.title))
        .map((b) =>
          JSON.stringify({
            title: b.title,
            author: b.author,
            publisher: b.publisher,
            isbn: b.isbn || "",
            isbn13: b.isbn13 || "",
            publishedYear: b.publishedYear || "",
          }),
        );

      await createItemsFromJSON({
        variables: { bookJson: bookJsonArr, deposit: 0 },
      });

      // Mark current-page books as imported
      setBooks((prev) =>
        prev.map((b, i) =>
          i >= pageStart && i < pageEnd && b.selected
            ? { ...b, imported: true }
            : b,
        ),
      );

      setImportedPages((prev) => new Set(prev).add(currentPage));
    } catch (err: any) {
      setError(
        err.message ?? t("goodreads.importError", "Failed to import books."),
      );
    } finally {
      setImporting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t("goodreads.title", "Import from GoodReads")}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t(
          "goodreads.instructions",
          "Upload your GoodReads CSV export file to import books. You can export your library from GoodReads under My Books → Import and export → Export Library.",
        )}
      </Typography>

      {/* File picker */}
      {books.length === 0 && !loading && !checkingDuplicates && (
        <Box sx={{ mb: 3 }}>
          <Button variant="contained" component="label">
            {t("goodreads.selectFile", "Select CSV File")}
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={handleFileChange}
            />
          </Button>
        </Box>
      )}

      {(loading || checkingDuplicates || importing) && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            py: 6,
          }}
        >
          <CircularProgress />
          {checkingDuplicates && (
            <Typography variant="body2" color="text.secondary">
              {t(
                "goodreads.checkingDuplicates",
                "Checking for existing books...",
              )}
            </Typography>
          )}
          {importing && (
            <Typography variant="body2" color="text.secondary">
              {t("goodreads.importing", "Importing books...")}
            </Typography>
          )}
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isCurrentPageImported && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t(
            "goodreads.pageImportSuccess",
            "Page {{page}} imported successfully!",
            { page: currentPage },
          )}
        </Alert>
      )}

      {allPagesImported && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t(
            "goodreads.allImported",
            "All pages have been imported! You can now go back.",
          )}
        </Alert>
      )}

      {/* Table */}
      {books.length > 0 && (
        <>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {t(
              "goodreads.booksFound",
              "{{total}} book(s) found, {{selected}} selected",
              {
                total: books.length,
                selected: totalSelectedCount,
              },
            )}
            {existingCount > 0 && (
              <>
                {" — "}
                {t(
                  "goodreads.existingCount",
                  "{{count}} already in your library",
                  { count: existingCount },
                )}
              </>
            )}
          </Typography>

          {/* Pagination top */}
          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              onPageChange={handlePageChange}
              hasNextPage={currentPage < totalPages}
              hasPrevPage={currentPage > 1}
              itemsPerPage={PAGE_SIZE}
              totalItems={books.length}
              showPageInfo
            />
          )}

          <TableContainer component={Paper} sx={{ maxHeight: "60vh", mt: 1 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        pageSelectedCount > 0 &&
                        pageSelectedCount < pageBooks.length
                      }
                      checked={
                        pageBooks.length > 0 &&
                        pageSelectedCount === pageBooks.length
                      }
                      onChange={toggleSelectAllPage}
                      disabled={isCurrentPageImported}
                    />
                  </TableCell>
                  <TableCell>{t("goodreads.columnStatus", "Status")}</TableCell>
                  <TableCell>{t("goodreads.columnTitle", "Title")}</TableCell>
                  <TableCell>{t("goodreads.columnAuthor", "Author")}</TableCell>
                  <TableCell>
                    {t("goodreads.columnPublisher", "Publisher")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageBooks.map((book, idx) => {
                  const globalIdx = pageStart + idx;
                  return (
                    <TableRow
                      key={globalIdx}
                      hover
                      onClick={() => !book.imported && toggleSelect(globalIdx)}
                      sx={{
                        cursor: book.imported ? "default" : "pointer",
                        opacity: book.imported ? 0.6 : 1,
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={book.selected}
                          disabled={book.imported}
                        />
                      </TableCell>
                      <TableCell>
                        {book.imported ? (
                          <Chip
                            label={t("goodreads.imported", "Imported")}
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        ) : book.existing ? (
                          <Chip
                            label={t("goodreads.existing", "Existing")}
                            color="warning"
                            size="small"
                            variant="outlined"
                          />
                        ) : null}
                      </TableCell>
                      <TableCell>{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>{book.publisher}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination bottom */}
          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              onPageChange={handlePageChange}
              hasNextPage={currentPage < totalPages}
              hasPrevPage={currentPage > 1}
              itemsPerPage={PAGE_SIZE}
              totalItems={books.length}
              showPageInfo
            />
          )}

          {/* Action buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 2,
              mt: 3,
            }}
          >
            {totalPages > 1 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mr: "auto" }}
              >
                {t(
                  "goodreads.pagesImported",
                  "{{done}} of {{total}} page(s) imported",
                  {
                    done: importedPages.size,
                    total: totalPages,
                  },
                )}
              </Typography>
            )}
            <Button variant="outlined" onClick={handleCancel}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={handleImport}
              disabled={
                pageSelectedCount === 0 || isCurrentPageImported || importing
              }
            >
              {importing
                ? t("goodreads.importing", "Importing books...")
                : `${t("goodreads.import", "Import")} (${pageSelectedCount})`}
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
};

export default GoodReadsImport;
