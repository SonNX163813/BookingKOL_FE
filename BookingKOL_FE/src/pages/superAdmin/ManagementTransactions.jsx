import { useCallback, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import { useMutation } from "@tanstack/react-query";
import { RefreshCcw, Eye } from "lucide-react";
import { useGetSuperAdminTransactions } from "../../hook/superadmin/useGetSuperAdminTransactions";
import { getSuperAdminTransactionDetail } from "../../services/superadmin/SuperAdminTransactionAPI";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const DEFAULT_PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { label: "Tất cả", value: "ALL" },
  { label: "Hoàn thành", value: "COMPLETED" },
  { label: "Đang xử lý", value: "PENDING" },
  { label: "Thất bại", value: "FAILED" },
  { label: "Giao dịch không xác định", value: "ORPHANED" },
];

const formatCurrency = (value) => {
  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
  return formatter.format(Number(value) || 0);
};

const formatDateTime = (value) => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY HH:mm") : "--";
};

const getStatusMeta = (status) => {
  switch (status) {
    case "COMPLETED":
      return { color: "green", label: "Hoàn thành" };
    case "FAILED":
      return { color: "red", label: "Thất bại" };
    case "PENDING":
      return { color: "gold", label: "Đang xử lý" };
    case "ORPHANED":
      return { color: "default", label: "Giao dịch không xác định" };
    default:
      return { color: "default", label: status || "Không xác định" };
  }
};

const STAT_CONFIG = [
  { key: "totalTransactions", label: "Tổng số giao dịch" },
  { key: "completedCount", label: "Hoàn thành" },
  { key: "failedCount", label: "Thất bại" },
  { key: "orphanedCount", label: "Giao dịch không xác định" },
];

const ManagementTransactions = () => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState({
    status: "ALL",
    search: "",
    startDate: undefined,
    endDate: undefined,
  });
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [filterForm] = Form.useForm();

  const {
    data: transactionResponse,
    isPending,
    isFetching,
    refetch,
  } = useGetSuperAdminTransactions({
    page,
    size,
    status: filters.status,
    search: filters.search,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const detailMutation = useMutation({
    mutationFn: ({ transactionId }) =>
      getSuperAdminTransactionDetail({ transactionId }),
    onSuccess: (data) => {
      setDetailData(data);
    },
  });

  const tableLoading = isPending || isFetching;

  const stats = transactionResponse?.stats || {
    totalTransactions: 0,
    completedCount: 0,
    failedCount: 0,
    orphanedCount: 0,
    totalAmountIn: 0,
    startDate: null,
    endDate: null,
  };

  const transactionsPage = transactionResponse?.transactionsPage || {
    content: [],
    totalElements: 0,
    totalPages: 0,
    pageNumber: 0,
    pageSize: size,
    numberOfElements: 0,
  };

  const rows = transactionsPage.content;
  const totalElements = transactionsPage.totalElements ?? rows.length;

  const pageRange = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    const start = page * size + 1;
    const end = start + rows.length - 1;
    return { start, end };
  }, [rows, page, size]);

  const handlePageChange = (nextPage, nextSize) => {
    setPage((nextPage ?? 1) - 1);
    setSize(nextSize || DEFAULT_PAGE_SIZE);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleFilterSubmit = (values) => {
    const dateRange = values?.dateRange || [];
    setFilters({
      status: values?.status || "ALL",
      search: values?.search?.trim() || "",
      startDate: dateRange[0]
        ? dateRange[0].startOf("day").toISOString()
        : undefined,
      endDate: dateRange[1]
        ? dateRange[1].endOf("day").toISOString()
        : undefined,
    });
    setPage(0);
  };

  const handleResetFilters = () => {
    filterForm.resetFields();
    setFilters({
      status: "ALL",
      search: "",
      startDate: undefined,
      endDate: undefined,
    });
    setPage(0);
  };

  const handleOpenDetail = useCallback(
    (record) => {
      if (!record?.id) return;
      setSelectedTransactionId(record.id);
      setDetailData(null);
      setIsDetailOpen(true);
      detailMutation.mutate({ transactionId: record.id });
    },
    [detailMutation]
  );

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setDetailData(null);
    setSelectedTransactionId(null);
  };

  const columns = useMemo(
    () => [
      {
        title: "ID",
        dataIndex: "id",
        key: "id",
        width: 90,
      },
      {
        title: "Cổng thanh toán",
        dataIndex: "gateway",
        key: "gateway",
        width: 110,
        render: (value) => value || "--",
      },
      {
        title: "Ngày giao dịch",
        dataIndex: "transactionDate",
        key: "transactionDate",
        width: 180,
        render: (value) => formatDateTime(value),
      },
      {
        title: "Tài khoản",
        dataIndex: "accountNumber",
        key: "accountNumber",
        width: 160,
      },
      {
        title: "Tài khoản phụ",
        dataIndex: "subAccount",
        key: "subAccount",
        width: 160,
        render: (value) => value || "--",
      },
      {
        title: "Số tiền vào",
        dataIndex: "amountIn",
        key: "amountIn",
        width: 150,
        render: (value) => formatCurrency(value),
      },
      {
        title: "Mã tham chiếu",
        dataIndex: "referenceNumber",
        key: "referenceNumber",
        ellipsis: true,
        render: (value) => value || "--",
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 140,
        render: (value) => {
          const meta = getStatusMeta(value);
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: "Mã thanh toán",
        dataIndex: "paymentId",
        key: "paymentId",
        ellipsis: true,
        render: (value) => value || "--",
      },
      {
        title: "Hành động",
        key: "actions",
        width: 120,
        fixed: "right",
        render: (_, record) => (
          <Button
            type="link"
            size="small"
            icon={<Eye size={16} />}
            onClick={() => handleOpenDetail(record)}
          >
            Chi tiết
          </Button>
        ),
      },
    ],
    [handleOpenDetail]
  );

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <Title level={3} className="!mb-0">
            Giao dịch ngân hàng
          </Title>
          <Text type="secondary">
            Giám sát giao dịch webhook SePay và đối soát với thanh toán.
          </Text>
        </div>
        <Space>
          <Button icon={<RefreshCcw size={16} />} onClick={handleRefresh}>
            Làm mới
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        {STAT_CONFIG.map((stat) => (
          <Col xs={24} sm={12} md={6} key={stat.key}>
            <Card>
              <Statistic
                title={stat.label}
                value={stats?.[stat.key] ?? 0}
                valueStyle={{ fontSize: 24 }}
              />
            </Card>
          </Col>
        ))}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng số tiền vào"
              value={stats?.totalAmountIn || 0}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="mb-6" title="Bộ lọc">
        <Form
          layout="vertical"
          form={filterForm}
          initialValues={{ status: "ALL" }}
          onFinish={handleFilterSubmit}
        >
          <Row gutter={[16, 16]}>
            {/* <Col xs={24} md={8}>
              <Form.Item name="search" label="Từ khóa">
                <Input placeholder="Mã tham chiếu, nội dung..." allowClear />
              </Form.Item>
            </Col> */}
            <Col xs={24} md={8}>
              <Form.Item name="status" label="Trạng thái">
                <Select options={STATUS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="dateRange" label="Khoảng ngày">
                <RangePicker
                  className="w-full"
                  format="DD/MM/YYYY"
                  allowClear
                  placeholder={["Từ ngày", "Đến ngày"]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <div className="flex item-center gap-3">
                <Button type="primary" htmlType="submit">
                  Áp dụng bộ lọc
                </Button>
                <Button onClick={handleResetFilters}>Đặt lại</Button>
              </div>
            </Col>
          </Row>
          {/* <div className="flex flex-wrap gap-3">
            <Button type="primary" htmlType="submit">
              Áp dụng bộ lọc
            </Button>
            <Button onClick={handleResetFilters}>Đặt lại</Button>
          </div> */}
        </Form>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={rows}
          rowKey={(record, index) =>
            record.id ?? record.referenceNumber ?? `tx-${index}`
          }
          pagination={false}
          scroll={{ x: 1000 }}
          loading={tableLoading}
          locale={{
            emptyText: <Empty description="Không có giao dịch" />,
          }}
        />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4">
          <Text type="secondary">
            {pageRange
              ? `Hiển thị ${pageRange.start}-${pageRange.end} trên tổng ${totalElements} giao dịch`
              : "Không có giao dịch"}
          </Text>
          <Pagination
            current={page + 1}
            pageSize={size}
            total={totalElements}
            showSizeChanger
            pageSizeOptions={["10", "20", "50"]}
            onChange={handlePageChange}
            onShowSizeChange={handlePageChange}
          />
        </div>
      </Card>

      <Drawer
        title={`Giao dịch #${selectedTransactionId || "--"}`}
        open={isDetailOpen}
        onClose={handleCloseDetail}
        width={600}
        destroyOnClose
      >
        {detailMutation.isPending ? (
          <div className="flex justify-center py-6">
            <Spin />
          </div>
        ) : detailData ? (
          <Descriptions column={1} bordered size="medium">
            <Descriptions.Item label="ID">
              {detailData.id ?? "--"}
            </Descriptions.Item>
            <Descriptions.Item label="Cổng thanh toán">
              {detailData.gateway || "--"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày giao dịch">
              {formatDateTime(detailData.transactionDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Số tài khoản">
              {detailData.accountNumber || "--"}
            </Descriptions.Item>
            <Descriptions.Item label="Tài khoản phụ">
              {detailData.subAccount || "--"}
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền vào">
              {formatCurrency(detailData.amountIn)}
            </Descriptions.Item>
            <Descriptions.Item label="Nội dung giao dịch">
              {detailData.transactionContent || "--"}
            </Descriptions.Item>
            <Descriptions.Item label="Mã tham chiếu">
              {detailData.referenceNumber || "--"}
            </Descriptions.Item>
            <Descriptions.Item label="Mã thanh toán">
              {detailData.paymentId || "--"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={getStatusMeta(detailData.status).color}>
                {getStatusMeta(detailData.status).label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian tạo">
              {formatDateTime(detailData.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Dữ liệu gốc">
              <pre className="bg-gray-100 rounded p-2 text-xs whitespace-pre-wrap">
                {detailData.body || "--"}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty description="Không có dữ liệu" />
        )}
      </Drawer>
    </div>
  );
};

export default ManagementTransactions;
