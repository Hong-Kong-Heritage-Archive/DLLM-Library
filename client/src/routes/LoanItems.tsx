import React, { useState } from "react";
import { Container, Box, Tabs, Tab, Typography } from "@mui/material";
import {
  BookmarkBorder as BorrowedIcon,
  Bookmarks as LentIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import BorrowedItemsView from "./BorrowedItemsView";
import OnLoanItemsView from "./OnLoanItemsView";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`loan-tabpanel-${index}`}
      aria-labelledby={`loan-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
};

const LoanItems: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get tab from URL or default to borrowed (1)
  const initialTab = searchParams.get("tab") === "lent" ? 0 : 1;
  const [selectedTab, setSelectedTab] = useState(initialTab);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    // Update URL parameter
    setSearchParams({ tab: newValue === 0 ? "lent" : "borrowed" });
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Sticky Tabs Header */}
      <Box
        sx={{
          position: "sticky",
          top: 64, // Height of AppBar
          zIndex: 10,
          backgroundColor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Container maxWidth="md">
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab
              icon={<LentIcon />}
              label={t("item.myLentItems", "Items I've Lent")}
              id="loan-tab-0"
              aria-controls="loan-tabpanel-0"
              iconPosition="start"
            />
            <Tab
              icon={<BorrowedIcon />}
              label={t("item.myBorrowedItems", "Items I've Borrowed")}
              id="loan-tab-1"
              aria-controls="loan-tabpanel-1"
              iconPosition="start"
            />
          </Tabs>
        </Container>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={selectedTab} index={0}>
        <OnLoanItemsView />
      </TabPanel>
      <TabPanel value={selectedTab} index={1}>
        <BorrowedItemsView />
      </TabPanel>
    </Box>
  );
};

export default LoanItems;
