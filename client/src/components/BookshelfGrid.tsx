import React from "react";
import { Box, Grid } from "@mui/material";

interface BookshelfGridProps {
  children: React.ReactNode;
  spacing?: { xs: number; sm: number };
}

/**
 * BookshelfGrid - A grid container that adds subtle shelf shadows
 * to simulate a physical bookshelf appearance
 */
const BookshelfGrid: React.FC<BookshelfGridProps> = ({
  children,
  spacing = { xs: 1, sm: 2 },
}) => {
  return (
    <Box
      sx={{
        position: "relative",
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "2px",
          background:
            "linear-gradient(to right, transparent, rgba(0,0,0,0.1) 20%, rgba(0,0,0,0.1) 80%, transparent)",
          pointerEvents: "none",
        },
      }}
    >
      <Grid
        container
        spacing={spacing}
        sx={{
          width: "100%",
          // Add subtle shadow to each row to simulate shelf depth
          "& > .MuiGrid2-root": {
            position: "relative",
          },
        }}
      >
        {children}
      </Grid>
    </Box>
  );
};

export default BookshelfGrid;
