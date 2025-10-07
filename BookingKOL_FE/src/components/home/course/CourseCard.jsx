import React from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Stack,
  Typography,
  Button,
  Box,
} from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";

const CourseCard = ({ course, onSelect }) => {
  const handleCardClick = () => {
    if (course.id) {
      onSelect(course.id, course.slug);
    }
  };

  const handleButtonClick = (event) => {
    event.stopPropagation();
    handleCardClick();
  };

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        cursor: course.id ? "pointer" : "default",
        backgroundColor: "#ffffff",
        borderRadius: { xs: 3, md: 4 },
        overflow: "hidden",
        transition:
          "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
        border: "1px solid rgba(74, 116, 218, 0.18)",
        boxShadow: "0 24px 48px rgba(74, 116, 218, 0.12)",
        height: "100%",
        width: { xs: "100%", sm: "50%", md: 400 },
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          transform: course.id ? "translateY(-4px)" : "none",
          boxShadow: course.id
            ? "0 32px 64px rgba(74, 116, 218, 0.22)"
            : "0 24px 48px rgba(74, 116, 218, 0.12)",
          borderColor: course.id
            ? "rgba(74, 116, 218, 0.35)"
            : "rgba(74, 116, 218, 0.18)",
        },
        "&:hover .course-card__media": {
          transform: course.id ? "scale(1.04)" : "scale(1)",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: { xs: 220, sm: 220, md: 300 },
          aspectRatio: { xs: "16 / 11", sm: "16 / 10", md: "16 / 9" },
          overflow: "hidden",
          backgroundColor: "rgba(15, 23, 42, 0.06)",
        }}
      >
        <CardMedia
          component="img"
          image={course.cover}
          alt={course.name}
          className="course-card__media"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            transition: "transform 320ms ease",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(15, 23, 42, 0) 60%, rgba(15, 23, 42, 0.18) 100%)",
            pointerEvents: "none",
          }}
        />
      </Box>
      <CardContent
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          gap: 1.75,
          p: 3,
          backgroundColor: "#ffffff",
        }}
      >
        <Stack spacing={1}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
            {course.name}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "rgba(15, 23, 42, 0.7)",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: 60,
            }}
          >
            {course.description}
          </Typography>
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mt: "auto" }}
        >
          <Stack spacing={0.5}>
            <Typography
              sx={{
                color: "rgba(15, 23, 42, 0.6)",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: 1.2,
              }}
            >
              Học phí
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#4a74da" }}>
              {course.priceLabel}
            </Typography>
          </Stack>
          <Button
            variant="contained"
            size="small"
            endIcon={<PlayArrowRoundedIcon sx={{ fontSize: 20 }} />}
            disabled={!course.id}
            onClick={handleButtonClick}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#4a74da",
              color: "#ffffff",
              px: 2.5,
              borderRadius: 2,
              boxShadow: "0 12px 28px rgba(74, 116, 218, 0.18)",
              "&:hover": {
                bgcolor: "#3b5ec8",
                boxShadow: "0 16px 36px rgba(59, 94, 200, 0.24)",
              },
            }}
          >
            Xem chi tiết
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
