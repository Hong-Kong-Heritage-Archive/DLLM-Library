// DetailSectionCard.tsx
import React from "react";
import { Box, Typography, Paper } from "@mui/material";

interface DetailSectionCardProps {
  title?: React.ReactNode;
  titleSx?: object;
  children: React.ReactNode;
  eyebrow?: React.ReactNode;
  action?: React.ReactNode;
  disablePadding?: boolean;
  sx?: object;
}

const cardSx = {
  p: { xs: 2, sm: 3 },
  borderRadius: 3,
  backgroundColor: "var(--color-bg-surface)",
  border: "1px solid var(--color-border-subtle)",
};

const headerSx = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 2,
  mb: 4,
};

const titleWrapSx = { flex: 1, minWidth: 0 };

const DetailSectionCard: React.FC<DetailSectionCardProps> = ({
  title,
  titleSx,
  children,
  eyebrow,
  action,
  disablePadding = false,
  sx,
}) => {
  return (
    <Paper elevation={0} sx={{ ...cardSx, ...sx }}>
      {(title || eyebrow || action) && (
        <Box sx={headerSx}>
          <Box sx={titleWrapSx}>
            {eyebrow ? (
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  color: "var(--color-text-muted)",
                  letterSpacing: "0.12em",
                  mb: 0.5,
                }}
              >
                {eyebrow}
              </Typography>
            ) : null}
            {title ? (
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "var(--color-text-primary)", ...titleSx }}
              >
                {title}
              </Typography>
            ) : null}
          </Box>
          {action ? <Box>{action}</Box> : null}
        </Box>
      )}
      <Box sx={disablePadding ? undefined : { pt: 0.5 }}>{children}</Box>
    </Paper>
  );
};

export default DetailSectionCard;