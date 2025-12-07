import React from "react";
import {
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
} from "@mui/material";
import { Language } from "@mui/icons-material";
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
  const langList = ["en", "zh-TW", "zh-HK"];

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color }}>
      <Language />
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select
          value={i18n.language}
          onChange={handleLanguageChange}
          variant="outlined"
          sx={{
            color,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: color,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: color,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: color,
            },
            "& .MuiSvgIcon-root": {
              color,
            },
          }}
        >
          {langList.map((lang) => (
            <MenuItem key={lang} value={lang}>
              {t(`languages.${lang}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default LanguageSwitcher;
