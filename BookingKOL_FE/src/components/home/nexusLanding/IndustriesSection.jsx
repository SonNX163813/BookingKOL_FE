// src/components/home/nexusLanding/IndustriesSection.jsx
import React from "react";
import { Box, Container, Typography } from "@mui/material";

import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsSuggestOutlinedIcon from "@mui/icons-material/SettingsSuggestOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import UpgradeOutlinedIcon from "@mui/icons-material/UpgradeOutlined";

/** ✅ style copy từ CEOMessage */
const PRIMARY = { color: "#0b4aa2" };
const TITLE_FONT = {
  fontWeight: 700,
  letterSpacing: 0.2,
  fontSize: { xs: 24, sm: 28, md: 32 },
  lineHeight: 1.12,
};
const BODY_FONT = {
  color: "rgba(15, 23, 42, 0.65)",
  lineHeight: 1.65,
  fontSize: { xs: 14, md: 16 },
};

const GREEN = "#5bb2ecff";
const ORANGE = "#5bb2ecff";

const sectionSx = {
  position: "relative",
  overflow: "hidden",
  color: "#0f172a",
  background: "transparent",
};

const cardSx = {
  position: "relative",
  borderRadius: { xs: 3, md: 4 },
  overflow: "hidden",
  padding: { xs: 2, sm: 2.5, md: 3 },
  backgroundColor: "#fff",
  border: "1px solid rgba(148,163,184,0.25)",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
  transition:
    "transform .50s ease, box-shadow .50s ease, border-color .50s ease",
  "&::after": {
    content: '""',
    position: "absolute",
    left: 0,
    bottom: 0,
    width: "100%",
    height: 6,
    backgroundColor: GREEN,
    borderBottomLeftRadius: { xs: 3, md: 4 },
    borderBottomRightRadius: { xs: 3, md: 4 },
  },
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.14)",
    borderColor: "rgba(56,189,248,0.9)",
  },
};

const iconSx = {
  fontSize: { xs: 26, md: 32 },
  color: ORANGE,
  flexShrink: 0,
  mb: { xs: 0, sm: 1.5 },
  mr: { xs: 1.2, sm: 0 },
};

const services = [
  {
    id: "1",
    title: "Hiểu ngành – phân tích",
    desc: "Khi nhận được các yêu cầu này của doanh nghiệp, cán bộ chuyên môn sẽ phân tích bài toán nhằm đưa ra phương án tối ưu cho việc điều chỉnh mở rộng.",
    icon: BarChartIcon,
  },
  {
    id: "2",
    title: "Setup – nhân sự – vận hành",
    desc: "Phần lớn thời gian giai đoạn này khách hàng sẽ làm việc trực tiếp với đội ngũ kỹ thuật để từng bước giải quyết các bài toán đã thống nhất từ ban đầu.",
    icon: SettingsSuggestOutlinedIcon,
  },
  {
    id: "3",
    title: "Sản xuất & tổ chức",
    desc: 'Với phương châm "Dịch vụ chuyên nghiệp, Hậu mãi chu đáo" chúng tôi cam kết chất lượng dịch vụ trước và sau bán hàng.',
    icon: VerifiedUserOutlinedIcon,
  },
  {
    id: "4",
    title: "Báo cáo thời gian thực",
    desc: "Thiết lập bộ phận chăm sóc khách hàng chuyên nghiệp, xử lý và hỗ trợ theo các yêu cầu phát sinh, chăm sóc định kỳ.",
    icon: SupportAgentOutlinedIcon,
  },
  {
    id: "5",
    title: "Tối ưu liên tục",
    desc: "Với cấu trúc linh hoạt, hệ thống dễ dàng bổ sung tính năng mới khi doanh nghiệp mở rộng quy mô sản xuất kinh doanh.",
    icon: UpgradeOutlinedIcon,
  },
];

export default function IndustriesSection() {
  return (
    <Box component="section" sx={sectionSx}>
      <Container
        maxWidth={false}
        sx={{
          maxWidth: 1560,
          mx: "auto",
          px: { xs: 2, sm: 2.5, md: 3 },
          py: { xs: 5, sm: 7, md: 12 },
        }}
      >
        {/* ===== TIÊU ĐỀ ===== */}
        <Box sx={{ textAlign: "center", mb: { xs: 3, sm: 4, md: 6 } }}>
          <Typography
            sx={{
              ...TITLE_FONT,
              ...PRIMARY,
              willChange: "transform, opacity",
              animation: {
                xs: "none",
                sm: "indTitleIn 0.75s cubic-bezier(.2,.8,.2,1) both",
              },
              "@keyframes indTitleIn": {
                from: { opacity: 0, transform: "translateY(18px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >
            Quy trình vận hành Livestream Commerce
          </Typography>
        </Box>

        {/* ===== GRID ===== */}
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2, sm: 2.5, md: 3 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
              lg: "repeat(5, minmax(0, 1fr))",
            },
          }}
        >
          {services.map((service, idx) => {
            const Icon = service.icon;
            const delay = 0.1 + idx * 0.06;

            return (
              <Box
                key={service.id}
                sx={{
                  willChange: "transform, opacity",
                  animation: {
                    xs: "none",
                    sm: "indCardIn 0.8s cubic-bezier(.16,1,.3,1) both",
                  },
                  animationDelay: `${delay}s`,
                  "@keyframes indCardIn": {
                    from: {
                      opacity: 0,
                      transform: "translateY(28px) scale(0.96)",
                    },
                    to: { opacity: 1, transform: "translateY(0) scale(1)" },
                  },
                }}
              >
                {/* 
                  ✅ xs: không ép vuông (pt=0, card position=relative)
                  ✅ sm+: giữ tỉ lệ gần vuông để các card đều nhau
                */}
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    pt: { xs: 0, sm: "110%" },
                  }}
                >
                  <Box
                    sx={{
                      ...cardSx,
                      position: { xs: "relative", sm: "absolute" },
                      inset: { sm: 0 },
                      display: "flex",
                      flexDirection: "column",
                      minHeight: { xs: 210, sm: "unset" }, // ✅ đỡ lùn trên mobile
                    }}
                  >
                    {/* Header: xs ngang cho gọn; sm+ dọc */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: { xs: "center", sm: "flex-start" },
                        flexDirection: { xs: "row", sm: "column" },
                        mb: { xs: 1.2, sm: 0 },
                      }}
                    >
                      <Icon sx={iconSx} />
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: { xs: 15.5, md: 16 },
                          color: "#111827",
                          lineHeight: 1.25,
                        }}
                      >
                        {service.title}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        ...BODY_FONT,
                        mt: 0.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: { xs: 4, sm: 5 }, // ✅ mobile gọn hơn
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {service.desc}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
