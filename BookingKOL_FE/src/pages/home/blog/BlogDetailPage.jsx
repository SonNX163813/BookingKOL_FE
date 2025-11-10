import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Button,
  Container,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { Empty, Spin } from "antd";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useNavigate, useParams } from "react-router-dom";
import { fetchBlogDetail } from "../../../services/blog/BlogAPI";
import { ArrowLeft } from "lucide-react";
const PAGE_BACKGROUND = `
  radial-gradient(90% 90% at 15% 50%, rgba(74, 116, 218, 0.24) 0%, rgba(147, 206, 246, 0.06) 60%, rgba(147, 206, 246, 0) 90%),
  radial-gradient(90% 90% at 85% 20%, rgba(255, 161, 218, 0.18) 0%, rgba(255, 161, 218, 0) 65%)
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

// Chuẩn hóa thông báo lỗi
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

// Định dạng ngày hiển thị
const formatDate = (dateString) => {
  if (!dateString) return "Chưa cập nhật";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const BlogDetailPage = () => {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Xử lý trạng thái bài viết
  const statusInfo = useMemo(() => {
    if (!blog) {
      return {
        label: "Đang cập nhật",
        chipBg: "rgba(15,23,42,0.08)",
        chipColor: "#0f172a",
      };
    }
    if (blog.isPublish) {
      return {
        label: "Đã xuất bản",
        chipBg: "rgba(74,116,218,0.15)",
        chipColor: "#1d3ab6",
      };
    }
    return {
      label: "Bản nháp",
      chipBg: "rgba(244,114,182,0.2)",
      chipColor: "#be185d",
    };
  }, [blog]);

  // Dữ liệu tóm tắt hiển thị nhanh
  const heroMetadata = useMemo(
    () => [
      {
        label: "Tác giả",
        value: blog?.author || "Đang cập nhật",
      },
      {
        label: "Ngày đăng",
        value: formatDate(blog?.createdAt),
      },
      {
        label: "Trạng thái",
        value: statusInfo.label,
      },
    ],
    [blog, statusInfo.label]
  );

  // Hàm tải chi tiết blog
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

  // Xử lý nút quay lại
  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length <= 2) {
      navigate("/blog");
      return;
    }
    navigate(-1);
  }, [navigate]);

  // Phần tiêu đề + thông tin chính
  const renderHeroContent = () => {
    if (loading) {
      return (
        <Stack spacing={1.5}>
          <Skeleton
            variant="text"
            height={32}
            width="40%"
            sx={{ bgcolor: "rgba(15,23,42,0.08)" }}
          />
          <Skeleton
            variant="text"
            height={56}
            sx={{ bgcolor: "rgba(15,23,42,0.08)" }}
          />
          <Skeleton
            variant="text"
            height={24}
            width="60%"
            sx={{ bgcolor: "rgba(15,23,42,0.08)" }}
          />
        </Stack>
      );
    }

    const title = blog?.title || "Bài viết không tiêu đề";
    const author = blog?.author
      ? `Tác giả: ${blog.author}`
      : "Tác giả: Đang cập nhật";
    const createdDate = formatDate(blog?.createdAt);
    const statusLabel = statusInfo.label;

    return (
      <Stack spacing={2}>
        <Chip
          label={statusLabel}
          sx={{
            alignSelf: "flex-start",
            borderRadius: 999,
            bgcolor: statusInfo.chipBg,
            color: statusInfo.chipColor,
            fontWeight: 600,
          }}
        />
        <Typography
          component="h1"
          variant="h3"
          sx={{ fontWeight: 800, letterSpacing: -0.5, color: "#0f172a" }}
        >
          {title}
        </Typography>
        <Stack spacing={0.5}>
          <Typography variant="body1" sx={{ color: "rgba(15,23,42,0.8)" }}>
            {author}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(15,23,42,0.6)" }}>
            Ngày đăng: {createdDate}
          </Typography>
        </Stack>
      </Stack>
    );
  };

  // Phần nội dung chính của blog
  // const renderBodyContent = () => {
  //   if (loading) {
  //     return (
  //       <Stack spacing={2}>
  //         <Skeleton
  //           variant="text"
  //           height={32}
  //           sx={{ bgcolor: "rgba(15,23,42,0.08)" }}
  //         />
  //         <Skeleton
  //           variant="text"
  //           height={24}
  //           width="70%"
  //           sx={{ bgcolor: "rgba(15,23,42,0.08)" }}
  //         />
  //         <Skeleton
  //           variant="rectangular"
  //           height={300}
  //           sx={{ bgcolor: "rgba(15,23,42,0.08)" }}
  //         />
  //       </Stack>
  //     );
  //   }

  //   if (errorMessage) {
  //     return (
  //       <Stack spacing={2} alignItems="center">
  //         <Typography variant="body1" color="error">
  //           {errorMessage}
  //         </Typography>
  //         <Button
  //           variant="contained"
  //           onClick={loadBlogDetail}
  //           sx={PRIMARY_BUTTON_SX}
  //         >
  //           Thử lại
  //         </Button>
  //       </Stack>
  //     );
  //   }

  //   if (!blog) {
  //     return (
  //       <Typography variant="body1" color="text.secondary" align="center">
  //         Blog không tồn tại hoặc đã bị xóa.
  //       </Typography>
  //     );
  //   }

  //   return (
  //     <Typography
  //       component="div"
  //       variant="body1"
  //       sx={{ whiteSpace: "pre-line", color: "#0f172a", lineHeight: 1.8 }}
  //     >
  //       {blog?.content || "Bài viết chưa có nội dung."}
  //     </Typography>
  //   );
  // };
  const renderBodyContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      );
    }
    if (!blog?.content) {
      return (
        <Empty
          description="Chưa có nội dung bài viết"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }
    return (
      <div
        className="min-h-[220px] leading-relaxed text-base text-gray-800 blog-detail-content"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />
    );
  };
  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        bgcolor: "#ffffff",
        overflow: "hidden",
        py: { xs: 8, md: 10 },
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
          maxWidth: "1500px",
          color: "#0f172a",
        }}
      >
        <Stack spacing={4}>
          <Button
            onClick={handleBack}
            startIcon={<ArrowBackRoundedIcon />}
            sx={{
              alignSelf: "flex-start",
              textTransform: "none",
              borderRadius: 2.5, // ~rounded-xl
              border: "1px solid",
              borderColor: "rgb(226 232 240)", // slate-200
              backgroundColor: "#ffffff",
              color: "#4f46e5", // indigo-600
              fontWeight: 600,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              transition: "all 0.3s ease",
              "&:hover": {
                borderColor: "rgba(99, 102, 241, 0.6)", // indigo-500/60
                color: "#3730a3", // indigo-700
                backgroundColor: "#eef2ff", // indigo-50
              },
              px: 2.5,
              py: 1,
            }}
          >
            Trở về Blog
          </Button>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(260px, 320px) minmax(0, 1fr)",
              },
              gap: { xs: 3, md: 5 },
              alignItems: "start",
            }}
          >
            {/* Cột trái: thông tin tóm tắt */}
            <Stack spacing={3}>
              <Box
                sx={{
                  borderRadius: { xs: 3, md: 4 },
                  background: "rgba(255,255,255,0.95)",
                  px: { xs: 3, md: 4 },
                  py: { xs: 3, md: 4 },
                  boxShadow: "0 40px 80px rgba(15, 23, 42, 0.12)",
                  backdropFilter: "blur(14px)",
                }}
              >
                {renderHeroContent()}
              </Box>

              <Box
                sx={{
                  borderRadius: { xs: 3, md: 4 },
                  background: "rgba(255,255,255,0.98)",
                  px: { xs: 3, md: 3.5 },
                  py: { xs: 2.5, md: 3 },
                  boxShadow: "0 25px 55px rgba(15, 23, 42, 0.1)",
                  border: "1px solid rgba(15,23,42,0.05)",
                }}
              >
                <Typography
                  variant="overline"
                  sx={{ color: "rgba(15,23,42,0.65)", letterSpacing: 1 }}
                >
                  Thông tin nhanh
                </Typography>
                {loading ? (
                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {[0, 1, 2].map((item) => (
                      <Skeleton
                        key={item}
                        variant="text"
                        height={24}
                        sx={{ bgcolor: "rgba(15,23,42,0.08)" }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {heroMetadata.map((meta) => (
                      <Stack key={meta.label} spacing={0.25}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "rgba(15,23,42,0.55)",
                            letterSpacing: 0.5,
                          }}
                        >
                          {meta.label}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {meta.value}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>

            {/* Cột phải: nội dung bài viết */}
            <Box
              sx={{
                borderRadius: { xs: 3, md: 4 },
                background: "rgba(255,255,255,0.99)",
                px: { xs: 3, md: 4 },
                py: { xs: 3, md: 4 },
                boxShadow: "0 35px 70px rgba(15, 23, 42, 0.15)",
                minHeight: "60vh",
              }}
            >
              {renderBodyContent()}
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default BlogDetailPage;
