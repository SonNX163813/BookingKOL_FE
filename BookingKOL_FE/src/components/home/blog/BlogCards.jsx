import React from "react";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { IMG_ASPECT } from "./constants";

const stripHtmlTags = (html) => {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const getPreviewText = (content, length = 140) => {
  const plainText = stripHtmlTags(content);
  if (!plainText) return "Bài viết chưa có nội dung.";
  if (plainText.length <= length) return plainText;
  return `${plainText.slice(0, length)}...`;
};

const extractTopicSource = (blog) => {
  if (!blog) return "";
  if (Array.isArray(blog.tags)) return blog.tags.join(" ");
  return (
    blog.category || blog.topic || blog.tag || blog.author || blog.title || ""
  );
};

const formatShortDate = (dateString) => {
  if (!dateString) return "Chưa cập nhật";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return date.toLocaleDateString("vi-VN");
};

export const FeaturedBlogCard = ({ blog, onSelectBlog }) => {
  if (!blog) return null;
  const topicLabel = extractTopicSource(blog) || "Chia sẻ";
  const createdDate = formatShortDate(blog?.createdAt);
  const previewText = getPreviewText(blog?.content, 110);
  const thumbnailSrc = blog?.thumbnail?.trim();

  const handleNavigate = () => blog?.id && onSelectBlog?.(blog.id);

  return (
    <Card
      elevation={0}
      onClick={handleNavigate}
      sx={{
        borderRadius: 4,
        overflow: "hidden",
        boxShadow: "0 25px 60px rgba(15,23,42,0.12)",
        cursor: blog?.id ? "pointer" : "default",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.35s ease, box-shadow 0.35s ease",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 35px 70px rgba(15,23,42,0.18)",
        },
      }}
    >
      {thumbnailSrc ? (
        <Box
          component="img"
          src={thumbnailSrc}
          alt={blog?.title || "Ảnh minh họa bài viết"}
          loading="lazy"
          sx={{
            width: "100%",
            aspectRatio: IMG_ASPECT,
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <Box
          sx={{
            width: "100%",
            aspectRatio: IMG_ASPECT,
            background:
              "linear-gradient(135deg, rgba(74,116,218,0.15), rgba(244,114,182,0.25))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: "2.25rem",
          }}
        >
          {blog?.title?.charAt(0)?.toUpperCase() ?? "B"}
        </Box>
      )}

      <CardContent
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Stack spacing={1}>
          <Typography
            variant="overline"
            sx={{
              color: "#f97316",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "none",
            }}
          >
            {topicLabel}
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, lineHeight: 1.2, color: "#0f172a" }}
          >
            {blog?.title || "Bài viết không có tiêu đề?"}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {previewText}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {createdDate}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

export const CompactBlogCard = ({ blog, onSelectBlog }) => {
  const topicLabel = extractTopicSource(blog) || "Chia sẻ";
  const createdDate = formatShortDate(blog?.createdAt);
  const previewText = getPreviewText(blog?.content, 110);
  const thumbnailSrc = blog?.thumbnail?.trim();
  const normalizedTitle =
    typeof blog?.title === "string" ? blog.title.trim() : "";
  const fallbackInitial = normalizedTitle
    ? normalizedTitle.charAt(0).toUpperCase()
    : "B";

  const handleNavigate = () => blog?.id && onSelectBlog?.(blog.id);

  return (
    <Card
      elevation={0}
      onClick={handleNavigate}
      sx={{
        borderRadius: 3,
        boxShadow: "0 18px 35px rgba(15,23,42,0.08)",
        p: 2.5,
        display: "flex",
        gap: 2,
        alignItems: "stretch",
        cursor: blog?.id ? "pointer" : "default",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 25px 45px rgba(15,23,42,0.14)",
        },
        minHeight: 120,
      }}
    >
      <Box
        sx={{
          width: 180,
          aspectRatio: IMG_ASPECT,
          borderRadius: 2,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {thumbnailSrc ? (
          <Box
            component="img"
            src={thumbnailSrc}
            alt={blog?.title || "Ảnh minh họa"}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            loading="lazy"
          />
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(135deg, rgba(74,116,218,0.15), rgba(244,114,182,0.2))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1.4rem",
            }}
          >
            {fallbackInitial}
          </Box>
        )}
      </Box>

      <Stack spacing={1} sx={{ flexGrow: 1 }}>
        <Typography
          variant="overline"
          sx={{
            color: "#f97316",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "none",
          }}
        >
          {topicLabel}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, lineHeight: 1.25, color: "#0f172a" }}
        >
          {blog?.title || "Bài viết không có tiêu đề"}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {previewText}
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {createdDate}
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
};

export const BlogGridCard = ({ blog, onSelectBlog }) => {
  const topicLabel = extractTopicSource(blog) || "Chia sẻ";
  const createdDate = formatShortDate(blog?.createdAt);
  const previewText = getPreviewText(blog?.content, 120);
  const thumbnailSrc = blog?.thumbnail?.trim();
  const normalizedTitle =
    typeof blog?.title === "string" ? blog.title.trim() : "";
  const fallbackInitial = normalizedTitle
    ? normalizedTitle.charAt(0).toUpperCase()
    : "B";

  const handleNavigate = () => blog?.id && onSelectBlog?.(blog.id);

  return (
    <Card
      elevation={0}
      onClick={handleNavigate}
      sx={{
        borderRadius: 4,
        overflow: "hidden",
        boxShadow: "0 18px 35px rgba(15,23,42,0.08)",
        cursor: blog?.id ? "pointer" : "default",
        height: "100%", // quan trọng để Grid stretch đều
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 28px 55px rgba(15,23,42,0.16)",
        },
      }}
    >
      {thumbnailSrc ? (
        <Box
          component="img"
          src={thumbnailSrc}
          alt={blog?.title || "Ảnh minh họa"}
          sx={{
            width: "100%",
            aspectRatio: IMG_ASPECT,
            objectFit: "cover",
            display: "block",
            flexShrink: 0,
          }}
          loading="lazy"
        />
      ) : (
        <Box
          sx={{
            width: "100%",
            aspectRatio: IMG_ASPECT,
            background:
              "linear-gradient(135deg, rgba(74,116,218,0.15), rgba(244,114,182,0.2))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: "2rem",
            flexShrink: 0,
          }}
        >
          {fallbackInitial}
        </Box>
      )}

      {/* CONTENT: chia cột và ép chiều cao ổn định */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
          flexGrow: 1, // chiếm hết phần còn lại để footer sát đáy
          minHeight: 0, // tránh overflow khi flex
        }}
      >
        <Typography
          variant="overline"
          sx={{
            color: "#f97316",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "none",
            flexShrink: 0,
          }}
        >
          {topicLabel}
        </Typography>

        {/* TIÊU ĐỀ: cố định 2 dòng */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            lineHeight: 1.3,
            color: "#0f172a",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            // đảm bảo chiều cao bằng nhau cho 2 dòng
            minHeight: "2.6em", // 1.3 (lineHeight) * 2 lines
            flexShrink: 0,
          }}
        >
          {blog?.title || "Bài viết chưa có tiêu đề?"}
        </Typography>

        {/* MÔ TẢ: cố định 3 dòng */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.5,
            // đảm bảo chiều cao bằng nhau cho 3 dòng
            minHeight: "4.5em", // 1.5 * 3 lines
            // cho phép phần này co giãn nhưng không đẩy footer chạy
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          {previewText}
        </Typography>

        {/* FOOTER: luôn nằm sát đáy nhờ mt: "auto" */}
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ mt: "auto", flexShrink: 0 }}
        >
          <Typography variant="caption" color="text.secondary">
            {createdDate}
          </Typography>
          {/* <Typography variant="caption" color="text.secondary">
            •
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {blog?.readingTime || "5 phút đọc"}
          </Typography> */}
        </Stack>
      </Box>
    </Card>
  );
};
