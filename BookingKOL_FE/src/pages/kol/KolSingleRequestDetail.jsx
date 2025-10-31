import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Grid,
  Image,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeft,
  CalendarRange,
  FileText,
  Layers,
  UserCircle2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getKolMySingleRequestDetail } from "../../services/kol/KolAPI";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

/* ====== Chỉ dùng các trạng thái mới ====== */
const BOOKING_STATUS_LABEL = {
  DRAFT: "Đang thanh toán",
  REQUESTED: "Đã yêu cầu",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Đã hoàn thành",
  EXPIRED: "Đã hết hạn",
  CANCELLED: "Đã hủy",
};

const STATUS_TAG_COLOR = {
  DRAFT: "default",
  REQUESTED: "processing",
  IN_PROGRESS: "processing",
  COMPLETED: "success",
  EXPIRED: "volcano",
  CANCELLED: "error",
};

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : String(value);
};

const formatBoolean = (value) => {
  if (value === null || value === undefined) return "--";
  return value ? "Yes" : "No";
};

const formatCurrency = (value, currency = "VND") => {
  if (value === null || value === undefined || value === "") return "--";
  const numeric = typeof value === "number" ? value : Number.parseFloat(value);
  if (Number.isNaN(numeric)) return "--";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numeric);
};

const normalizeStatus = (status) =>
  status && typeof status === "string" ? status.toUpperCase() : status;

const renderFilePreviewCell = ({ fileType, fileUrl, fileName }) => {
  if (!fileUrl) return "--";
  const normalizedType = (fileType || "").toString().toUpperCase();

  if (normalizedType === "IMAGE") {
    return (
      <Image
        src={fileUrl}
        alt={fileName ?? "image-preview"}
        width={96}
        height={96}
        style={{ objectFit: "cover", borderRadius: 8 }}
        preview={{ mask: "Xem ảnh" }}
      />
    );
  }
  if (normalizedType === "VIDEO") {
    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className="text-blue-600 hover:text-blue-500"
      >
        Xem video
      </a>
    );
  }
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noreferrer"
      className="text-blue-600 hover:text-blue-500"
    >
      {fileName ?? fileUrl}
    </a>
  );
};

const renderImageField = (fileUrl, label) => {
  if (!fileUrl) return "--";
  return (
    <Space direction="vertical" size={8}>
      <Image
        src={fileUrl}
        alt={label ?? "image-preview"}
        width={140}
        height={140}
        style={{ objectFit: "cover", borderRadius: 12 }}
        preview={{ mask: "Xem ảnh" }}
      />
    </Space>
  );
};

export default function KolSingleRequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const auth = useAuth?.() || {};
  const token = auth?.token || null;
  const authLoading = auth?.loading ?? false;

  const {
    data: detail,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["kol-single-request-detail", token, requestId],
    queryFn: () => getKolMySingleRequestDetail(requestId),
    enabled: !!requestId && !!token && !authLoading,
    retry: (count, err) => {
      const code = err?.appStatus || err?.response?.status || 0;
      if (code === 404) return false;
      return count < 2;
    },
  });

  const normalizedStatus = normalizeStatus(detail?.status);
  const statusLabel =
    BOOKING_STATUS_LABEL[normalizedStatus] ?? normalizedStatus ?? "--";

  const fileUsageColumns = useMemo(
    () => [
      { title: "ID", dataIndex: "id", key: "id", width: 220 },
      { title: "Loại đối tượng", dataIndex: "targetType", key: "targetType" },
      {
        title: "ID đối tượng",
        dataIndex: "targetId",
        key: "targetId",
        width: 220,
      },
      {
        title: "Tạo lúc",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (v) => formatDateTime(v),
      },
      {
        title: "Loại tệp",
        key: "fileType",
        render: (_, r) => r?.file?.fileType ?? "--",
      },
      {
        title: "Liên kết tệp",
        key: "fileUrl",
        render: (_, record) =>
          renderFilePreviewCell({
            fileType: record?.file?.fileType,
            fileUrl: record?.file?.fileUrl,
            fileName: record?.file?.fileName,
          }),
      },
      {
        title: "Trạng thái tệp",
        key: "fileStatus",
        render: (_, r) => r?.file?.status ?? "--",
      },
    ],
    []
  );

  const attachedFileColumns = useMemo(
    () => [
      { title: "ID", dataIndex: "id", key: "id", width: 220 },
      { title: "Tên tệp", dataIndex: "fileName", key: "fileName" },
      {
        title: "Liên kết tệp",
        dataIndex: "fileUrl",
        key: "fileUrl",
        render: (fileUrl, record) =>
          renderFilePreviewCell({
            fileType: record?.fileType,
            fileUrl,
            fileName: record?.fileName,
          }),
      },
      { title: "Loại tệp", dataIndex: "fileType", key: "fileType" },
      {
        title: "Tạo lúc",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (v) => formatDateTime(v),
      },
    ],
    []
  );

  const goBackList = () => navigate("/kol/single-requests/all");

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Space size="middle" wrap>
          <Button icon={<ArrowLeft size={16} />} onClick={goBackList}>
            Quay lại danh sách
          </Button>
          <Button
            icon={<CalendarRange size={16} />}
            onClick={() => refetch()}
            loading={isFetching}
          >
            Làm mới
          </Button>
        </Space>

        <div className="text-right">
          <Title level={4} className="!mb-1">
            Chi tiết yêu cầu đặt chỗ
          </Title>
          <Text type="secondary">
            Mã yêu cầu: <Text strong>{detail?.id ?? requestId ?? "--"}</Text>
          </Text>
        </div>
      </div>

      {error ? (
        <Card>
          <Alert
            type={error?.appStatus === 404 ? "warning" : "error"}
            message={
              error?.appStatus === 404
                ? "Không tìm thấy yêu cầu đặt lịch"
                : "Không thể tải chi tiết yêu cầu đặt chỗ."
            }
            description={String(error?.message ?? "")}
            showIcon
            action={
              <Button onClick={goBackList} type="primary">
                Về danh sách
              </Button>
            }
          />
        </Card>
      ) : (
        <Skeleton loading={isLoading} active paragraph={{ rows: 6 }}>
          {/* --- Thông tin yêu cầu đặt chỗ --- */}
          <Card className="shadow-sm" bordered={false}>
            <Space size="middle" wrap className="justify-between w-full">
              <Space size="middle" wrap>
                <Tag color={STATUS_TAG_COLOR[normalizedStatus] ?? "default"}>
                  {statusLabel}
                </Tag>
                {detail?.bookingType && (
                  <Tag color="blue">{normalizeStatus(detail.bookingType)}</Tag>
                )}
              </Space>
            </Space>

            <Divider />

            <Descriptions
              bordered
              size="middle"
              column={screens.lg ? 3 : screens.md ? 2 : 1}
              labelStyle={{ width: 180 }}
            >
              <Descriptions.Item label="Mã đặt chỗ">
                {detail?.id ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Loại đặt chỗ">
                {normalizeStatus(detail?.bookingType) ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {statusLabel}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả" span={screens.lg ? 3 : 1}>
                <Text style={{ whiteSpace: "pre-wrap" }}>
                  {detail?.description || "--"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Địa điểm" span={screens.lg ? 3 : 1}>
                {detail?.location || "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Bắt đầu lúc">
                {formatDateTime(detail?.startAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Kết thúc lúc">
                {formatDateTime(detail?.endAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Tạo lúc">
                {formatDateTime(detail?.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lúc">
                {formatDateTime(detail?.updatedAt)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* --- Thông tin KOL --- */}
          <Card
            className="shadow-sm"
            bordered={false}
            title={
              <Space>
                <UserCircle2 size={18} />
                <span>Thông tin KOL</span>
              </Space>
            }
          >
            <Descriptions
              bordered
              size="middle"
              column={screens.lg ? 3 : screens.md ? 2 : 1}
              labelStyle={{ width: 180 }}
            >
              <Descriptions.Item label="Mã KOL">
                {detail?.kol?.id ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Họ tên đầy đủ">
                {detail?.kol?.fullName ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Tên hiển thị">
                {detail?.kol?.displayName ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Ảnh đại diện" span={screens.lg ? 3 : 1}>
                {renderImageField(
                  detail?.kol?.avatarUrl,
                  detail?.kol?.displayName ?? detail?.kol?.fullName
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">
                {formatDateTime(detail?.kol?.dob, "DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Tiểu sử" span={screens.lg ? 3 : 1}>
                <Text style={{ whiteSpace: "pre-wrap" }}>
                  {detail?.kol?.bio ?? "--"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Kinh nghiệm" span={screens.lg ? 3 : 1}>
                <Text style={{ whiteSpace: "pre-wrap" }}>
                  {detail?.kol?.experience ?? "--"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Quốc gia">
                {detail?.kol?.country ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Thành phố">
                {detail?.kol?.city ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngôn ngữ">
                {detail?.kol?.languages ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Giá đặt tối thiểu">
                {formatCurrency(detail?.kol?.minBookingPrice)}
              </Descriptions.Item>
              <Descriptions.Item label="Khả dụng">
                {formatBoolean(detail?.kol?.isAvailable)}
              </Descriptions.Item>
              <Descriptions.Item label="Đánh giá tổng thể">
                {detail?.kol?.overallRating ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Số lượng phản hồi">
                {detail?.kol?.feedbackCount ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Vai trò">
                {detail?.kol?.role ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Tạo lúc">
                {formatDateTime(detail?.kol?.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lúc">
                {formatDateTime(detail?.kol?.updatedAt)}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5} className="!mb-2 flex items-center gap-2">
              <Layers size={16} /> Danh mục
            </Title>
            <Space size={[8, 8]} wrap>
              {detail?.kol?.categories && detail.kol.categories.length > 0 ? (
                detail.kol.categories.map((category) => (
                  <Tag color="blue" key={category?.id ?? category?.key}>
                    {category?.name ?? category?.key ?? "--"}
                  </Tag>
                ))
              ) : (
                <Text type="secondary">Không có danh mục</Text>
              )}
            </Space>

            <Divider />

            <Title level={5} className="!mb-2 flex items-center gap-2">
              <FileText size={16} /> Sử dụng tệp
            </Title>
            {detail?.kol?.fileUsageDtos && detail.kol.fileUsageDtos.length ? (
              <Table
                columns={fileUsageColumns}
                dataSource={detail.kol.fileUsageDtos}
                rowKey={(record) =>
                  record?.id ?? record?.file?.id ?? Math.random()
                }
                pagination={false}
                scroll={{ x: 960 }}
              />
            ) : (
              <Empty description="Không có dữ liệu tệp" />
            )}
          </Card>

          {/* --- Tệp đính kèm --- */}
          <Card
            className="shadow-sm"
            bordered={false}
            title={
              <Space>
                <FileText size={18} />
                <span>Tệp đính kèm</span>
              </Space>
            }
          >
            {detail?.attachedFiles && detail.attachedFiles.length > 0 ? (
              <Table
                columns={attachedFileColumns}
                dataSource={detail.attachedFiles}
                rowKey={(record) => record?.id ?? Math.random()}
                pagination={false}
                scroll={{ x: 720 }}
              />
            ) : (
              <Empty description="Không có tệp đính kèm" />
            )}
          </Card>
        </Skeleton>
      )}
    </div>
  );
}
