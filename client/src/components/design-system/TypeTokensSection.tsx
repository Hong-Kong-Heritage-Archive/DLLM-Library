import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { typeTokens } from "../../styles/designSystemTokens";

export default function TypeTokensSection() {
  const { t } = useTranslation();

  return (
    <Box component="section" id="type-tokens" sx={{ scrollMarginTop: 3, pt: 6, mt: 6, borderTop: 1, borderColor: "var(--color-border-subtle)" }}>
      <Typography variant="overline" color="text.secondary">
        {t("designSystem.foundations")} — 05
      </Typography>
      <Typography variant="h4" component="h2" sx={{ fontFamily: "var(--font-family-display)", mb: 1 }}>
        {t("designSystem.typeTokens.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640, mb: 4 }}>
        {t("designSystem.typeTokens.description")}
      </Typography>

      <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: "var(--color-border-subtle)" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "var(--color-bg-subtle)" }}>
              <TableCell>{t("designSystem.tokens.token")}</TableCell>
              <TableCell>{t("designSystem.tokens.value")}</TableCell>
              <TableCell>{t("designSystem.tokens.use")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {typeTokens.map((token) => (
              <TableRow key={token.name} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: "var(--font-family-mono)", color: "var(--color-text-link)" }}>
                    {token.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: "var(--font-family-mono)" }}>
                    {token.value}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {token.use}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
