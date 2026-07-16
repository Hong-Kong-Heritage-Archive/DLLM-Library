import { Box, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { typeScale } from "../../styles/designSystemTokens";

export default function TypographySection() {
  const { t } = useTranslation();

  return (
    <Box component="section" id="typography" sx={{ scrollMarginTop: 3, pt: 6, mt: 6, borderTop: 1, borderColor: "var(--color-border-subtle)" }}>
      <Typography variant="overline" color="text.secondary">
        {t("designSystem.foundations")} — 04
      </Typography>
      <Typography variant="h4" component="h2" sx={{ fontFamily: "var(--font-family-display)", mb: 1 }}>
        {t("designSystem.typography.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640, mb: 4 }}>
        {t("designSystem.typography.description")}
      </Typography>

      <Paper elevation={0} sx={{ border: 1, borderColor: "var(--color-border-subtle)", overflow: "hidden" }}>
        {typeScale.map((type, index) => (
          <Box
            key={type.role}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "180px 1fr 160px" },
              gap: 3,
              alignItems: "center",
              p: 2,
              borderBottom: index < typeScale.length - 1 ? 1 : 0,
              borderColor: "var(--color-border-soft)",
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ fontFamily: "var(--font-family-mono)", textTransform: "uppercase", color: "var(--color-brand-primary-hover)" }}>
                {type.role}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {type.size} / {type.weight} / {type.lineHeight}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontFamily: type.family === "display" ? "var(--font-family-display)" : type.family === "mono" ? "var(--font-family-mono)" : "var(--font-family-body)",
                fontSize: type.size,
                fontWeight: type.weight,
                lineHeight: type.lineHeight,
                color: "var(--color-text-primary)",
              }}
            >
              {type.sample}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: "var(--font-family-mono)",
                color: "var(--color-text-muted)",
                textAlign: { sm: "right" },
              }}
            >
              {type.family}
            </Typography>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
