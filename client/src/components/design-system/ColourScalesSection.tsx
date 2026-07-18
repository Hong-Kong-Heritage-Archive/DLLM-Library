import { Box, Grid, Paper, Tooltip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { brandScale, inkScale, paperScale, statusTokens } from "../../styles/designSystemTokens";

function SwatchRow({
  title,
  scale,
  starred,
}: {
  title: string;
  scale: Record<string, string>;
  starred?: string[];
}) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: "var(--font-family-mono)", textTransform: "uppercase" }}>
        {title}
      </Typography>
      <Grid container spacing={0.5}>
        {Object.entries(scale).map(([key, value]) => {
          const isStar = starred?.includes(key);
          return (
            <Grid size="grow" key={key}>
              <Tooltip title={`${title}-${key}: ${value}`} arrow>
                <Paper
                  elevation={0}
                  sx={{
                    aspectRatio: "1",
                    bgcolor: value,
                    border: 1,
                    borderColor: "rgba(0,0,0,0.05)",
                    borderRadius: 1,
                    outline: isStar ? `2px solid var(--color-text-primary)` : "none",
                    outlineOffset: isStar ? 2 : 0,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    pb: 0.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: "var(--font-family-mono)",
                      fontSize: "8px",
                      color: isLight(value) ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.9)",
                    }}
                  >
                    {key}
                  </Typography>
                </Paper>
              </Tooltip>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

function isLight(hex: string) {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 128;
}

export default function ColourScalesSection() {
  const { t } = useTranslation();

  return (
    <Box component="section" id="colours" sx={{ scrollMarginTop: 3, pt: 6, mt: 6, borderTop: 1, borderColor: "var(--color-border-subtle)" }}>
      <Typography variant="overline" color="text.secondary">
        {t("designSystem.foundations")} — 02
      </Typography>
      <Typography variant="h4" component="h2" sx={{ fontFamily: "var(--font-family-display)", mb: 1 }}>
        {t("designSystem.colours.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640, mb: 4 }}>
        {t("designSystem.colours.description")}
      </Typography>

      <SwatchRow title="Brand Magenta" scale={brandScale} starred={["500", "600", "700"]} />
      <SwatchRow title="Rosy Ink" scale={inkScale} starred={["950", "800", "600", "100"]} />
      <SwatchRow title="Warm Paper (legacy)" scale={paperScale} />

      <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: "var(--font-family-mono)", textTransform: "uppercase" }}>
        {t("designSystem.colours.status")}
      </Typography>
      <Grid container spacing={1}>
        {Object.entries(statusTokens).map(([key, token]) => (
          <Grid size={{ xs: 6, sm: 4, md: 2 }} key={key}>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                bgcolor: token.bg,
                color: token.fg,
                border: 1,
                borderColor: "rgba(0,0,0,0.05)",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
                {key}
              </Typography>
              <Typography variant="caption" display="block">
                {token.fg}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
