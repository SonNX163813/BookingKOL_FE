import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import WcRoundedIcon from "@mui/icons-material/WcRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";

export const USER_PROFILE_GENDER_OPTIONS = [
  { value: "", label: "Chọn" },
  { value: "Male", label: "Nam" },
  { value: "Female", label: "Nữ" },
  { value: "Other", label: "Khác" },
];

export const USER_PROFILE_SECTIONS = [
  {
    key: "contact",
    title: "Thông tin liên hệ",
    description:
      "Thông tin này giúp NexusSocial và KOL có thể liên hệ với bạn nhanh hơn.",
    fields: [
      {
        name: "fullName",
        label: "Họ và tên",
        placeholder: "Nhập họ và tên đầy đủ",
        required: true,
        icon: BadgeRoundedIcon,
      },
      {
        name: "brandName",
        label: "Thương hiệu / Công ty",
        placeholder: "Nhập tên thương hiệu hoặc công ty",
        icon: BusinessCenterRoundedIcon,
      },
      {
        name: "email",
        label: "Email",
        placeholder: "Email đang sử dụng",
        readOnly: true,
        icon: MailOutlineRoundedIcon,
        helperText: "Email được liên kết với tài khoản và không thể thay đổi.",
      },
      {
        name: "phoneNumber",
        label: "Số điện thoại",
        placeholder: "Nhập số điện thoại liên hệ",
        icon: PhoneRoundedIcon,
      },
      {
        name: "address",
        label: "Địa chỉ",
        placeholder: "Nhập địa chỉ chi tiết",
        multiline: true,
        fullWidthRow: true,
        minRows: 2,
        icon: HomeRoundedIcon,
      },
    ],
  },
  {
    key: "personal",
    title: "Thông tin cá nhân",
    description:
      "Các thông tin này giúp hồ sơ của bạn rõ ràng và chuyên nghiệp hơn.",
    fields: [
      {
        name: "gender",
        label: "Giới tính",
        placeholder: "Chọn giới tính",
        select: true,
        options: USER_PROFILE_GENDER_OPTIONS,
        icon: WcRoundedIcon,
        helperText: "Giúp hệ thống xưng hô với bạn chính xác hơn.",
      },
      {
        name: "dateOfBirth",
        label: "Ngày sinh",
        placeholder: "Chọn ngày sinh",
        type: "date",
        icon: CalendarMonthRoundedIcon,
        helperText:
          "Thông tin này giúp BookingKOL đề xuất gói dịch vụ phù hợp hơn.",
      },
      {
        name: "country",
        label: "Quốc gia",
        placeholder: "Nhập quốc gia bạn đang sinh sống",
        icon: PublicRoundedIcon,
      },
    ],
  },
  {
    key: "bio",
    title: "Giới thiệu",
    description:
      "Chia sẻ thêm về kinh nghiệm, thế mạnh và mong muốn hợp tác của bạn.",
    fields: [
      {
        name: "introduction",
        label: "Mô tả ngắn",
        placeholder:
          "Ví dụ: 5 năm kinh nghiệm marketing, đã hợp tác với các thương hiệu lớn như...",
        multiline: true,
        minRows: 5,
        icon: DescriptionRoundedIcon,
        helperText:
          "Bạn có thể viết tối đa 500 ký tự để mô tả nguyện vọng và kinh nghiệm.",
      },
    ],
  },
];

export const USER_PROFILE_COPY = {
  fallbackText: "Đang cập nhật",
  hero: {
    loadingTitle: "Đang tải hồ sơ...",
    loadingSubtitle: "Vui lòng chờ trong giây lát.",
    introductionFallback:
      "Hồ sơ của bạn đang được cập nhật. Hãy bổ sung thông tin để thu hút đối tác tiềm năng.",
    defaultName: "Người dùng BookingKOL",
  },
  buttons: {
    refresh: "Tải lại",
    edit: "Chỉnh sửa",
    editing: "Đang chỉnh sửa",
    cancel: "Hủy",
    save: "Lưu thay đổi",
  },
  snackbar: {
    retry: "Thử lại",
    closeAria: "Đóng thông báo",
  },
};
