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
        background:
          "linear-gradient(160deg, rgba(8, 20, 17, 0.92), rgba(6, 16, 14, 0.78))",
        borderRadius: 3,
        overflow: "hidden",
        transition:
          "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
        border: "1px solid rgba(0, 227, 159, 0.18)",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.35)",
        height: "100%",
        width: { xs: "100%", sm: "50%", md: 400 },
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          transform: course.id ? "translateY(-4px)" : "none",
          boxShadow: course.id
            ? "0 28px 62px rgba(0, 227, 159, 0.22)"
            : "0 20px 40px rgba(0, 0, 0, 0.35)",
          borderColor: course.id
            ? "rgba(0, 227, 159, 0.34)"
            : "rgba(0, 227, 159, 0.18)",
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
          backgroundColor: "rgba(0, 0, 0, 0.12)",
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
              "linear-gradient(180deg, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 0.4) 100%)",
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
          backgroundColor: "rgba(4, 12, 10, 0.8)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Stack spacing={1}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#E6F4EF" }}>
            {course.name}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "rgba(230, 244, 239, 0.75)",
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
                color: "rgba(230, 244, 239, 0.6)",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: 1.2,
              }}
            >
              Học phí
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#00E39F" }}>
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
              bgcolor: "#00E39F",
              color: "#062720",
              px: 2.5,
              borderRadius: 2,
              boxShadow: "0 12px 28px rgba(0, 227, 159, 0.28)",
              "&:hover": {
                bgcolor: "#0BF2AE",
                boxShadow: "0 16px 36px rgba(11, 242, 174, 0.34)",
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
