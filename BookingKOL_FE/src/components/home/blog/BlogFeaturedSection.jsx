import React from "react";
import { Box, Card, Stack, Typography } from "@mui/material";
import { CompactBlogCard, FeaturedBlogCard } from "./BlogCards";

const BlogFeaturedSection = ({ featuredBlog, sideBlogs, onSelectBlog }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr",
        md: "6fr 6fr",
        lg: "7fr 5fr",
      },
      gap: { xs: 3, md: 4, lg: 5 },
      alignItems: "stretch",
    }}
  >
    <FeaturedBlogCard blog={featuredBlog} onSelectBlog={onSelectBlog} />

    <Stack spacing={2.5} sx={{ height: "100%" }}>
      {sideBlogs.length ? (
        sideBlogs.map((blog, index) => {
          const key =
            blog?.id ?? (blog?.title ? `${blog.title}-${index}` : index);
          return (
            <CompactBlogCard
              key={key}
              blog={blog}
              onSelectBlog={onSelectBlog}
            />
          );
        })
      ) : (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            p: 4,
            textAlign: "center",
            color: "text.secondary",
            boxShadow: "0 15px 30px rgba(15,23,42,0.08)",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Đang chờ thêm bài viết
          </Typography>
          <Typography variant="body2">
            Những bài viết mới sẽ hiển thị ở đây ngay khi cập nhật.
          </Typography>
        </Card>
      )}
    </Stack>
  </Box>
);

export default BlogFeaturedSection;
