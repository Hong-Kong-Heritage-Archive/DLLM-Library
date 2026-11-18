import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { semanticTokens } from "../../styles/semanticTokens";
import { useMeetupListPath } from "./useMeetupListPath";

const c = semanticTokens.color;
const f = semanticTokens.font;

export const HOW_TO_BORROW_IMAGES = {
  owner: "/images/how-to-borrow/owner.png",
  holder: "/images/how-to-borrow/holder.png",
  borrower: "/images/how-to-borrow/borrower.png",
  borrowerWithBook: "/images/how-to-borrow/borrower-with-book.png",
};
const img = HOW_TO_BORROW_IMAGES;

const card = {
  bgcolor: c.bgSurface,
  borderRadius: "12px",
  boxShadow: "0 1px 4px rgba(25,6,9,.06)",
};

// Anchored sections sit below the app's sticky header.
const anchorOffset = { scrollMarginTop: "88px" };

const Icon: React.FC<{ d: React.ReactNode; color?: string; size?: number }> = ({
  d,
  color = c.textSecondary,
  size = 22,
}) => (
  <Box
    component="svg"
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    sx={{ flexShrink: 0 }}
  >
    {d}
  </Box>
);

const SectionHeading: React.FC<{
  num: string;
  title: string;
  subtitle: string;
}> = ({ num, title, subtitle }) => (
  <>
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
      <Typography
        component="span"
        sx={{ fontFamily: f.mono, fontSize: 12, fontWeight: 500, color: c.textSecondary }}
      >
        {num}
      </Typography>
      <Typography
        component="h2"
        sx={{ m: 0, fontFamily: f.display, fontWeight: 700, fontSize: 18, color: c.textPrimary }}
      >
        {title}
      </Typography>
    </Box>
    <Typography sx={{ fontSize: 14, lineHeight: 1.6, color: c.textSecondary }}>
      {subtitle}
    </Typography>
  </>
);

/** An on-screen button label quoted inside instructions. */
const UiLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    component="span"
    sx={{
      display: "inline-block",
      border: `1px solid ${c.borderDefault}`,
      bgcolor: c.bgCanvas,
      borderRadius: "4px",
      px: "6px",
      fontSize: 13,
      lineHeight: 1.6,
      color: c.textPrimary,
    }}
  >
    {children}
  </Box>
);

const RoleChip: React.FC<{ src: string; label: string; isYou?: boolean }> = ({
  src,
  label,
  isYou,
}) => (
  <Box
    component="span"
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      height: 24,
      boxSizing: "border-box",
      pl: "2px",
      pr: "9px",
      borderRadius: "999px",
      fontSize: 12,
      fontWeight: 600,
      ...(isYou
        ? { bgcolor: c.navSelectedBg, color: c.navSelectedColor }
        : { bgcolor: c.bgSurface, border: `1px solid ${c.borderDefault}`, color: c.textPrimary }),
    }}
  >
    <Box
      component="img"
      src={src}
      alt=""
      sx={{ width: 20, height: 20, borderRadius: "50%", bgcolor: c.bgSurface, objectFit: "contain" }}
    />
    {label}
  </Box>
);

const Avatar: React.FC<{ src: string; inBand?: boolean }> = ({ src, inBand }) => (
  <Box
    component="img"
    src={src}
    alt=""
    sx={{
      width: 44,
      height: 44,
      flexShrink: 0,
      borderRadius: "50%",
      bgcolor: c.bgCanvas,
      border: `1px solid ${inBand ? c.borderDefault : c.borderSubtle}`,
      boxSizing: "border-box",
      objectFit: "contain",
    }}
  />
);

const GroupAvatar: React.FC = () => {
  const small = {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: "50%",
    bgcolor: c.bgSurface,
    border: `1px solid ${c.borderSubtle}`,
    boxSizing: "border-box",
    objectFit: "contain",
  } as const;
  return (
    <Box sx={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
      <Box component="img" src={img.owner} alt="" sx={{ ...small, left: 0, top: 0 }} />
      <Box component="img" src={img.holder} alt="" sx={{ ...small, left: 18, top: 0 }} />
      <Box component="img" src={img.borrower} alt="" sx={{ ...small, left: 9, top: 18 }} />
    </Box>
  );
};

const StepRow: React.FC<{
  avatar: React.ReactNode;
  step: string;
  chips: React.ReactNode;
  title: string;
  last?: boolean;
  inBand?: boolean;
  children: React.ReactNode;
}> = ({ avatar, step, chips, title, last, inBand, children }) => (
  <Box component="li" sx={{ display: "flex", gap: "14px" }}>
    <Box
      sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 44 }}
    >
      {avatar}
      {!last && (
        <Box
          sx={{ flex: 1, width: "2px", bgcolor: inBand ? c.borderDefault : c.borderSubtle, my: "4px" }}
        />
      )}
    </Box>
    <Box
      sx={{ pb: last ? 2 : 2.5, display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
        <Typography component="span" sx={{ fontSize: 13, fontWeight: 700, color: c.textPrimary, mr: "2px" }}>
          {step}
        </Typography>
        {chips}
      </Box>
      <Typography
        component="h3"
        sx={{ m: 0, fontFamily: f.display, fontWeight: 700, fontSize: 16, color: c.textPrimary }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  </Box>
);

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography component="div" sx={{ fontSize: 14, lineHeight: 1.8, color: c.textBody }}>
    {children}
  </Typography>
);

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: c.textSecondary }}>→ {children}</Typography>
);

const clockPath = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>
);

/**
 * 點樣借書 content. Static page; also reused as the 點樣借書 sub-tab in the
 * 新聞 tab revamp (Part 2), so it has no page header of its own.
 * Source of truth: design canvas board 「點樣借書 · 手機版」 (Main.dc.html).
 */
const HowToBorrow: React.FC = () => {
  const { t } = useTranslation();
  const meetupListPath = useMeetupListPath();
  const k = (key: string, opts?: Record<string, unknown>) => t(`howToBorrow.${key}`, opts);

  // Quoted button labels come from the app's own keys so they always match.
  const label = {
    request: t("item.requestToBorrow"),
    faceToFace: t("item.faceToFaceTransfer"),
    confirmTransfer: t("item.confirmTransfer"),
    receive: t("transactions.receive"),
    holdings: t("tabs.items-nav"),
    borrowed: t("item.myBorrowedItems"),
    confirmReturn: t("item.confirmReturn"),
  };

  const you = k("roles.you");
  const youChip = <RoleChip src={img.borrower} label={you} isYou />;
  const holderChip = <RoleChip src={img.holder} label={k("roles.holder")} />;
  const ownerChip = <RoleChip src={img.owner} label={k("roles.owner")} />;
  const step = (n: number) => k("steps.step", { n });

  const toc = [
    { id: "roles", num: "01", title: k("roles.title") },
    { id: "relay", num: "02", title: k("relay.title") },
    { id: "steps", num: "03", title: k("steps.title") },
    { id: "rules", num: "04", title: k("rules.title") },
  ];

  const roles = [
    { key: "owner", src: img.owner },
    { key: "holder", src: img.holder },
    { key: "borrower", src: img.borrower, isYou: true },
  ];

  const rules: { key: string; icon: React.ReactNode; opts?: Record<string, unknown> }[] = [
    { key: "meet", icon: clockPath, opts: { label: label.confirmTransfer } },
    {
      key: "public",
      icon: (
        <>
          <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </>
      ),
    },
    { key: "expiry", icon: <path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9" /> },
    {
      key: "duration",
      icon: (
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M4 10h16M9 3v4M15 3v4" />
        </>
      ),
    },
    { key: "onward", icon: <path d="M4 8h13l-3-3M20 16H7l3 3" /> },
    {
      key: "notes",
      icon: (
        <>
          <path d="M5 4h14v12l-4 4H5z" />
          <path d="M15 20v-4h4M8 9h8M8 13h5" />
        </>
      ),
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, color: c.textBody }}>
      {/* Hook */}
      <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography
          sx={{ fontFamily: f.mono, fontSize: 11, letterSpacing: ".06em", color: c.textSecondary }}
        >
          {k("eyebrow")}
        </Typography>
        <Typography
          component="h1"
          sx={{ m: 0, fontFamily: f.display, fontWeight: 700, fontSize: 26, lineHeight: 1.3, color: c.textPrimary }}
        >
          {k("title")}
        </Typography>
        <Typography sx={{ fontSize: 15, lineHeight: 1.65 }}>{k("intro")}</Typography>
        <Box sx={{ ...card, p: 2, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          <Box
            component="svg"
            aria-hidden="true"
            width={22}
            height={30}
            viewBox="0 0 22 30"
            sx={{ flexShrink: 0, mt: "2px" }}
          >
            <path d="M2 2h18v26l-9-6-9 6z" fill="none" stroke={c.textPrimary} strokeWidth={1.6} strokeLinejoin="round" />
          </Box>
          <Typography sx={{ fontFamily: f.display, fontSize: 14, lineHeight: 1.7, color: "#321519" }}>
            {k("note")}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 15, lineHeight: 1.6, fontWeight: 600, color: c.textPrimary }}>
          {k("ready")}
        </Typography>
      </Box>

      {/* Jump menu (inline, not sticky) */}
      <Box
        component="nav"
        id="toc"
        aria-label={k("tocLabel")}
        sx={{ display: "flex", flexDirection: "column", gap: 1.25, ...anchorOffset }}
      >
        <Typography sx={{ fontSize: 13, color: c.textSecondary }}>{k("tocHint")}</Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {toc.map((item) => (
            <Box
              key={item.id}
              component="a"
              href={`#${item.id}`}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                minHeight: 52,
                boxSizing: "border-box",
                px: "14px",
                py: "10px",
                bgcolor: c.bgSurface,
                border: `1px solid ${c.borderDefault}`,
                borderRadius: "12px",
                textDecoration: "none",
              }}
            >
              <Box component="span" sx={{ fontFamily: f.mono, fontSize: 12, color: c.textSecondary }}>
                {item.num}
              </Box>
              <Box component="span" sx={{ flex: 1, fontSize: 15, fontWeight: 600, color: c.brandAccent }}>
                {item.title}
              </Box>
              <Icon d={<path d="M9 6l6 6-6 6" />} color={c.brandAccent} size={18} />
            </Box>
          ))}
        </Box>
      </Box>

      {/* 01 Roles */}
      <Box component="section" id="roles" sx={{ display: "flex", flexDirection: "column", gap: 1.5, ...anchorOffset }}>
        <SectionHeading num="01" title={k("roles.title")} subtitle={k("roles.subtitle")} />
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1 }}>
          {roles.map((role) => (
            <Box
              key={role.key}
              sx={{
                ...card,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                textAlign: "center",
                ...(role.isYou
                  ? { border: `2px solid ${c.navSelectedBg}`, pt: "12px", px: "4px", pb: "14px" }
                  : { pt: "14px", px: "6px", pb: "16px" }),
              }}
            >
              {role.isYou && (
                <Box
                  component="span"
                  sx={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    height: 20,
                    px: 1,
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "999px",
                    bgcolor: c.navSelectedBg,
                    color: c.navSelectedColor,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {you}
                </Box>
              )}
              <Box
                component="img"
                src={role.src}
                alt=""
                sx={{ width: 88, height: 88, maxWidth: "100%", objectFit: "contain" }}
              />
              <Typography
                component="h3"
                sx={{ m: 0, fontFamily: f.display, fontWeight: 700, fontSize: 16, color: c.textPrimary }}
              >
                {k(`roles.${role.key}`)}
              </Typography>
              <Typography sx={{ fontSize: 11, color: c.textSecondary, mt: "-4px" }}>
                {k(`roles.${role.key}En`)}
              </Typography>
              <Typography sx={{ fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-line" }}>
                {k(`roles.${role.key}Desc`)}
              </Typography>
            </Box>
          ))}
        </Box>
        <Typography sx={{ fontSize: 13, lineHeight: 1.6, color: c.textSecondary }}>
          {k("roles.firstLoan")}
        </Typography>
      </Box>

      {/* 02 Relay */}
      <Box component="section" id="relay" sx={{ display: "flex", flexDirection: "column", gap: 1.5, ...anchorOffset }}>
        <SectionHeading num="02" title={k("relay.title")} subtitle={k("relay.subtitle")} />
        <Box sx={{ ...card, px: 1.5, py: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            {[
              { src: img.owner, text: k("roles.owner") },
              { src: img.holder, text: k("relay.previous") },
              { src: img.borrowerWithBook, text: you, strong: true },
              { src: null, text: k("relay.next") },
            ].map((person, i) => (
              <React.Fragment key={person.text}>
                {i > 0 && (
                  <Box component="svg" aria-hidden="true" width={18} height={32} viewBox="0 0 18 32" sx={{ flexShrink: 0 }}>
                    <path d="M2 16h13M10 11l5 5-5 5" fill="none" stroke={c.textTertiary} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                  </Box>
                )}
                <Box sx={{ width: 64, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                  {person.src ? (
                    <Box component="img" src={person.src} alt="" sx={{ width: 48, height: 48, objectFit: "contain" }} />
                  ) : (
                    <Box component="svg" role="img" aria-label={k("relay.nextAria")} width={48} height={48} viewBox="0 0 48 48">
                      <path d="M9 27c0-11 6.5-17 15-17s15 6 15 17" fill="none" stroke={c.textMuted} strokeWidth={2} strokeLinecap="round" strokeDasharray="3 3" />
                      <circle cx="24" cy="28" r="13" fill="none" stroke={c.textMuted} strokeWidth={2} strokeDasharray="3 3" />
                      <path d="M14 22c4-3 16-3 20 0" fill="none" stroke={c.textMuted} strokeWidth={2} strokeLinecap="round" />
                      <circle cx="19.5" cy="28" r="1.6" fill={c.textMuted} />
                      <circle cx="28.5" cy="28" r="1.6" fill={c.textMuted} />
                      <path d="M20.5 33c2 2 5 2 7 0" fill="none" stroke={c.textMuted} strokeWidth={1.8} strokeLinecap="round" />
                      <circle cx="39" cy="10" r="8" fill={c.bgSubtle} stroke={c.textMuted} strokeWidth={1.6} />
                      <path d="M36.3 8a2.8 2.8 0 1 1 3.9 2.6c-.8.4-1.2.9-1.2 1.7v.3" fill="none" stroke={c.textSecondary} strokeWidth={1.8} strokeLinecap="round" />
                      <circle cx="39" cy="15.2" r="1" fill={c.textSecondary} />
                    </Box>
                  )}
                  <Typography
                    sx={{
                      fontSize: person.strong ? 13 : 12,
                      fontWeight: person.strong ? 600 : 400,
                      color: person.strong ? c.textPrimary : c.textBody,
                      textAlign: "center",
                    }}
                  >
                    {person.text}
                  </Typography>
                </Box>
              </React.Fragment>
            ))}
          </Box>
          <Box sx={{ borderTop: `1px solid ${c.borderSubtle}`, pt: 1.5, display: "flex", gap: 1, alignItems: "flex-start" }}>
            <Icon d={<><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>} size={18} />
            <Typography sx={{ fontSize: 13, lineHeight: 1.6 }}>
              {k("relay.returnNote", { label: label.confirmReturn })}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Before you start */}
      <Box component="section" sx={{ bgcolor: c.bgSubtle, borderRadius: "12px", p: 2, display: "flex", flexDirection: "column", gap: 1.25 }}>
        <Typography component="h2" sx={{ m: 0, fontFamily: f.display, fontWeight: 700, fontSize: 16, color: c.textPrimary }}>
          {k("before.title")}
        </Typography>
        <Typography sx={{ fontSize: 14, lineHeight: 1.6 }}>{k("before.subtitle")}</Typography>
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1 }}>
          {["account", "verify", "location"].map((key) => (
            <Box component="li" key={key} sx={{ display: "flex", gap: 1.25, alignItems: "center", fontSize: 14, color: "#321519" }}>
              <Icon d={<><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>} color={c.special} size={20} />
              {k(`before.${key}`)}
            </Box>
          ))}
        </Box>
      </Box>

      {/* 03 Steps */}
      <Box component="section" id="steps" sx={{ display: "flex", flexDirection: "column", gap: 1.5, ...anchorOffset }}>
        <SectionHeading num="03" title={k("steps.title")} subtitle={k("steps.subtitle")} />
        <Box
          component="ol"
          aria-label={k("steps.listLabel")}
          sx={{ ...card, listStyle: "none", m: 0, pt: 2.5, px: 2, pb: "4px", display: "flex", flexDirection: "column" }}
        >
          <StepRow avatar={<Avatar src={img.borrower} />} step={step(1)} chips={youChip} title={k("steps.s1Title")}>
            <Body>
              {k("steps.s1Body")} <UiLabel>{label.request}</UiLabel>
            </Body>
            <Note>{k("steps.s1Note")}</Note>
          </StepRow>

          <StepRow
            avatar={<GroupAvatar />}
            step={step(2)}
            chips={<>{youChip}{holderChip}{ownerChip}</>}
            title={k("steps.s2Title")}
          >
            <Body>{k("steps.s2Body")}</Body>
            <Note>{k("steps.s2FirstLoan")}</Note>
            <Note>{k("steps.s2Note")}</Note>
          </StepRow>

          {/* Steps 3 and 4 happen in person, inside the one-hour window */}
          <Box
            component="li"
            sx={{ display: "flex", flexDirection: "column", mx: -1, mb: 2, pt: "14px", px: 1, bgcolor: c.bgSubtle, borderRadius: "12px" }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, pb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Icon
                  color={c.textPrimary}
                  d={
                    <>
                      <circle cx="8" cy="8" r="3" />
                      <circle cx="16.5" cy="8" r="3" />
                      <path d="M2.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" />
                      <path d="M13.5 14.3c.9-.2 1.9-.3 3-.3 3 0 5 2.7 5 6" />
                    </>
                  }
                />
                <Typography component="h3" sx={{ m: 0, fontFamily: f.display, fontWeight: 700, fontSize: 16, color: c.textPrimary }}>
                  {k("steps.meetup")}
                </Typography>
              </Box>
              <Box
                sx={{ bgcolor: c.warningBg, color: c.warning, borderRadius: "8px", px: 1.25, py: 1, display: "flex", gap: 1, alignItems: "center", fontSize: 13, fontWeight: 500 }}
              >
                <Icon d={clockPath} color={c.warning} size={16} />
                {k("steps.timer", { label: label.confirmTransfer })}
              </Box>
            </Box>
            <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column" }}>
              <StepRow inBand avatar={<Avatar inBand src={img.holder} />} step={step(3)} chips={holderChip} title={k("steps.s3Title")}>
                <Body>
                  {k("steps.s3Body")} <UiLabel>{label.faceToFace}</UiLabel> → <UiLabel>{label.confirmTransfer}</UiLabel>
                </Body>
                <Note>{k("steps.s3Note")}</Note>
              </StepRow>
              <StepRow inBand last avatar={<Avatar inBand src={img.borrower} />} step={step(4)} chips={youChip} title={k("steps.s4Title")}>
                <Body>
                  {k("steps.s4Body")} <UiLabel>{label.receive}</UiLabel>
                </Body>
                <Note>{k("steps.s4Note")}</Note>
              </StepRow>
            </Box>
          </Box>

          <StepRow
            last
            avatar={<Avatar src={img.borrowerWithBook} />}
            step={step(5)}
            chips={<RoleChip src={img.borrowerWithBook} label={you} isYou />}
            title={k("steps.s5Title")}
          >
            <Body>
              {k("steps.s5Before")} <UiLabel>{label.holdings}</UiLabel> → <UiLabel>{label.borrowed}</UiLabel>{" "}
              {k("steps.s5After")}
            </Body>
          </StepRow>
        </Box>
      </Box>

      {/* 04 Rules */}
      <Box component="section" id="rules" sx={{ display: "flex", flexDirection: "column", gap: 1.5, ...anchorOffset }}>
        <SectionHeading num="04" title={k("rules.title")} subtitle={k("rules.subtitle")} />
        <Box component="ul" sx={{ ...card, listStyle: "none", m: 0, px: 2, py: "4px", display: "flex", flexDirection: "column" }}>
          {rules.map((rule, i) => (
            <Box
              component="li"
              key={rule.key}
              sx={{ display: "flex", gap: 1.5, py: "14px", borderBottom: i < rules.length - 1 ? `1px solid ${c.borderSubtle}` : "none" }}
            >
              <Icon d={rule.icon} />
              <Box sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <Typography component="span" sx={{ fontSize: 15, fontWeight: 600, color: c.textPrimary }}>
                  {k(`rules.${rule.key}Title`)}
                </Typography>
                <Typography component="span" sx={{ fontSize: 13, lineHeight: 1.55, color: c.textSecondary }}>
                  {k(`rules.${rule.key}Desc`, rule.opts)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        component="a"
        href="#toc"
        sx={{ alignSelf: "center", display: "flex", alignItems: "center", gap: "6px", minHeight: 44, fontSize: 14, fontWeight: 500, color: c.brandAccent, textDecoration: "none" }}
      >
        <Icon d={<path d="M12 19V5M6 11l6-6 6 6" />} color={c.brandAccent} size={16} />
        {k("backToToc")}
      </Box>

      <Button
        component={Link}
        to={meetupListPath}
        variant="contained"
        disableElevation
        sx={{
          height: 52,
          borderRadius: "12px",
          bgcolor: c.brandPrimaryHover,
          color: c.textInverse,
          fontSize: 16,
          fontWeight: 600,
          textTransform: "none",
          "&:hover": { bgcolor: c.brandAccent },
        }}
      >
        {k("cta")}
      </Button>
    </Box>
  );
};

export default HowToBorrow;
