import React from "react";
import { Alert, Box, Button, Link, Stack, Typography } from "@mui/material";
import {
  CheckCircleOutline as SentIcon,
  MarkEmailUnread as EmailIcon,
  NotificationsNone as BellIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import BoldNames, { nameMarker } from "./BoldNames";
import { RequestRecipients } from "../utils/requestRecipients";

// Invite link for the BookGuide community Signal group (help for members).
export const SIGNAL_GROUP_URL =
  "https://signal.group/#CjQKII2nqSOfKad5MIlUhmwB1yTQBPlO2eO-5rmcGlQvg4cnEhB6B4skJ4TUQkg_F9nQ6PH9";

/**
 * Shown once, after a member's first request (Issue #258, D2). The one job is
 * to get people to watch their email: some members rarely check it.
 */
const RequestSentCard: React.FC<{
  recipients: RequestRecipients;
  onDone: () => void;
}> = ({ recipients, onDone }) => {
  const { t } = useTranslation();
  const names = {
    owner: recipients.ownerName,
    holder: recipients.holderName ?? "",
  };
  const markers = { owner: nameMarker("owner"), holder: nameMarker("holder") };

  return (
    <Stack spacing={2} sx={{ overflowWrap: "anywhere" }}>
      <Box sx={{ textAlign: "center" }}>
        <SentIcon sx={{ fontSize: 40, color: "#2A9455" }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: "bold" }}>
          {t("item.requestSentTitle", "Request sent")}
        </Typography>
      </Box>

      <Typography variant="body2">
        <BoldNames
          names={names}
          text={
            recipients.holderName
              ? t(
                  "item.requestSentWho",
                  "We've emailed {{owner}} (owner) and {{holder}} (holder). You'll get a copy too.",
                  markers,
                )
              : t(
                  "item.requestSentWhoSame",
                  "We've emailed {{owner}}. They own this book and have it. You'll get a copy too.",
                  markers,
                )
          }
        />
      </Typography>

      <Alert severity="info" icon={<EmailIcon fontSize="inherit" />}>
        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
          {t("item.requestSentWatchTitle", "Keep an eye on your email.")}
        </Typography>
        <Typography variant="body2">
          {t(
            "item.requestSentWatchBody",
            "You'll hear when the owner approves, then you'll arrange the handover by email. Emails come from BookGuide. If you can't find one, check your junk folder.",
          )}
        </Typography>
      </Alert>

      {/* Where to follow the request, so people who rarely check email
          still have a way to see progress. */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          p: 1.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <BellIcon fontSize="small" sx={{ mt: "2px" }} />
        <Typography variant="body2">
          <strong>{t("item.requestSentTrackTitle", "Track your request:")}</strong>{" "}
          {t(
            "item.requestSentTrackBody",
            "tap the bell at the top to open My Exchanges. You'll see where it's up to and how long it stays open.",
          )}
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary">
        {SIGNAL_GROUP_URL ? (
          <Link href={SIGNAL_GROUP_URL} target="_blank" rel="noopener">
            {t("item.requestSentHelp", "Questions? Ask us in the Signal group.")}
          </Link>
        ) : (
          t("item.requestSentHelp", "Questions? Ask us in the Signal group.")
        )}
      </Typography>

      <Box sx={{ textAlign: "right" }}>
        <Button variant="contained" size="large" onClick={onDone}>
          {t("emailVerification.done", "Done")}
        </Button>
      </Box>
    </Stack>
  );
};

export default RequestSentCard;
