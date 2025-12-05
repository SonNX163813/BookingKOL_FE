import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useNavigate, useParams } from "react-router-dom";
import { fetchBlogDetail } from "../../../services/blog/BlogAPI";

const PAGE_BACKGROUND = `
  radial-gradient(90% 90% at 15% 50%, rgba(74, 116, 218, 0.08) 0%, rgba(147, 206, 246, 0.03) 60%, rgba(147, 206, 246, 0) 90%),
  radial-gradient(90% 90% at 85% 20%, rgba(255, 161, 218, 0.12) 0%, rgba(255, 161, 218, 0) 65%)
`;

const formatDateTime = (dateString) => {
  if (!dateString) {
    return "Chưa cập nhật";
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Chưa cập nhật";
  }
  const time = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const day = date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${time} ${day}`;
};

const normalizeMessage = (error) => {
  const rawMessage = error?.response?.data?.message;
  if (Array.isArray(rawMessage)) {
    return rawMessage.filter(Boolean).join(" ");
  }
  if (typeof rawMessage === "string" && rawMessage.trim()) {
    return rawMessage.trim();
  }
  if (error?.message) {
    return error.message;
  }
  return "Không thể tải chi tiết blog. Vui lòng thử lại.";
};

const getTopicLabel = (blog) => {
  if (!blog) {
    return "Chia sẻ";
  }
  if (Array.isArray(blog.tags) && blog.tags.length) {
    return blog.tags[0];
  }
  return blog.category || blog.topic || blog.label || "Chia sẻ";
};

const getContentHtml = (blog) =>
  blog?.content?.trim() ? blog.content : "Bài viết đang được cập nhật.";

const BlogDetailPage = () => {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const loadBlogDetail = useCallback(async () => {
    if (!blogId) {
      setErrorMessage("Không tìm thấy blog.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchBlogDetail(blogId);
      setBlog(data);
    } catch (error) {
      setErrorMessage(normalizeMessage(error));
      setBlog(null);
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  useEffect(() => {
    loadBlogDetail();
  }, [loadBlogDetail]);

  const topicLabel = useMemo(() => getTopicLabel(blog), [blog]);
  const formattedDateTime = useMemo(
    () => formatDateTime(blog?.createdAt),
    [blog?.createdAt]
  );

  const contentHtml = useMemo(() => getContentHtml(blog), [blog]);

  const handleBack = () => navigate(-1);

  const renderLoading = () => (
    <Box
      sx={{
        borderRadius: 4,
        p: { xs: 3, md: 5 },
        backgroundColor: "#ffffff",
        boxShadow: "0 20px 45px rgba(15,23,42,0.08)",
      }}
    >
      <Stack spacing={2}>
        <Skeleton variant="text" width="20%" height={18} />
        <Skeleton variant="text" width="80%" height={46} />
        <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 3 }} />
        <Skeleton variant="text" width="100%" height={28} />
        <Skeleton variant="text" width="90%" height={28} />
        <Skeleton variant="text" width="95%" height={28} />
      </Stack>
    </Box>
  );

  const renderError = () => (
    <Stack spacing={2} alignItems="center" sx={{ py: 6 }}>
      <Typography variant="body1" color="error">
        {errorMessage}
      </Typography>
      <Button
        variant="contained"
        onClick={loadBlogDetail}
        sx={{ textTransform: "none" }}
      >
        Thử lại
      </Button>
    </Stack>
  );

  const renderContent = () => (
    <Box
      sx={{
        borderRadius: 4,
        p: { xs: 3, md: 5 },
        backgroundColor: "#ffffff",
        boxShadow: "0 30px 65px rgba(15,23,42,0.12)",
      }}
    >
      <Stack spacing={3}>
        {/* <Typography variant="body2" color="text.secondary">
          Blog / {blog?.title || "Chi tiết"}
        </Typography> */}

        <Stack spacing={1}>
          {/* <Typography
            variant="overline"
            sx={{ color: "#f97316", fontWeight: 700, letterSpacing: "0.08em" }}
          >
            {topicLabel}
          </Typography> */}
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: "42px",
              // textTransform: "uppercase",
              // fontSize: "32px",
            }}
          >
            {blog?.title || "Bài viết không có tiêu đề"}
          </Typography>
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Typography variant="body2" color="text.secondary">
            {blog?.author
              ? `Người viết: ${blog.author}`
              : "Tác giả đang cập nhật"}
          </Typography>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formattedDateTime}
            </Typography>
          </Stack>
        </Stack>

        {/* {blog?.thumbnail?.trim() && (
          <Box
            component="img"
            src={blog.thumbnail}
            alt={blog?.title || "Ảnh minh họa bài viết"}
            sx={{
              width: "100%",
              // borderRadius: 4,
              objectFit: "cover",
              boxShadow: "0 25px 60px rgba(15,23,42,0.15)",
              maxHeight: "100%",
            }}
          />
        )} */}

        <Box
          // sx={{
          //   mt: 1,
          //   color: "#0f172a",
          //   lineHeight: 1.8,
          //   fontSize: 16,
          //   "& h2": {
          //     color: "#dc2626",
          //     fontWeight: 700,
          //     marginTop: 4,
          //     marginBottom: 1.5,
          //     textTransform: "uppercase",
          //   },
          //   "& h3": {
          //     color: "#dc2626",
          //     fontWeight: 700,
          //     marginTop: 3,
          //   },
          //   "& p": {
          //     marginBottom: 2,
          //     color: "#0f172a",
          //   },
          //   "& strong": {
          //     color: "#111827",
          //   },
          //   "& img": {
          //     maxWidth: "100%",
          //     borderRadius: 3,
          //     margin: "20px auto",
          //     display: "block",
          //   },
          //   "& ul": {
          //     paddingLeft: "1.25rem",
          //     marginBottom: 2,
          //   },
          //   "& li": {
          //     marginBottom: 1,
          //   },
          // }}
          component="article"
          sx={{
            mt: 1,
            color: "#0f172a",
            lineHeight: 1.8,
            fontSize: 16,

            // Headings trong nội dung
            "& h1, & h2, & h3, & h4, & h5, & h6": {
              fontWeight: 800,
              lineHeight: 1.25,
              // mt: 4,
              // mb: 1.5,
              color: "#0f172a",
              textTransform: "none",
            },
            "& h2": { fontSize: 24, color: "#dc2626" },
            "& h3": { fontSize: 20, color: "#dc2626" },

            // ĐOẠN QUAN TRỌNG – khôi phục hiển thị list
            "& ul, & ol": {
              pl: "1.5rem",
              mb: 2,
              listStylePosition: "outside",
            },
            "& ul": { listStyleType: "disc" },
            "& ol": { listStyleType: "decimal" },
            "& li": {
              // một số reset đặt display khác -> đảm bảo block
              display: "list-item",
            },

            // Đoạn văn & chữ đậm
            "& strong": { color: "#111827" },

            // Link
            "& a": {
              color: "#2563eb",
              textDecoration: "underline",
              "&:hover": { color: "#1d4ed8" },
            },
          }}
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </Stack>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: PAGE_BACKGROUND,
        backgroundColor: "#f8fafc",
        py: { xs: 5, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Button
            onClick={handleBack}
            startIcon={<ArrowBackRoundedIcon />}
            sx={{
              alignSelf: "flex-start",
              textTransform: "none",
              borderRadius: 3,
              border: "1px solid rgba(148,163,184,0.7)",
              backgroundColor: "#ffffff",
              color: "#4f46e5",
              fontWeight: 600,
              px: 2.5,
              py: 1,
              boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
              "&:hover": {
                backgroundColor: "#eef2ff",
                borderColor: "#6366f1",
              },
            }}
          >
            Trở về Blog
          </Button>

          {loading && renderLoading()}
          {!loading && errorMessage && renderError()}
          {!loading && !errorMessage && blog && renderContent()}
          {!loading && !errorMessage && !blog && (
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
            >
              Không tìm thấy nội dung bài viết này.
            </Typography>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default BlogDetailPage;
