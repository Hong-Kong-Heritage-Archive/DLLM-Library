import { Box, Grid, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { governingPrinciples, inkScale } from "../../styles/designSystemTokens";

export default function GoverningPrincipleSection() {
  const { t } = useTranslation();

  return (
    <Box component="section" id="governing" sx={{ scrollMarginTop: 3 }}>
      <Typography variant="overline" color="text.secondary">
        {t("designSystem.foundations")} — 01
      </Typography>
      <Typography variant="h4" component="h2" sx={{ fontFamily: "var(--font-family-display)", mb: 1 }}>
        {t("designSystem.governing.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640, mb: 4 }}>
        {t("designSystem.governing.description")}
      </Typography>

      <Grid container spacing={1}>
        {governingPrinciples.map((p) => (
          <Grid size={{ xs: 6, sm: 4, md: 2 }} key={p.name}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                textAlign: "center",
                border: 1,
                borderColor: "var(--color-border-subtle)",
                bgcolor: "var(--color-bg-surface)",
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  bgcolor: p.bg,
                  color: p.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 1,
                  fontSize: 16,
                }}
              >
                ●
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {p.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {p.rule}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box
        component="aside"
        sx={{
          mt: 2,
          p: 1.5,
          borderRadius: 1,
          borderLeft: 2,
          borderColor: "var(--color-brand-primary-hover)",
          bgcolor: "var(--color-bg-subtle)",
        }}
      >
        <Typography variant="caption" color={inkScale[600]}>
          {t("designSystem.governing.note")}
        </Typography>
      </Box>
    </Box>
  );
}
