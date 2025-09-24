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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import StarIcon from "@mui/icons-material/Star";

const FilterSidebar = () => {
  const [expanded, setExpanded] = useState(["price", "field"]);

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

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(
      isExpanded ? [...expanded, panel] : expanded.filter((p) => p !== panel)
    );
  };

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        boxShadow: 1,
        border: "1px solid #e5e7eb",
        position: "sticky",
        top: 96,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <FilterListIcon sx={{ color: "#c026d3" }} />
        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1e293b" }}>
          Filters
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {filterSections.map((section) => (
          <Accordion
            key={section.id}
            expanded={expanded.includes(section.id)}
            onChange={handleChange(section.id)}
            sx={{
              boxShadow: "none",
              border: "none",
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
              <Typography sx={{ fontWeight: "semibold", color: "#1e293b" }}>
                {section.title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0, pt: 0 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {section.options.map((option, index) => (
                  <FormControlLabel
                    key={index}
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
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        {section.id === "rating" &&
                          option !== "All Ratings" && (
                            <StarIcon sx={{ fontSize: 14, color: "#fbbf24" }} />
                          )}
                        <Typography variant="body2" sx={{ color: "#475569" }}>
                          {option}
                        </Typography>
                      </Box>
                    }
                    sx={{
                      m: 0,
                      "& .MuiFormControlLabel-label": { fontSize: "0.875rem" },
                    }}
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
          mt: 3,
          backgroundColor: "#c026d3",
          "&:hover": { backgroundColor: "#a21caf" },
          fontWeight: "semibold",
        }}
      >
        Apply Filters
      </Button>
    </Paper>
  );
};

export default FilterSidebar;
