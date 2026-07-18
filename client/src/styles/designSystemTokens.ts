/* eslint-disable */
// Design-system page tokens. Mirrors src/design-tokens.json primitives.
// Used by DesignSystemPage only; keep in sync with design-tokens.json.

export const brandScale = {
  50: "#FFF0F6",
  100: "#FCD4E8",
  200: "#F8A8D0",
  300: "#F07AB5",
  400: "#E34A97",
  500: "#DB036B",
  600: "#B3005A",
  700: "#8A0047",
  800: "#5E0031",
  900: "#33001A",
} as const;

export const inkScale = {
  950: "#190609",
  900: "#321519",
  800: "#502B30",
  700: "#70484D",
  600: "#956A70",
  500: "#B19599",
  400: "#CEBBBD",
  300: "#E4D8DA",
  200: "#F1E9EA",
  100: "#F9F5F6",
} as const;

export const paperScale = {
  0: "#FFFFFF",
  50: "#FAF7F4",
  100: "#F2ECE5",
  150: "#E6DDD3",
  200: "#D4C8BC",
  300: "#B8A89A",
  400: "#8F7B6E",
  500: "#6B5C50",
  600: "#4A3C32",
  700: "#2E2420",
  800: "#1A1410",
} as const;

export const statusTokens = {
  go: { bg: "#E6F4EC", fg: "#1A5C30" },
  go2: { bg: "#EEF7F2", fg: "#2A7A48" },
  act: { bg: "#E0ECF7", fg: "#1A4A7A", bd: "#B8D4F0" },
  wait: { bg: "#FEF3D8", fg: "#7A5000" },
  wait2: { bg: "#FEF8EC", fg: "#8A6010" },
  stop: { bg: "#FDECea", fg: "#8A1A1A" },
  spec: { bg: "#E0F4F0", fg: "#0F6B56" },
  spec2: { bg: "#EAF7F4", fg: "#1A7A62" },
  gift: { bg: "#F0E8F5", fg: "#5A2A6B" },
  hot: { bg: "#FEF0E0", fg: "#8A4000" },
  neu: { bg: "#F2ECE5", fg: "#6B5C50" },
} as const;

export const semanticColorTokens = [
  { name: "--surface-app", value: inkScale[100], use: "app background" },
  { name: "--surface-card", value: "#FFFFFF", use: "card surface" },
  { name: "--surface-header", value: "#FFFFFF", use: "header surface" },
  { name: "--surface-curator", value: inkScale[200], use: "curator wrap band" },
  { name: "--nav-active", value: inkScale[950], use: "filled dark pill" },
  { name: "--nav-active-pill", value: inkScale[950], use: "active pill background" },
  { name: "--nav-inactive", value: inkScale[600], use: "inactive nav item" },
  { name: "--fab-bg", value: brandScale[600], use: "FAB background" },
  { name: "--text-heading", value: inkScale[950], use: "headings, book titles" },
  { name: "--text-body", value: inkScale[800], use: "body text" },
  { name: "--text-secondary", value: inkScale[700], use: "secondary text" },
  { name: "--text-tagline", value: inkScale[600], use: "tagline, placeholder" },
  { name: "--text-link", value: brandScale[700], use: "clickable text" },
  { name: "--text-accent", value: brandScale[700], use: "city name, View All, links" },
  { name: "--border-subtle", value: inkScale[300], use: "hairlines" },
  { name: "--border-default", value: inkScale[400], use: "borders, dividers" },
] as const;

export const typeScale = [
  { role: "Hero", size: "38px", weight: 700, lineHeight: 1.1, family: "display", sample: "BookGuide Sydney" },
  { role: "H1", size: "28px", weight: 700, lineHeight: 1.2, family: "display", sample: "Page Title 頁面標題" },
  { role: "H2", size: "22px", weight: 700, lineHeight: 1.25, family: "display", sample: "Section Title 章節標題" },
  { role: "H3", size: "18px", weight: 600, lineHeight: 1.3, family: "body", sample: "Subsection 小標題" },
  { role: "Body", size: "14px", weight: 400, lineHeight: 1.6, family: "body", sample: "Body text in English and 正文字體" },
  { role: "Caption", size: "12px", weight: 400, lineHeight: 1.5, family: "body", sample: "Caption / metadata" },
  { role: "Mono", size: "11px", weight: 500, lineHeight: 1.5, family: "mono", sample: "TOKEN-NAME #DB036B" },
] as const;

export const typeTokens = [
  { name: "typography.body.family", value: "IBM Plex Sans, Noto Serif TC, PingFang HK, PingFang TC, Microsoft JhengHei, sans-serif", use: "body text" },
  { name: "typography.display.family", value: "Noto Serif TC, Playfair Display, serif", use: "headings, brand" },
  { name: "typography.mono.family", value: "Roboto Mono, Menlo, Monaco, Consolas, monospace", use: "code, labels" },
  { name: "typography.body.size", value: "16px", use: "base body size" },
  { name: "typography.display.size", value: "24px", use: "display size" },
  { name: "typography.body.weight", value: "400", use: "regular body" },
  { name: "typography.display.weight", value: "900", use: "display weight" },
  { name: "radius.control", value: "8px", use: "buttons, inputs" },
  { name: "radius.card", value: "16px", use: "cards" },
  { name: "radius.pill", value: "999px", use: "pills, FAB" },
] as const;

export const governingPrinciples = [
  { name: "Go", color: statusTokens.go.fg, bg: statusTokens.go.bg, rule: "Available / positive terminal" },
  { name: "Act", color: statusTokens.act.fg, bg: statusTokens.act.bg, rule: "Action required" },
  { name: "Wait", color: statusTokens.wait.fg, bg: statusTokens.wait.bg, rule: "Pending / amber" },
  { name: "Stop", color: statusTokens.stop.fg, bg: statusTokens.stop.bg, rule: "Blocked / red" },
  { name: "Spec", color: statusTokens.spec.fg, bg: statusTokens.spec.bg, rule: "Exchange / teal" },
  { name: "Gift", color: statusTokens.gift.fg, bg: statusTokens.gift.bg, rule: "Free / purple" },
] as const;
