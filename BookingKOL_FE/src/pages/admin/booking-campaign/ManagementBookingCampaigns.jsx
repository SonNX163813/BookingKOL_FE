// src/pages/admin/booking-campaign/ManagementBookingCampaigns.jsx
import { useCallback, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Pagination,
  Select,
  Space,
  Table,
  Tag,
  ConfigProvider,
} from "antd";
import viVN from "antd/locale/vi_VN";
import {
  CalendarRange,
  Eye,
  RefreshCcw,
  RotateCcw,
  Search,
  Pencil,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminGetCampaignBookings } from "../../../services/admin/AdminBookingCampaignAPI";

dayjs.locale("vi");
const { RangePicker } = DatePicker;

/* ====== STATUS mapping cho Campaign ====== */
const CAMPAIGN_STATUS_OPTIONS = [
  { label: "Đang yêu cầu", value: "REQUESTED" },
  { label: "Đã phê duyệt", value: "APPROVED" },
  { label: "Đã từ chối", value: "REJECTED" },
  { label: "Hoàn tất", value: "COMPLETED" },
];

const CAMPAIGN_STATUS_COLOR = {
  REQUESTED: "gold",
  APPROVED: "green",
  REJECTED: "red",
  COMPLETED: "blue",
};

/* ====== helpers ====== */
const fmt = (v, pattern = "DD/MM/YYYY") =>
  v && dayjs(v).isValid() ? dayjs(v).format(pattern) : "--";

const rowKey = (r) =>
  r?.id ||
  r?.requestNumber ||
  r?.code ||
  `campaign-${Math.random().toString(36).slice(2, 10)}`;

const rangesOverlap = (aStart, aEnd, bStart, bEnd) => {
  if (!aStart && !aEnd) return false;
  const startA = dayjs(aStart || aEnd);
  const endA = dayjs(aEnd || aStart);
  if (!startA.isValid() || !endA.isValid()) return false;
  const startB = dayjs(bStart);
  const endB = dayjs(bEnd);
  if (!startB.isValid() || !endB.isValid()) return true;
  return (
    startA.valueOf() <= endB.valueOf() && endA.valueOf() >= startB.valueOf()
  );
};

export default function ManagementBookingCampaigns() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const [filters, setFilters] = useState({
    search: undefined,
    status: undefined,
    packageType: undefined,
    executionRange: undefined,
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-campaign-bookings", { page, size }],
    queryFn: () => adminGetCampaignBookings({ params: { page, size } }),
    keepPreviousData: true,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const serverContent = Array.isArray(data?.content) ? data.content : [];
  const totalElements = data?.totalElements ?? serverContent.length;
  const serverPage = Number.isFinite(data?.page)
    ? data.page
    : data?.number ?? 0;
  const serverSize = Number.isFinite(data?.size) ? data.size : size;

  const packageTypeOptions = useMemo(() => {
    const set = new Set(
      serverContent
        .map((r) => r?.packageType)
        .filter((x) => x !== undefined && x !== null && String(x).trim() !== "")
        .map((x) => String(x))
    );
    return [...set].map((v) => ({ value: v, label: String(v).toUpperCase() }));
  }, [serverContent]);

  const filtered = useMemo(() => {
    const s = (filters.search || "").trim().toLowerCase();
    const status = filters.status
      ? String(filters.status).toUpperCase()
      : undefined;
    const packageType = filters.packageType
      ? String(filters.packageType).toLowerCase()
      : undefined;

    const hasRange = filters.executionRange?.length === 2;
    const qStart = hasRange ? filters.executionRange[0] : null;
    const qEnd = hasRange ? filters.executionRange[1] : null;

    return serverContent.filter((r) => {
      if (status && String(r?.status || "").toUpperCase() !== status)
        return false;
      if (
        packageType &&
        String(r?.packageType || "").toLowerCase() !== packageType
      )
        return false;

      if (s) {
        const bucket = [
          r?.campaignName,
          r?.objective,
          r?.packageName,
          r?.packageType,
          r?.buyerEmail,
          r?.id,
          r?.requestNumber,
        ]
          .filter(Boolean)
          .map((x) => String(x).toLowerCase());
        if (!bucket.some((x) => x.includes(s))) return false;
      }

      if (hasRange) {
        const rs = r?.startDate || r?.startAt || null;
        const re = r?.endDate || r?.endAt || null;
        if (!rangesOverlap(rs, re, qStart, qEnd)) return false;
      }

      return true;
    });
  }, [serverContent, filters]);

  const handleFilter = (values) => {
    const { search, status, packageType, executionRange } = values;
    setFilters({
      search: search || undefined,
      status: status || undefined,
      packageType: packageType || undefined,
      executionRange: executionRange?.length === 2 ? executionRange : undefined,
    });
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({
      search: undefined,
      status: undefined,
      packageType: undefined,
      executionRange: undefined,
    });
  };

  const goCreate = useCallback(() => {
    navigate(`/admin/bookings/create`);
  }, [navigate]);

  const goDetail = useCallback(
    (r) => {
      const id = r?.id || r?.requestNumber || r?.code;
      if (id) navigate(`/admin/management-booking-campaigns/${id}`);
    },
    [navigate]
  );

  const goEdit = useCallback(
    (r) => {
      // ✅ PHẢI DÙNG campaignId từ API, KHÔNG dùng id
      const campaignId = r?.campaignId;
      if (!campaignId) {
        // Nếu không có campaignId thì không điều hướng (hoặc log ra để debug)
        // console.error("Row không có campaignId:", r);
        return;
      }

      navigate(
        `/admin/bookings/create?campaignId=${encodeURIComponent(campaignId)}`,
        {
          // truyền đầy đủ row + campaignId chuẩn
          state: {
            ...r,
            campaignId,
          },
        }
      );
    },
    [navigate]
  );

  const columns = useMemo(
    () => [
      {
        title: "Chiến dịch",
        dataIndex: "campaignName",
        key: "campaignName",
        width: 260,
        render: (v) => v || "--",
      },
      {
        title: "Mục tiêu",
        dataIndex: "objective",
        key: "objective",
        width: 300,
        render: (v) => v || "--",
      },
      {
        title: "Bắt đầu",
        dataIndex: "startDate",
        key: "startDate",
        width: 150,
        render: (v) => fmt(v, "DD/MM/YYYY"),
      },
      {
        title: "Kết thúc",
        dataIndex: "endDate",
        key: "endDate",
        width: 150,
        render: (v) => fmt(v, "DD/MM/YYYY"),
      },
      {
        title: "Gói",
        dataIndex: "packageType",
        key: "packageType",
        width: 130,
        render: (v, r) =>
          v ? String(v).toUpperCase() : r?.packageName || "--",
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 150,
        render: (s) => {
          const k = String(s || "").toUpperCase();
          const cfg = CAMPAIGN_STATUS_OPTIONS.find((o) => o.value === k);
          return (
            <Tag color={CAMPAIGN_STATUS_COLOR[k] || "default"}>
              {cfg?.label || k || "--"}
            </Tag>
          );
        },
      },
      {
        title: "Email người mua",
        dataIndex: "buyerEmail",
        key: "buyerEmail",
        width: 240,
        render: (v) => v || "--",
      },
      {
        title: "Thao tác",
        key: "actions",
        fixed: "right",
        width: 150,
        render: (_, r) => (
          <Space>
            <Button
              type="link"
              onClick={() => goDetail(r)}
              className="!h-10 !w-10 !p-0 !rounded-xl !bg-blue-600 !text-white !border-none hover:!bg-blue-700 flex items-center justify-center"
              title="Xem"
            >
              <Eye size={18} />
            </Button>
            <Button
              type="link"
              onClick={() => goEdit(r)}
              className="!h-10 !w-10 !p-0 !rounded-xl !text-white !border-none flex items-center justify-center"
              style={{ backgroundColor: "#10B981" }}
              title="Tạo booking từ campaign"
            >
              <Pencil size={18} />
            </Button>
          </Space>
        ),
      },
    ],
    [goDetail, goEdit]
  );

  return (
    <ConfigProvider locale={viVN}>
      <div className="h-full flex flex-col gap-4 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="border-2 border-gray-300 p-2 rounded-md w-fit">
              <CalendarRange className="text-gray-500" size={20} />
            </div>
            <div>
              <h1 className="text-[18px] font-bold uppercase">
                Quản lý booking Campaign
              </h1>
              <p className="text-[14px] text-gray-600">
                Tra cứu và lọc các booking Campaign trong hệ thống.
              </p>
            </div>
          </div>

          <Button
            type="link"
            onClick={goCreate}
            className="!h-10 !w-10 !p-0 !rounded-xl !text-white !border-none flex items-center justify-center"
            style={{ backgroundColor: "#10B981" }}
            title="Thêm campaign"
          >
            <Plus size={18} />
          </Button>
        </div>

        {/* Bộ lọc */}
        <Card bordered={false} className="shadow-sm">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFilter}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            <Form.Item label="Từ khóa" name="search">
              <Input
                allowClear
                placeholder="Tên chiến dịch / Email / Gói..."
                maxLength={100}
              />
            </Form.Item>

            <Form.Item label="Trạng thái" name="status">
              <Select
                allowClear
                placeholder="Chọn trạng thái"
                options={CAMPAIGN_STATUS_OPTIONS}
              />
            </Form.Item>

            <Form.Item label="Khoảng thời gian" name="executionRange">
              <RangePicker
                className="w-full"
                format="DD/MM/YYYY"
                allowEmpty={[true, true]}
                placeholder={["Từ ngày", "Đến ngày"]}
              />
            </Form.Item>

            <Form.Item label="Gói (packageType)" name="packageType">
              <Select
                allowClear
                placeholder="Chọn gói"
                options={packageTypeOptions}
              />
            </Form.Item>

            <div>
              <Space size="middle" wrap>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<Search size={16} />}
                >
                  Tìm kiếm
                </Button>
                <Button icon={<RotateCcw size={16} />} onClick={handleReset}>
                  Đặt lại
                </Button>
                <Button
                  icon={<RefreshCcw size={16} />}
                  onClick={() => refetch()}
                  loading={isFetching}
                >
                  Làm mới
                </Button>
              </Space>
            </div>
          </Form>
        </Card>

        {/* Bảng */}
        <Card bordered={false} className="flex-1 shadow-sm">
          <Table
            columns={columns}
            dataSource={filtered}
            loading={isLoading}
            pagination={false}
            rowKey={rowKey}
            scroll={{ x: "auto" }}
          />

          <div className="mt-4 flex justify-end">
            <Pagination
              current={(serverPage ?? 0) + 1}
              pageSize={serverSize}
              total={totalElements ?? 0}
              pageSizeOptions={["10", "20", "50", "100"]}
              showSizeChanger
              onChange={(nextPage, nextSize) => {
                const changed = nextSize !== serverSize;
                setSize(nextSize);
                setPage(changed ? 0 : nextPage - 1);
              }}
            />
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
}
