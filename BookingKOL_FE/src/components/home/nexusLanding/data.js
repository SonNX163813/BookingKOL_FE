import bookingImg from "../../../assets/services/1.jpg";
import trainingImg from "../../../assets/services/5.jpg";
import studioImg from "../../../assets/services/3.jpg";
import operationImg from "../../../assets/services/6.jpg";
import affiliateImg from "../../../assets/services/81.jpg";
// // nếu có:
import trackingImg from "../../../assets/services/12.png";
import crmImg from "../../../assets/services/bi.png";

export const heroBadges = ["Realtime KPI", "ROI-driven"];

export const introHighlights2 = [
  "Thực chiến TMĐT, kinh nghiệm đa ngành.",
  "Hệ sinh thái khép kín.",
  "Mạng lưới hàng ngàn KOL/KOC.",
  "Cam kết KPI & báo cáo minh bạch.",
];

export const servicesTabs = [
  {
    key: "booking",
    title: "Booking KOL/KOC",
    image: bookingImg,
    description:
      "Tư vấn và lựa chọn KOL/KOC phù hợp mục tiêu, quản lý booking end-to-end từ deal giá đến hợp đồng.",
    bullets: [
      "Đội ngũ livestream chuyên nghiệp, đa ngành",
      "Kiểm duyệt & đánh giá chất lượng KOL",
      "Theo dõi hiệu suất KOL cho từng phiên Live",
    ],
  },
  {
    key: "training",
    title: "Đào tạo Livestream",
    image: trainingImg,
    description:
      "Xây dựng đội ngũ livestream nội bộ với giáo trình độc quyền, kịch bản chuyển đổi cao.",
    bullets: [
      "Huấn luyện MC/KOC theo format chuẩn",
      "Checklist setup & vận hành phòng live",
      "Coaching 1-1 với chuyên gia TMĐT",
    ],
  },
  {
    key: "studio",
    title: "Setup Livestream",
    image: studioImg,
    description:
      "Thiết kế, thi công và tối ưu studio livestream chuẩn e-commerce, tối ưu âm thanh – ánh sáng.",
    bullets: [
      "Setup phòng live chuẩn studio",
      "Host, trợ lý, kỹ thuật chuyên nghiệp",
      "Tối ưu chuyển đổi theo phiên live",
    ],
  },
  {
    key: "operation",
    title: "Livestream Production",
    image: operationImg,
    description:
      "Sản xuất livestream trọn gói: kịch bản, set up, kỹ thuật đa góc máy, vận hành realtime, tối ưu tương tác và chuyển đổi.",
    bullets: [
      "Tối ưu quy trình vận hành cho brand/dự án lớn",
      "Thiết kế concept room",
      "Hệ thống ánh sáng, camera, âm thanh chuyên nghiệp",
    ],
  },
  {
    key: "affiliate",
    title: "Affiliate & MCN",
    image: affiliateImg,
    description:
      "Mở rộng doanh thu qua mạng lưới affiliate đa kênh, kết nối creator làm đại sứ.",
    bullets: [
      "Quản lý hoa hồng & chi phí linh hoạt",
      "API kết nối sàn & hệ thống CRM",
      "Scorecard đánh giá mỗi chiến dịch",
    ],
  },

  // ✅ NEW 1

  // ✅ NEW 2
  {
    key: "crm",
    title: "Hệ thống CRM & Dashboard KPI",
    image: crmImg,
    description:
      "CRM & Dashboard KPI giúp quản trị khách hàng, theo dõi hiệu suất realtime, tối ưu doanh thu, tự động báo cáo, cảnh báo thông minh.",
    bullets: [
      "Dữ liệu khách hàng tập trung, dễ quản trị.",
      "KPI realtime, xem nhanh theo kênh/SKU.",
      "Báo cáo tự động, cảnh báo lệch mục tiêu.",
    ],
  },
];

export const industriesGroups = [
  {
    key: "services",
    label: "Dịch vụ",
    items: [
      "Spa",
      "Nha khoa",
      "Giáo dục",
      "Du lịch",
      "Khách sạn – Nhà hàng",
      "Logistic",
      "Bệnh viện",
      "Thể thao",
    ],
  },
  {
    key: "products",
    label: "Sản phẩm",
    items: [
      "Mẹ & Bé",
      "Mỹ phẩm",
      "FMCG",
      "F&B",
      "Dược – TPCN",
      "Nội thất",
      "Ô tô",
      "Công nghệ",
      "Xuất khẩu",
    ],
  },
];

export const caseStudyHighlights = [
  {
    title: "Tăng 43% CVR sau 4 tuần",
    subtitle: "Săn deal 11.11 cùng KOL ngành làm đẹp",
  },
  {
    title: "GMV +185% nhờ combo live + review",
    subtitle: "Chuỗi siêu thị mẹ & bé",
  },
  {
    title: "CPA giảm 37% khi dùng scorecard",
    subtitle: "Dự án FMCG đa nền tảng",
  },
];

export const testimonials = [
  {
    name: "Lâm Nguyễn",
    role: "CMO, FreshBeauty",
    quote:
      "Đội ngũ Nexus giúp chúng tôi nhân 3 doanh số TikTok Shop chỉ trong một quý.",
    avatar: "https://via.placeholder.com/64",
    brand: "FreshBeauty",
  },
  {
    name: "Trang Đoàn",
    role: "KOC Top Live",
    quote:
      "Lịch sản xuất và hậu kỳ của Nexus cực kỳ chuẩn, tôi chỉ việc lên hình.",
    avatar: "https://via.placeholder.com/64",
    brand: "Trang Đoàn Studio",
  },
];

export const whyChooseCards = [
  {
    title: "Kinh nghiệm thực chiến",
    description: "Dẫn dắt thương hiệu top 1 TMĐT.",
    metric: "GMV >100 tỷ",
  },
  {
    title: "All-in-One – Full Service",
    description: "Booking, Setup, Đào tạo, Vận hành, Affiliate/MCN.",
    metric: ">20 ngành",
  },
  {
    title: "Network chất lượng",
    description: "KOL/KOC phân tầng (nano→mega), kiểm duyệt thương hiệu.",
    metric: "5K+ KOL/KOC",
  },
  {
    title: "KPI/ROI-Driven & Automation",
    description:
      "Cam kết theo view/reach/lead/đơn hàng. CRM, dashboard realtime, scorecard.",
    metric: "Scorecard realtime",
  },
];

export const processSteps = [
  {
    title: "Tiếp nhận & Lắng nghe",
    description: "Ngành, mục tiêu, ngân sách, thời gian.",
  },
  {
    title: "Nghiên cứu & Đề xuất",
    description:
      "Đối thủ, chân dung KH, danh sách KOL/KOC, hình thức live/video, KPI.",
  },
  {
    title: "Ký kết & Triển khai",
    description: "Kịch bản, setup kỹ thuật, lịch on-air/đăng.",
  },
  {
    title: "Giám sát & Tối ưu",
    description: "War-room, điều chỉnh theo phút, báo cáo tuần/tháng.",
  },
  {
    title: "Báo cáo & Đồng hành",
    description: "Tổng kết KPI, bài học & chiến lược tiếp theo.",
  },
];
// src/components/home/nexusLanding/data.js
export const introQuoteLines = [
  "Chúng tôi không chỉ vận hành livestream.",
  "Chúng tôi xây dựng tương lai của Livestream Commerce.",
];

export const introHighlights = [
  {
    title: "Dựa trên dữ liệu",
    desc: "Mọi quyết định được tối ưu bằng insight đa nền tảng",
  },
  {
    title: "Dựa trên công nghệ",
    desc: "Công cụ quản lý phiên, tracking sản phẩm, và phân tích hiệu suất",
  },
  {
    title: "Dựa trên thực chiến",
    desc: "Đội ngũ 5 năm kinh nghiệm, hơn 20.000 giờ livestream",
  },
];

export const ceoInfo = {
  role: "CEO",
  name: "Bryan Nguyễn",
  bgText: "BRYAN\nNGUYEN",
  monogram: "BN",
};
