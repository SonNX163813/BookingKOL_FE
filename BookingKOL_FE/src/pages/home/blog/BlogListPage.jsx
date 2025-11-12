import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Container, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { fetchBlogs } from "../../../services/blog/BlogAPI";
import {
  PAGE_BACKGROUND,
  PAGE_SIZE,
} from "../../../components/home/blog/constants";
import BlogHeroSection from "../../../components/home/blog/BlogHeroSection";
import BlogFeaturedSection from "../../../components/home/blog/BlogFeaturedSection";
import BlogGridSection from "../../../components/home/blog/BlogGridSection";
import {
  BlogEmptyState,
  BlogErrorState,
  BlogLoadingState,
} from "../../../components/home/blog/BlogStates";

const normalizeErrorMessage = (error) => {
  const rawMessage = error?.response?.data?.message;
  if (Array.isArray(rawMessage)) return rawMessage.filter(Boolean).join(" ");
  if (typeof rawMessage === "string" && rawMessage.trim())
    return rawMessage.trim();
  if (error?.message) return error.message;
  return "Không thể tải danh sách blog. Vui lòng thử lại.";
};

const getPopularityScore = (blog) =>
  Number(blog?.views ?? blog?.likes ?? blog?.favoriteCount ?? 0);

const BlogListPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [page, setPage] = useState(0);
  const [pageMeta, setPageMeta] = useState({ totalPages: 0, totalElements: 0 });
  const [activeTab] = useState("all");
  const [sortBy] = useState("time");

  const navigate = useNavigate();

  const loadBlogs = useCallback(async (targetPage = 0) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchBlogs({ page: targetPage, size: PAGE_SIZE });
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

  const featuredBlog = useMemo(
    () => (blogs.length > 0 ? blogs[0] : null),
    [blogs]
  );
  const sideBlogs = useMemo(
    () => (blogs.length > 1 ? blogs.slice(1, 5) : []),
    [blogs]
  );
  const hasBlogs = blogs.length > 0;

  const handleRetry = () => loadBlogs(page);
  const handlePageChange = (_event, value) => setPage(value - 1);
  const totalPages = useMemo(
    () => Math.max(pageMeta.totalPages, hasBlogs ? 1 : 0),
    [pageMeta.totalPages, hasBlogs]
  );
  const handleSelectBlog = useCallback(
    (blogId) => blogId && navigate(`/blog/${blogId}`),
    [navigate]
  );

  const filteredSortedBlogs = useMemo(() => {
    let arr = [...blogs];

    if (activeTab !== "all") {
      arr = arr.filter((blog) => {
        const cat = (blog?.category || "").toLowerCase();
        const tags = (
          Array.isArray(blog?.tags) ? blog.tags : [blog?.tag, blog?.topic]
        )
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (activeTab === "news")
          return (
            cat.includes("bản tin") ||
            tags.includes("bản tin") ||
            cat.includes("news")
          );
        if (activeTab === "seller")
          return (
            tags.includes("người bán") ||
            tags.includes("kinh nghiệm") ||
            cat.includes("seller")
          );
        if (activeTab === "insight")
          return (
            tags.includes("insight") ||
            cat.includes("insight") ||
            tags.includes("xu hướng")
          );
        return true;
      });
    }

    if (sortBy === "time") {
      arr.sort(
        (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
      );
    } else {
      arr.sort((a, b) => getPopularityScore(b) - getPopularityScore(a));
    }

    return arr;
  }, [blogs, activeTab, sortBy]);

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
              gap: { xs: 4, sm: 4.5, md: 6 },
              alignItems: "start",
            }}
          >
            {/* <BlogHeroSection /> */}

            <Box>
              {loading ? (
                <BlogLoadingState />
              ) : errorMessage ? (
                <BlogErrorState message={errorMessage} onRetry={handleRetry} />
              ) : hasBlogs ? (
                <>
                  <BlogFeaturedSection
                    featuredBlog={featuredBlog}
                    sideBlogs={sideBlogs}
                    onSelectBlog={handleSelectBlog}
                  />

                  <BlogGridSection
                    blogs={filteredSortedBlogs}
                    onSelectBlog={handleSelectBlog}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </>
              ) : (
                <BlogEmptyState />
              )}
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default BlogListPage;
