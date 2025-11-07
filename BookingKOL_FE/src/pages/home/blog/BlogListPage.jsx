import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { fetchBlogs } from "../../../services/blog/BlogAPI";

const PAGE_SIZE = 10;
const PAGE_BACKGROUND = `
  radial-gradient(90% 90% tại 15% 50%, rgba(74, 116, 218, 0.24) 0%, rgba(147, 206, 246, 0.06) 60%, rgba(147, 206, 246, 0) 90%),
  radial-gradient(90% 90% tại 85% 20%, rgba(255, 161, 218, 0.18) 0%, rgba(255, 161, 218, 0) 65%)
`;
const PRIMARY_BUTTON_SX = {
  textTransform: "none",
  borderRadius: 999,
  px: 3,
  py: 1.2,
  fontWeight: 700,
  color: "#ffffff",
  backgroundImage: "linear-gradient(135deg, #4a74da 0%, #93cef6 100%)",
  boxShadow: "0 18px 30px rgba(74, 116, 218, 0.28)",
  "&:hover": {
    boxShadow: "0 24px 35px rgba(74, 116, 218, 0.35)",
    backgroundImage: "linear-gradient(135deg, #5c82e2 0%, #a6d9f9 100%)",
  },
};

const BLOG_TOPICS = [
  { label: "Tất cả", value: "all" },
  { label: "Tin tức", value: "news" },
  { label: "Chiến dịch", value: "campaign" },
  { label: "Góc KOL", value: "kol" },
  { label: "Hướng dẫn", value: "guide" },
];

const getPreviewText = (content, length = 140) => {
  if (!content || typeof content !== "string") {
    return "Bài viết chưa có nội dung.";
  }
  const trimmed = content.trim();
  if (trimmed.length <= length) {
    return trimmed;
  }
  return `${trimmed.slice(0, length)}...`;
};

const extractTopicSource = (blog) => {
  if (!blog) {
    return "";
  }
  if (Array.isArray(blog.tags)) {
    return blog.tags.join(" ");
  }
  return (
    blog.category || blog.topic || blog.tag || blog.author || blog.title || ""
  );
};

const formatDate = (dateString) => {
  if (!dateString) {
    return "Chưa cập nhật";
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Chưa cập nhật";
  }
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const normalizeErrorMessage = (error) => {
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
  return "Không thể tải danh sách blog. Vui lòng thử lại.";
};

const BlogCard = ({ blog, onSelectBlog }) => {
  const createdDate = formatDate(blog?.createdAt);
  const content = blog?.content?.trim()
    ? blog.content
    : "Bài viết chưa có nội dung.";

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: "24px",
        background:
          "radial-gradient(circle at 30% 10%, rgba(147,206,246,0.15) 0%, rgba(255,255,255,0.85) 70%)",
        border: "1px solid rgba(74,116,218,0.1)",
        boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
        backdropFilter: "blur(12px)",
        transition: "all 0.35s ease",
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: "0 28px 60px rgba(74,116,218,0.18)",
          background:
            "radial-gradient(circle at 20% 0%, rgba(74,116,218,0.08), rgba(255,255,255,0.95))",
        },
      }}
    >
      <CardContent
        sx={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <Stack spacing={2} sx={{ flexGrow: 1 }}>
          {/* Tác giả + Tiêu đề */}
          <Stack spacing={1}>
            <Chip
              size="small"
              label={blog?.author || "Không rõ tác giả"}
              sx={{
                borderRadius: 999,
                alignSelf: "flex-start",
                bgcolor: "rgba(74,116,218,0.08)",
                color: "#2f3c8c",
                fontWeight: 600,
              }}
            />
            <Typography
              component="h3"
              variant="h6"
              sx={{
                color: "#0f172a",
                fontWeight: 700,
                lineHeight: 1.3,
                minHeight: "3.5rem",
              }}
            >
              {blog?.title || "Bài viết không có tiêu đề"}
            </Typography>
          </Stack>

          {/* Nội dung tóm tắt */}
          <Typography
            variant="body2"
            sx={{
              color: "rgba(15,23,42,0.7)",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.6,
            }}
          >
            {content}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Ngày đăng + nút */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ pt: 1 }}
            spacing={3}
          >
            <Typography
              variant="caption"
              sx={{ color: "rgba(15,23,42,0.6)", fontStyle: "italic" }}
            >
              Ngày đăng: {createdDate}
            </Typography>
            <Button
              variant="contained"
              sx={PRIMARY_BUTTON_SX}
              onClick={() => onSelectBlog?.(blog?.id)}
              disabled={!blog?.id}
            >
              Xem chi tiết
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

const BlogListPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [page, setPage] = useState(0);
  const [pageMeta, setPageMeta] = useState({
    totalPages: 0,
    totalElements: 0,
  });
  const [selectedTopic, setSelectedTopic] = useState("all");

  const navigate = useNavigate();

  const loadBlogs = useCallback(async (targetPage = 0) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchBlogs({
        page: targetPage,
        size: PAGE_SIZE,
      });
      setBlogs(data.content);
      setPageMeta({
        totalPages: data?.totalPages ?? 0,
        totalElements: data?.totalElements ?? data?.content?.length ?? 0,
      });
    } catch (error) {
      setErrorMessage(normalizeErrorMessage(error));
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlogs(page);
  }, [loadBlogs, page]);

  const displayedBlogs = useMemo(() => {
    if (selectedTopic === "all") {
      return blogs;
    }
    const normalizedTopic = selectedTopic.toLowerCase();
    return blogs.filter((blog) =>
      extractTopicSource(blog).toLowerCase().includes(normalizedTopic)
    );
  }, [blogs, selectedTopic]);

  const hasBlogs = displayedBlogs.length > 0;
  const isFilterActive = selectedTopic !== "all";
  const emptyByFilter = !hasBlogs && blogs.length > 0 && isFilterActive;

  const handleRetry = () => {
    loadBlogs(page);
  };

  const handlePageChange = (_event, value) => {
    setPage(value - 1);
  };

  const totalPages = useMemo(
    () => Math.max(pageMeta.totalPages, hasBlogs ? 1 : 0),
    [pageMeta.totalPages, hasBlogs]
  );

  const handleSelectBlog = useCallback(
    (blogId) => {
      if (!blogId) return;
      navigate(`/blog/${blogId}`);
    },
    [navigate]
  );

  const handleSelectTopic = useCallback(
    (topicValue) => () => {
      setSelectedTopic((prev) => (prev === topicValue ? "all" : topicValue));
    },
    []
  );

  const handleClearTopic = useCallback(() => {
    setSelectedTopic("all");
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        bgcolor: "#ffffff",
        overflow: "hidden",
        py: { xs: 8, md: 12 },
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background: PAGE_BACKGROUND,
          opacity: 0.65,
        }}
      />
      <Container
        maxWidth={false}
        sx={{
          position: "relative",
          zIndex: 1,
          color: "#0f172a",
          maxWidth: "1400px",
        }}
      >
        <Stack spacing={6}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "minmax(280px, 340px) minmax(0, 1fr)",
              },
              gap: { xs: 4, sm: 4.5, md: 6 },
              alignItems: "start",
            }}
          >
            <Stack
              spacing={3}
              sx={{
                borderRadius: { xs: 3, md: 4 },
                background: "rgba(255,255,255,0.95)",
                boxShadow: "0 50px 90px rgba(15, 23, 42, 0.12)",
                backdropFilter: "blur(18px)",
                px: { xs: 3, md: 4 },
                py: { xs: 3, md: 4 },
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(135deg, rgba(74,116,218,0.18), rgba(255,161,218,0.12))",
                  opacity: 0.85,
                }}
              />
              <Stack spacing={2} sx={{ position: "relative", zIndex: 1 }}>
                {/* <Stack spacing={1}>
                  <Chip
                    size="small"
                    label="Blog noi bat"
                    sx={{
                      borderRadius: 999,
                      alignSelf: "flex-start",
                      fontWeight: 600,
                      bgcolor: "rgba(15,23,42,0.08)",
                    }}
                  />
                  <Typography
                    component="h1"
                    variant="h4"
                    sx={{ fontWeight: 800, lineHeight: 1.2 }}
                  >
                    {featuredBlog?.title || "Dang cap nhat"}
                  </Typography>
                </Stack> */}
                {/* <Typography
                  variant="body2"
                  sx={{ color: "rgba(15,23,42,0.75)" }}
                >
                  {getPreviewText(featuredBlog?.content)}
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    ...PRIMARY_BUTTON_SX,
                    alignSelf: "flex-start",
                    boxShadow: "0 20px 35px rgba(74, 116, 218, 0.35)",
                  }}
                  onClick={() => handleSelectBlog(featuredBlog?.id)}
                  disabled={!featuredBlog?.id}
                >
                  Doc ngay
                </Button> */}
                <Typography
                  component="h1"
                  variant="h3"
                  sx={{ fontWeight: 800, letterSpacing: -0.5 }}
                >
                  Blog & Tin tức
                </Typography>
                <Typography
                  variant="body1"
                  // sx={{ color: "rgba(248,250,252,0.8)" }}
                >
                  Cập nhật liên tục xu hướng, câu chuyện thành công và kinh
                  nghiệm từ BookingKOL để giúp chiến dịch của bạn bứt phá.
                </Typography>
              </Stack>

              {/* <Stack spacing={1.5} sx={{ position: "relative", zIndex: 1 }}>
                <Typography
                  variant="overline"
                  sx={{ color: "rgba(15,23,42,0.6)", letterSpacing: 1 }}
                >
                  Chu de noi bat
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {BLOG_TOPICS.map((topic) => {
                    const isActive = selectedTopic === topic.value;
                    return (
                      <Chip
                        key={topic.value}
                        label={topic.label}
                        onClick={handleSelectTopic(topic.value)}
                        sx={{
                          borderRadius: 999,
                          fontWeight: 600,
                          px: 1.5,
                          color: isActive ? "#1d3ab6" : "#0f172a",
                          bgcolor: isActive
                            ? "rgba(74,116,218,0.18)"
                            : "rgba(15,23,42,0.05)",
                          border: "1px solid",
                          borderColor: isActive
                            ? "rgba(74,116,218,0.4)"
                            : "transparent",
                        }}
                      />
                    );
                  })}
                </Stack>
              </Stack> */}

              {/* <Stack spacing={1.5} sx={{ position: "relative", zIndex: 1 }}>
                <Typography
                  variant="overline"
                  sx={{ color: "rgba(15,23,42,0.6)", letterSpacing: 1 }}
                >
                  So lieu nhanh
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 1.5,
                  }}
                >
                  {statCards.map((stat) => (
                    <Box
                      key={stat.label}
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        py: 2,
                        backgroundColor: "rgba(255,255,255,0.95)",
                        border: "1px solid rgba(15,23,42,0.08)",
                      }}
                    >
                      <Typography
                        variant="overline"
                        sx={{ color: "rgba(15,23,42,0.55)" }}
                      >
                        {stat.label}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {stat.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Stack> */}
            </Stack>

            <Box
              sx={
                {
                  // borderRadius: { xs: 3, md: 4 },
                  // background: "rgba(255,255,255,0.98)",
                  // boxShadow: "0 30px 60px rgba(15, 23, 42, 0.15)",
                  // px: { xs: 2.5, md: 4 },
                  // py: { xs: 3, md: 4 },
                  // minHeight: "55vh",
                }
              }
            >
              {loading ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "40vh",
                  }}
                >
                  <CircularProgress sx={{ color: "#4a74da" }} />
                </Box>
              ) : errorMessage ? (
                <Stack spacing={2} alignItems="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="error">
                    {errorMessage}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleRetry}
                    sx={PRIMARY_BUTTON_SX}
                  >
                    Thu lai
                  </Button>
                </Stack>
              ) : hasBlogs ? (
                <>
                  <Grid container spacing={3}>
                    {displayedBlogs.map((blog, index) => {
                      const key =
                        blog?.id ??
                        (blog?.title ? `${blog.title}-${index}` : index);
                      return (
                        <Grid item xs={12} sm={6} md={4} key={key}>
                          <BlogCard
                            blog={blog}
                            onSelectBlog={handleSelectBlog}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                  {totalPages > 1 && (
                    <Stack alignItems="center" sx={{ mt: 4 }}>
                      <Pagination
                        count={totalPages}
                        page={page + 1}
                        onChange={handlePageChange}
                        color="primary"
                        shape="rounded"
                      />
                    </Stack>
                  )}
                </>
              ) : emptyByFilter ? (
                <Stack spacing={1.5} alignItems="center" sx={{ py: 6 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "#0f172a" }}
                  >
                    Không có bài viết phù hợp với chủ đề này
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    Thử đổi chủ đề hoặc xoá bộ lọc để xem tất cả bài viết hiện
                    có.
                  </Typography>
                  <Button
                    variant="text"
                    onClick={handleClearTopic}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Xoá lọc chủ đề
                  </Button>
                </Stack>
              ) : (
                <Stack spacing={1.5} alignItems="center" sx={{ py: 6 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "#0f172a" }}
                  >
                    Chưa có bài viết nào
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quay lại sau để xem những chia sẻ mới nhất từ BookingKOL.
                  </Typography>
                </Stack>
              )}
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default BlogListPage;
