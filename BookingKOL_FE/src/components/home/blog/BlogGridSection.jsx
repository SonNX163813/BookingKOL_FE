import React from "react";
import { Box, Pagination, Stack, Typography } from "@mui/material";
import { BlogGridCard } from "./BlogCards";

const BlogGridSection = ({
  blogs,
  onSelectBlog,
  page,
  totalPages,
  onPageChange,
}) => (
  <Stack spacing={2.5} sx={{ mt: { xs: 5, md: 6 } }}>
    <Stack
      direction={{ xs: "column", md: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", md: "center" }}
      spacing={2}
    >
      <Typography
        component="h2"
        variant="h4"
        sx={{ fontWeight: 800, color: "#0f172a" }}
      >
        Tất Cả Bài Viết
      </Typography>
    </Stack>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
        gap: { xs: 2.5, md: 3 },
        alignItems: "stretch",
      }}
    >
      {blogs.map((blog, index) => {
        const key =
          blog?.id ?? (blog?.title ? `${blog.title}-${index}` : index);
        return (
          <Box key={key}>
            <BlogGridCard blog={blog} onSelectBlog={onSelectBlog} />
          </Box>
        );
      })}
    </Box>

    {totalPages > 1 && (
      <Stack alignItems="center" sx={{ mt: 4 }}>
        <Pagination
          count={totalPages}
          page={page + 1}
          onChange={onPageChange}
          color="primary"
          shape="rounded"
        />
      </Stack>
    )}
  </Stack>
);

export default BlogGridSection;
