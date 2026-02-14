import React, { useState, useCallback, useRef } from "react";
import {
  Box,
  Button,
  Checkbox,
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
import { useNavigate } from "react-router-dom";
import { GoodReadsBook, parseGoodReadsCsv } from "../utils/goodReadsParser";

interface BookRow extends GoodReadsBook {
  selected: boolean;
}

const GoodReadsImport: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [books, setBooks] = useState<BookRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setError(null);
      setLoading(true);
      setImported(false);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsed = parseGoodReadsCsv(text);
          setBooks(parsed.map((b) => ({ ...b, selected: true })));
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
    [],
  );

  const toggleSelect = (index: number) => {
    setBooks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, selected: !b.selected } : b)),
    );
  };

  const toggleSelectAll = () => {
    const allSelected = books.every((b) => b.selected);
    setBooks((prev) => prev.map((b) => ({ ...b, selected: !allSelected })));
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleImport = () => {
    const selected = books.filter((b) => b.selected);
    // TODO: integrate with backend import mutation
    console.log("Importing books:", selected);
    setImported(true);
  };

  const selectedCount = books.filter((b) => b.selected).length;

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
      {books.length === 0 && !loading && (
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

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {imported && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t(
            "goodreads.importSuccess",
            "{{count}} book(s) imported successfully!",
            { count: selectedCount },
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
                selected: selectedCount,
              },
            )}
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: "60vh" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedCount > 0 && selectedCount < books.length
                      }
                      checked={selectedCount === books.length}
                      onChange={toggleSelectAll}
                    />
                  </TableCell>
                  <TableCell>{t("goodreads.columnTitle", "Title")}</TableCell>
                  <TableCell>{t("goodreads.columnAuthor", "Author")}</TableCell>
                  <TableCell>
                    {t("goodreads.columnPublisher", "Publisher")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {books.map((book, idx) => (
                  <TableRow
                    key={idx}
                    hover
                    onClick={() => toggleSelect(idx)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={book.selected} />
                    </TableCell>
                    <TableCell>{book.title}</TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>{book.publisher}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Action buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              mt: 3,
            }}
          >
            <Button variant="outlined" onClick={handleCancel}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={handleImport}
              disabled={selectedCount === 0}
            >
              {t("goodreads.import", "Import")} ({selectedCount})
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
};

export default GoodReadsImport;
