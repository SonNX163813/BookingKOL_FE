import React, { useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  Button,
  Stack,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import StarIcon from "@mui/icons-material/Star";

const filterSections = [
  {
    id: "price",
    title: "Price Range",
    options: ["Under $500", "$500 - $1,000", "$1,000 - $5,000", "$5,000+"],
  },
  {
    id: "field",
    title: "Field",
    options: [
      "Fashion",
      "Tech",
      "Gaming",
      "Beauty",
      "Lifestyle",
      "Food",
      "Travel",
      "Fitness",
    ],
  },
  {
    id: "gender",
    title: "Gender",
    options: ["Male", "Female", "Non-binary"],
  },
  {
    id: "rating",
    title: "Rating",
    options: ["5 Stars", "4+ Stars", "3+ Stars", "All Ratings"],
  },
];

const FilterSidebar = () => {
  const [expanded, setExpanded] = useState(["price", "field"]);

  const handleChange = (panel) => (_event, isExpanded) => {
    setExpanded((prev) =>
      isExpanded ? [...prev, panel] : prev.filter((item) => item !== panel)
    );
  };

  return (
    <Paper
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        border: "1px solid #e2e8f0",
        boxShadow: "0 20px 40px rgba(15, 23, 42, 0.06)",
        backgroundColor: "white",
        position: { md: "sticky" },
        top: { md: 88 },
        display: "flex",
        flexDirection: "column",
        gap: 3,
        minHeight: 0,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <FilterListIcon sx={{ color: "#c026d3" }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b" }}>
          Filters
        </Typography>
      </Stack>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {filterSections.map((section) => (
          <Accordion
            key={section.id}
            expanded={expanded.includes(section.id)}
            onChange={handleChange(section.id)}
            disableGutters
            elevation={0}
            square={false}
            sx={{
              border: "none",
              boxShadow: "none",
              backgroundColor: "transparent",
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                px: 0,
                minHeight: "auto",
                "& .MuiAccordionSummary-content": { my: 1 },
              }}
            >
              <Typography sx={{ fontWeight: 600, color: "#1e293b" }}>
                {section.title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0, pt: 0 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {section.options.map((option) => (
                  <FormControlLabel
                    key={option}
                    control={
                      <Checkbox
                        sx={{
                          color: "#c026d3",
                          "&.Mui-checked": { color: "#c026d3" },
                        }}
                      />
                    }
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                      >
                        {section.id === "rating" && option !== "All Ratings" && (
                          <StarIcon sx={{ fontSize: 14, color: "#fbbf24" }} />
                        )}
                        <Typography variant="body2" sx={{ color: "#475569" }}>
                          {option}
                        </Typography>
                      </Box>
                    }
                    sx={{ m: 0 }}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      <Button
        variant="contained"
        fullWidth
        sx={{
          mt: "auto",
          backgroundColor: "#c026d3",
          "&:hover": { backgroundColor: "#a21caf" },
          fontWeight: 600,
          textTransform: "none",
        }}
      >
        Apply Filters
      </Button>
    </Paper>
  );
};

export default FilterSidebar;
