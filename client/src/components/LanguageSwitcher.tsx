import React from "react";
import {
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface LanguageSwitcherProps {
  color?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  color = "inherit",
}) => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    i18n.changeLanguage(event.target.value);
  };
  const langList = ["zh-HK", "en", "zh-TW"];

  const getLanguageLabel = (langCode: string) => {
    switch (langCode) {
      case "zh-HK":
        return "港文";
      case "zh-TW":
        return "正體";
      case "en":
        return "EN";
    }
    return "EN";
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", color }}>
      <FormControl size="small" sx={{ minWidth: 80 }}>
        <Select
          value={i18n.language}
          onChange={handleLanguageChange}
          variant="outlined"
          sx={{
            color: "var(--color-text-primary)",
            fontSize: "14px",
            fontFamily: "var(--font-family-body)",
            backgroundColor: "var(--color-bg-canvas)",
            borderRadius: "6px",
            height: "36px",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--color-border-soft)",
              borderWidth: "1px",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--color-border-strong)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--color-brand-primary)",
            },
            "& .MuiSvgIcon-root": {
              color: "var(--color-text-muted)",
            },
            "& .MuiSelect-select": {
              paddingLeft: "12px",
              paddingRight: "24px !important",
              paddingTop: "6px",
              paddingBottom: "6px",
            },
          }}
        >
          {langList.map((lang) => (
            <MenuItem key={lang} value={lang} sx={{ fontSize: "14px" }}>
              {getLanguageLabel(lang)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default LanguageSwitcher;
