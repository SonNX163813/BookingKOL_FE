import { useCallback, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  Input,
  Pagination,
  Table,
  Tag,
  Typography,
  message,
  ConfigProvider,
} from "antd";
import viVN from "antd/locale/vi_VN";
import { RefreshCcw, RotateCcw, Search } from "lucide-react";
import { useGetAdminCourseHistory } from "../../../hook/admin/course/useGetAdminCourseHistory";
import { confirmAdminCoursePurchase } from "../../../services/admin/AdminCourseHistoryAPI";

dayjs.locale("vi");
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const MAX_SEARCH_LEN = 100;

const COURSE_STATUS_META = {
  COURSEASSIGNED: { label: "Khóa học đã được gửi", color: "success" },
  NOTASSIGNED: { label: "Khóa học chưa được gửi", color: "blue" },
};

const PAYMENT_STATUS_META = {
  true: { label: "Đã thanh toán", color: "green" },
  false: { label: "Chưa thanh toán", color: "default" },
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return "--";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "--";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : "--";
};

const resolveCourseStatus = (status) => {
  if (!status) return { label: "--", color: "default" };
  const normalized = status.toUpperCase();
  return (
    COURSE_STATUS_META[normalized] ?? {
      label: normalized,
      color: "default",
    }
  );
};

const ManagementCourseHistory = () => {
  const [form] = Form.useForm();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [filters, setFilters] = useState({
    search: undefined,
    startDate: undefined,
    endDate: undefined,
  });
  const [confirmingId, setConfirmingId] = useState(null);

  // ✅ watch keyword để hiện thông báo khi đạt 100 ký tự
  const searchValue = Form.useWatch("search", form);
  const isSearchMax = (searchValue?.length ?? 0) >= MAX_SEARCH_LEN;

  const {
    data: response,
    isPending,
    isFetching,
    refetch,
  } = useGetAdminCourseHistory({
    page,
    size,
    search: filters.search,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const historyData = response?.data ?? {};
  const rows = Array.isArray(historyData.content)
    ? historyData.content.filter(Boolean)
    : [];
  const totalElements = Number(historyData.totalElements) || 0;

  const tableLoading = isPending || isFetching;
  const showLoadingPlaceholder = isPending && !rows.length;
  const refreshing = isFetching && !isPending;

  const handleSubmit = (values) => {
    const [start, end] = values.dateRange || [];
    setFilters({
      search: values.search?.trim() || undefined,
      startDate: start ? dayjs(start).startOf("day").toISOString() : undefined,
      endDate: end ? dayjs(end).endOf("day").toISOString() : undefined,
    });
    setPage(0);
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({
      search: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    setPage(0);
  };

  const handlePageChange = (pageNumber, pageSize) => {
    setPage(pageNumber - 1);
    setSize(pageSize);
  };

  const handleConfirmCourse = useCallback(
    async (record) => {
      if (!record?.id) return;
      try {
        setConfirmingId(record.id);
        await confirmAdminCoursePurchase(record.id);
        message.success("Xác nhận khóa học thành công");
        refetch();
      } catch (error) {
        if (!error?.response) {
          message.error("Không thể xác nhận khóa học. Vui lòng thử lại.");
        }
      } finally {
        setConfirmingId(null);
      }
    },
    [refetch]
  );

  const pageRange = useMemo(() => {
    if (!totalElements) return null;
    const start = page * size + 1;
    const end = Math.min((page + 1) * size, totalElements);
    return { start, end };
  }, [page, size, totalElements]);

  const columns = useMemo(
    () => [
      {
        title: "Mã đơn",
        dataIndex: "purchasedCourseNumber",
        width: 140,
        render: (value, record) => (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">
              {value || record?.id || "--"}
            </span>
          </div>
        ),
      },
      {
        title: "Khóa học",
        dataIndex: "courseName",
        render: (value) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{value || "--"}</span>
          </div>
        ),
      },
      {
        title: "Khách hàng",
        key: "customer",
        render: (_, record) => {
          const userEmail = record?.email || record?.user?.email;
          const phone = record?.phoneNumber || record?.user?.phone;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-gray-900">
                {record?.user?.fullName || "--"}
              </span>
              <span className="text-xs text-gray-500">{userEmail || "--"}</span>
              {phone && <span className="text-xs text-gray-500">{phone}</span>}
            </div>
          );
        },
      },
      {
        title: "Giá bán",
        dataIndex: "currentPrice",
        width: 140,
        render: (value) => (
          <span className="font-semibold text-gray-900">
            {formatCurrency(value)}
          </span>
        ),
      },
      {
        title: "Thanh toán",
        dataIndex: "isPaid",
        width: 140,
        render: (value) => {
          const meta = PAYMENT_STATUS_META[String(Boolean(value))];
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        width: 180,
        render: (value) => {
          const meta = resolveCourseStatus(value);
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: "Ngày bắt đầu",
        dataIndex: "startDate",
        width: 200,
        render: (value) => formatDateTime(value),
      },
      {
        title: "Ngày kết thúc",
        dataIndex: "endDate",
        width: 200,
        render: (value) => formatDateTime(value),
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 160,
        render: (_, record) => {
          const statusKey = record?.status?.toUpperCase();
          const canConfirm = statusKey === "NOTASSIGNED" && record?.isPaid;
          return (
            <Button
              type="primary"
              disabled={!canConfirm}
              onClick={() => handleConfirmCourse(record)}
              loading={confirmingId === record?.id}
            >
              Xác nhận
            </Button>
          );
        },
      },
    ],
    [confirmingId, handleConfirmCourse]
  );

  return (
    <ConfigProvider locale={viVN}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Title level={3} className="!mb-0">
              Lịch sử mua khóa học
            </Title>
            <Text type="secondary">
              Theo dõi các đơn đăng ký khóa học và trạng thái thanh toán.
            </Text>
          </div>
          <Button
            icon={<RefreshCcw size={16} />}
            onClick={() => refetch()}
            loading={refreshing}
          >
            Làm mới
          </Button>
        </div>

        <Card>
          <Form
            layout="vertical"
            form={form}
            initialValues={{ search: undefined, dateRange: [] }}
            onFinish={handleSubmit}
          >
            <div className="grid gap-4 md:grid-cols-[2fr_2fr_auto_auto]">
              {/* ✅ max 100 + warning dưới input khi đạt max */}
              <Form.Item
                label="Tìm kiếm"
                name="search"
                className="mb-0"
                rules={[
                  { max: MAX_SEARCH_LEN, message: "Từ khóa tối đa 100 ký tự." },
                ]}
                validateStatus={isSearchMax ? "warning" : undefined}
                help={isSearchMax ? "Tối đa 100 ký tự." : undefined}
              >
                <Input
                  placeholder="Tìm theo tên, email hoặc mã đơn..."
                  allowClear
                  maxLength={MAX_SEARCH_LEN}
                />
              </Form.Item>

              {/* ✅ RangePicker tiếng Việt giống file Campaign */}
              <Form.Item label="Khoảng ngày" name="dateRange" className="mb-0">
                <RangePicker
                  className="w-full"
                  format="DD/MM/YYYY"
                  allowClear
                  placeholder={["Từ ngày", "Đến ngày"]}
                />
              </Form.Item>

              <Form.Item label=" " colon={false} className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<Search size={16} />}
                  className="w-full md:w-auto"
                >
                  Lọc
                </Button>
              </Form.Item>

              <Form.Item label=" " colon={false} className="mb-0">
                <Button
                  icon={<RotateCcw size={16} />}
                  onClick={handleReset}
                  className="w-full md:w-auto"
                >
                  Xóa lọc
                </Button>
              </Form.Item>
            </div>
          </Form>
        </Card>

        <Card>
          <Table
            rowKey={(record) => record?.id ?? record?.purchasedCourseNumber}
            columns={columns}
            dataSource={rows}
            loading={tableLoading}
            pagination={false}
            scroll={{ x: 960 }}
            locale={{
              emptyText: showLoadingPlaceholder ? (
                "Đang tải dữ liệu..."
              ) : (
                <Empty description="Không có dữ liệu" />
              ),
            }}
          />

          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Text type="secondary">
              {pageRange
                ? `Đang hiển thị ${pageRange.start}-${pageRange.end} / ${totalElements}`
                : "Không có dữ liệu"}
            </Text>
            <Pagination
              current={page + 1}
              pageSize={size}
              pageSizeOptions={["10", "20", "50"]}
              total={totalElements}
              showSizeChanger
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
            />
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default ManagementCourseHistory;
