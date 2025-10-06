import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CategoryIcon from "@mui/icons-material/Category";
import ViewListIcon from "@mui/icons-material/ViewList";
import { industriesGroups } from "./data";

const sectionSx = {
  // mx: { xs: 2, md: 4 },
  // borderRadius: { xs: 3, md: 4 },
  overflow: "hidden",
  // backgroundColor: "#ffffff",
  // backgroundImage: `
  //   radial-gradient(circle at 16% 18%, rgba(141, 226, 237, 0.55), rgba(255, 255, 255, 0) 58%),
  //   radial-gradient(circle at 84% 0%, rgba(147, 206, 246, 0.5), rgba(255, 255, 255, 0) 55%),
  //   radial-gradient(circle at 50% 100%, rgba(74, 116, 218, 0.25), rgba(255, 255, 255, 0.9) 70%)
  // `,
  // boxShadow: "0 18px 42px rgba(74, 116, 218, 0.12)",
  color: "#0f172a",
};

const toggleGroupSx = {
  backgroundColor: "rgba(255, 255, 255, 0.84)",
  borderRadius: "999px",
  p: 0.5,
  boxShadow: "0 16px 30px rgba(74, 116, 218, 0.12)",
  border: "1px solid rgba(147, 206, 246, 0.35)",
  "& .MuiToggleButton-root": {
    borderRadius: "999px !important",
    px: 2.75,
    textTransform: "none",
    fontWeight: 600,
    color: "#0f172a",
  },
  "& .MuiToggleButton-root.Mui-selected": {
    backgroundImage:
      "radial-gradient(circle at 50% 50%, rgba(141, 226, 237, 0.65), rgba(147, 206, 246, 0.35))",
    color: "#0f172a",
  },
};

const chipSx = {
  px: 1.75,
  py: 0.6,
  borderRadius: "999px",
  fontWeight: 500,
  fontSize: "0.95rem",
  backgroundColor: "rgba(255, 255, 255, 0.92)",
  backgroundImage:
    "radial-gradient(circle at top, rgba(147, 206, 246, 0.35), rgba(255, 255, 255, 0.9))",
  color: "#0f172a",
  border: "1px solid rgba(147, 206, 246, 0.45)",
  boxShadow: "0 10px 20px rgba(74, 116, 218, 0.12)",
};

const buttonSx = {
  borderRadius: "14px",
  px: 3,
  backgroundImage: "linear-gradient(135deg, #4a74da, #93cef6)",
  boxShadow: "0px 16px 28px rgba(74, 116, 218, 0.2)",
};

const IndustriesSection = () => {
  const [activeGroup, setActiveGroup] = useState(
    industriesGroups[0]?.key ?? ""
  );

  const currentGroup = useMemo(
    () =>
      industriesGroups.find((group) => group.key === activeGroup) ??
      industriesGroups[0],
    [activeGroup]
  );

  if (!currentGroup) {
    return null;
  }

  return (
    <Box component="section" id="industries" sx={sectionSx}>
      <Container maxWidth="1300px" sx={{ py: { xs: 8, md: 10 } }}>
        <Stack
          spacing={3}
          sx={{ alignItems: "center", textAlign: "center", color: "#0f172a" }}
        >
          <Typography
            variant="overline"
            sx={{
              fontSize: "1rem",
              letterSpacing: 2,
              color: "rgba(15, 23, 42, 0.55)",
            }}
          >
            Ngành hàng & lĩnh vực
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Linh hoạt triển khai đa ngành
          </Typography>
          <ToggleButtonGroup
            value={activeGroup}
            exclusive
            onChange={(_, value) => value && setActiveGroup(value)}
            sx={toggleGroupSx}
          >
            {industriesGroups.map((group) => (
              <ToggleButton key={group.key} value={group.key}>
                {group.key === "services" ? (
                  <ViewListIcon sx={{ mr: 1 }} />
                ) : (
                  <CategoryIcon sx={{ mr: 1 }} />
                )}
                {group.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Stack
          direction="row"
          flexWrap="wrap"
          spacing={2}
          useFlexGap
          sx={{ mt: 4, justifyContent: "center" }}
        >
          {currentGroup.items.map((item) => (
            <Chip key={item} label={item} sx={chipSx} />
          ))}
        </Stack>

        <Stack alignItems="center" sx={{ mt: 4 }}>
          <Button component="a" href="#cases" variant="contained" sx={buttonSx}>
            Xem case theo ngành của bạn
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};

export default IndustriesSection;
