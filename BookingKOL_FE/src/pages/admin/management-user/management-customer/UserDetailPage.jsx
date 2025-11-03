import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Descriptions,
  Tag,
  Space,
  Skeleton,
  Divider,
  Typography,
  Grid,
} from "antd";
import {
  ArrowLeft,
  UserRound,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
} from "lucide-react";
import { useAdminGetViewProfileUser } from "../../../../hook/admin/management-user/useAdminGetViewProfileUser";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const STATUS_VI = {
  ACTIVE: "Đang hoạt động",
  SUSPENDED: "Tạm khóa",
  INACTIVE: "Chưa kích hoạt",
  PENDING: "Chờ duyệt",
};

// ===== Map giới tính sang tiếng Việt + màu Tag =====
const toGenderVI = (g) => {
  if (!g) return "—";
  const v = String(g).trim().toUpperCase();
  if (v === "MALE" || v === "NAM" || v === "M") return "Nam";
  if (v === "FEMALE" || v === "NỮ" || v === "NU" || v === "F") return "Nữ";
  if (v === "OTHER" || v === "KHÁC") return "Khác";
  return "Khác";
};

const genderColor = (g) => {
  const v = String(g || "")
    .trim()
    .toUpperCase();
  if (v === "MALE" || v === "NAM" || v === "M") return "green";
  if (v === "FEMALE" || v === "NỮ" || v === "NU" || v === "F") return "magenta";
  return "default";
};

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  const { isLoadingGetViewProfileUser, ResponseGetViewProfileUser } =
    useAdminGetViewProfileUser(id);

  const data = ResponseGetViewProfileUser?.data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <Button
          onClick={() => navigate("/admin/management-customer")}
          className="rounded-xl !h-10 !flex !items-center"
          type="default"
        >
          <ArrowLeft size={18} /> Quay lại
        </Button>
      </div>

      <Card
        className="rounded-2xl shadow-sm border"
        bodyStyle={{ padding: screens.xs ? 16 : 24 }}
      >
        <Skeleton
          loading={isLoadingGetViewProfileUser}
          active
          paragraph={{ rows: 1 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow">
                <UserRound size={26} />
              </div>
              <div>
                <Title level={3} style={{ marginBottom: 0 }}>
                  {data?.fullName ?? "—"}
                </Title>
                <Space size="small" wrap className="mt-1">
                  <Tag
                    color="blue"
                    className="rounded-full !h-8 !flex !items-center"
                  >
                    {data?.brandName
                      ? `Thương hiệu: ${data?.brandName}`
                      : "Không có thương hiệu"}
                  </Tag>

                  {/* Trạng thái (tiếng Việt) */}
                  {data?.status && (
                    <Tag
                      color={
                        data.status === "ACTIVE"
                          ? "green"
                          : data.status === "SUSPENDED"
                          ? "red"
                          : "default"
                      }
                      className="rounded-full !h-8 !flex !items-center"
                    >
                      {STATUS_VI[data.status] ?? data.status}
                    </Tag>
                  )}

                  {/* Giới tính (tiếng Việt) */}
                  {data?.gender && (
                    <Tag
                      className="rounded-full !h-8 !flex !items-center"
                      color={genderColor(data.gender)}
                    >
                      {toGenderVI(data.gender)}
                    </Tag>
                  )}

                  {data?.country && (
                    <Tag className="rounded-full !h-8 !flex !items-center">
                      {data.country}
                    </Tag>
                  )}
                </Space>
              </div>
            </div>

            {/* ĐÃ BỎ: Cập nhật / Khóa / Mở khóa */}
          </div>
        </Skeleton>

        <Divider className="my-5" />

        <Skeleton loading={isLoadingGetViewProfileUser} active>
          <Title level={4} className="!mb-3">
            Liên hệ
          </Title>
          <Descriptions
            bordered
            column={screens.md ? 2 : 1}
            size="middle"
            className="rounded-xl overflow-hidden"
            labelStyle={{ width: 180 }}
          >
            <Descriptions.Item
              label={
                <Space size={6}>
                  <Mail size={16} /> Email
                </Space>
              }
            >
              <Text copyable style={{ wordBreak: "break-all" }}>
                {data?.email ?? "—"}
              </Text>
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <Space size={6}>
                  <Phone size={16} /> Số điện thoại
                </Space>
              }
            >
              <Text copyable>{data?.phone ?? "—"}</Text>
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <Space size={6}>
                  <MapPin size={16} /> Địa chỉ
                </Space>
              }
              span={screens.md ? 2 : 1}
            >
              <Text style={{ whiteSpace: "pre-wrap" }}>
                {data?.address ?? "—"}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Skeleton>

        <Divider className="my-5" />

        <Skeleton loading={isLoadingGetViewProfileUser} active>
          <Title level={4} className="!mb-3">
            Hồ sơ
          </Title>
          <Descriptions
            bordered
            column={screens.md ? 2 : 1}
            size="middle"
            className="rounded-xl overflow-hidden"
            labelStyle={{ width: 180 }}
          >
            <Descriptions.Item
              label={
                <Space size={6}>
                  <Calendar size={16} /> Ngày sinh
                </Space>
              }
            >
              {formatDate(data?.dateOfBirth) ?? "—"}
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <Space size={6}>
                  <Globe size={16} /> Quốc gia
                </Space>
              }
            >
              {data?.country ?? "—"}
            </Descriptions.Item>

            <Descriptions.Item label="Giới thiệu" span={screens.md ? 2 : 1}>
              <Text style={{ whiteSpace: "pre-wrap" }}>
                {data?.introduction ?? "—"}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Skeleton>
      </Card>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;

    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}
