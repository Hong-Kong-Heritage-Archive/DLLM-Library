import { useEffect, useRef, useState } from "react";
import {
  Box,
  Drawer,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import GoverningPrincipleSection from "./design-system/GoverningPrincipleSection";
import ColourScalesSection from "./design-system/ColourScalesSection";
import SemanticTokensSection from "./design-system/SemanticTokensSection";
import TypographySection from "./design-system/TypographySection";
import TypeTokensSection from "./design-system/TypeTokensSection";

const DRAWER_WIDTH = 220;

const navItems = [
  { id: "governing", labelKey: "designSystem.nav.governing", color: "var(--color-brand-primary)" },
  { id: "colours", labelKey: "designSystem.nav.colours", color: "#DB036B" },
  { id: "tokens", labelKey: "designSystem.nav.tokens", color: "#8F7B6E" },
  { id: "typography", labelKey: "designSystem.nav.typography", color: "#2E2420" },
  { id: "type-tokens", labelKey: "designSystem.nav.typeTokens", color: "#190609" },
];

export default function DesignSystemPage() {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState(navItems[0].id);
  const [progress, setProgress] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    navItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setActiveId(id);
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          position: "fixed",
          top: 0,
          left: { md: `${DRAWER_WIDTH}px` },
          right: 0,
          height: 2,
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: "transparent",
          "& .MuiLinearProgress-bar": { bgcolor: "var(--color-brand-primary-hover)" },
        }}
      />

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            bgcolor: "var(--color-bg-subtle)",
            borderRight: 1,
            borderColor: "var(--color-border-subtle)",
          },
        }}
      >
        <Toolbar sx={{ flexDirection: "column", alignItems: "flex-start", pt: 3, pb: 2 }}>
          <Typography variant="h6" sx={{ fontFamily: "var(--font-family-display)", fontWeight: 700, color: "var(--color-text-primary)" }}>
            BookGuide
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: "var(--font-family-mono)", color: "var(--color-text-muted)" }}>
            {t("designSystem.tagline")}
          </Typography>
          <Box
            component="span"
            sx={{
              mt: 1,
              px: 1,
              py: 0.25,
              borderRadius: 5,
              bgcolor: "var(--color-bg-curator)",
              color: "var(--color-text-link)",
              fontFamily: "var(--font-family-mono)",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {t("designSystem.version")}
          </Box>
        </Toolbar>

        <List dense>
          <ListItem>
            <Typography variant="caption" sx={{ px: 2, fontFamily: "var(--font-family-mono)", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              {t("designSystem.nav.foundations")}
            </Typography>
          </ListItem>
          {navItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={activeId === item.id}
                onClick={() => scrollTo(item.id)}
                sx={{
                  borderLeft: 2,
                  borderColor: activeId === item.id ? "var(--color-text-link)" : "transparent",
                  bgcolor: activeId === item.id ? "rgba(219, 3, 107, 0.06)" : "transparent",
                  pl: 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: item.color }} />
                </ListItemIcon>
                <ListItemText
                  primary={t(item.labelKey)}
                  primaryTypographyProps={{
                    fontSize: "14px",
                    fontWeight: activeId === item.id ? 500 : 400,
                    color: activeId === item.id ? "var(--color-text-link)" : "var(--color-text-secondary)",
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box
        ref={mainRef}
        component="main"
        sx={{
          flexGrow: 1,
          ml: { md: `${DRAWER_WIDTH}px` },
          minHeight: "100vh",
          bgcolor: "var(--color-bg-canvas)",
        }}
      >
        <Box
          sx={{
            px: { xs: 3, sm: 5, md: 7 },
            py: { xs: 4, sm: 6 },
            bgcolor: "var(--color-bg-subtle)",
            borderBottom: 1,
            borderColor: "var(--color-border-subtle)",
          }}
        >
          <Typography variant="overline" sx={{ fontFamily: "var(--font-family-mono)", color: "var(--color-brand-primary-hover)", letterSpacing: "0.18em" }}>
            {t("designSystem.eyebrow")}
          </Typography>
          <Typography variant="h2" sx={{ fontFamily: "var(--font-family-display)", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1.1 }}>
            BookGuide{" "}
            <Box component="em" sx={{ color: "var(--color-text-link)", fontStyle: "normal" }}>
              Sydney
            </Box>
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: "var(--font-family-mono)", color: "var(--color-text-muted)", mt: 1 }}>
            {t("designSystem.tagline")}
          </Typography>
        </Box>

        <Box sx={{ px: { xs: 3, sm: 5, md: 7 }, pb: 10 }}>
          <Box sx={{ pt: 6 }}>
            <GoverningPrincipleSection />
          </Box>
          <ColourScalesSection />
          <SemanticTokensSection />
          <TypographySection />
          <TypeTokensSection />
        </Box>
      </Box>
    </Box>
  );
}
