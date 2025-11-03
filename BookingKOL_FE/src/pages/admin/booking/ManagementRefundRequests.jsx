import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Button, Card, Pagination, Select, Space, Table, Tag } from "antd";
import { RefreshCcw } from "lucide-react";
import { useGetRefundRequests } from "../../../hook/admin/booking/useGetRefundRequests";
import {
  REFUND_REQUEST_STATUS_COLOR,
  REFUND_REQUEST_STATUS_OPTIONS,
} from "../../../constants/mySingleBookingStatuses";

const resolveRefundStatusMeta = (status) => {
  if (!status) {
    return { label: "--", color: "default" };
  }

  const normalized = status.toUpperCase();
  const option = REFUND_REQUEST_STATUS_OPTIONS.find(
    (item) => item.value === normalized
  );

  return {
    label: option?.label ?? normalized,
    color: REFUND_REQUEST_STATUS_COLOR[normalized] ?? "default",
  };
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : "--";
};

const extractContractLabel = (contract) => {
  if (!contract || typeof contract !== "object") return "--";
  if (contract.contractNumber) return contract.contractNumber;
  if (contract.code) return contract.code;
  if (contract.id) return contract.id;
  return "--";
};

const DEFAULT_FILTERS = {
  page: 0,
  size: 10,
  status: undefined,
};

const ManagementRefundRequests = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const {
    refundsResponse,
    isLoadingRefunds,
    isFetchingRefunds,
    refetchRefunds,
  } = useGetRefundRequests(filters);

  const tableData = useMemo(() => {
    if (Array.isArray(refundsResponse?.content)) return refundsResponse.content;
    if (Array.isArray(refundsResponse)) return refundsResponse;
    return [];
  }, [refundsResponse]);

  const columns = useMemo(
    () => [
      {
        title: "Mã hoàn tiền",
        dataIndex: "id",
        key: "id",
        render: (value) => value ?? "--",
        width: 220,
      },
      {
        title: "Số tiền",
        dataIndex: "amount",
        key: "amount",
        render: (value) => formatCurrency(value),
        width: 140,
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (value) => {
          const meta = resolveRefundStatusMeta(value);
          return meta.label === "--" ? (
            "--"
          ) : (
            <Tag color={meta.color}>{meta.label}</Tag>
          );
        },
        width: 140,
      },
      {
        title: "Mã hợp đồng",
        dataIndex: "contract",
        key: "contract",
        render: (contract) => extractContractLabel(contract),
        width: 160,
      },
      {
        title: "Ngân hàng",
        dataIndex: "bankName",
        key: "bankName",
        render: (value) => value || "--",
        width: 220,
      },
      {
        title: "Số tài khoản",
        dataIndex: "bankNumber",
        key: "bankNumber",
        render: (value) => value || "--",
        width: 160,
      },
      {
        title: "Lý do",
        dataIndex: "reason",
        key: "reason",
        render: (value) => value || "--",
      },
      {
        title: "Ngày tạo yêu cầu",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (value) => formatDateTime(value),
        width: 180,
      },
      {
        title: "Ngày hoàn tiền",
        dataIndex: "refundedAt",
        key: "refundedAt",
        render: (value) => formatDateTime(value),
        width: 180,
      },
    ],
    []
  );

  const totalItems =
    typeof refundsResponse?.totalElements === "number"
      ? refundsResponse.totalElements
      : tableData.length;

  const currentPage = filters.page + 1;
  const loading = isLoadingRefunds || isFetchingRefunds;

  const handleStatusChange = (value) => {
    setFilters((prev) => ({
      ...prev,
      page: 0,
      status: value || undefined,
    }));
  };

  const handleResetFilters = () => setFilters(DEFAULT_FILTERS);
  const handleRefresh = () => refetchRefunds();

  const handlePaginationChange = (page, pageSize) => {
    setFilters((prev) => ({
      ...prev,
      page: page - 1,
      size: pageSize,
    }));
  };

  return (
    <div className="space-y-4">
      <Card
        title="Danh sách yêu cầu hoàn tiền"
        extra={
          <Space>
            <Select
              allowClear
              placeholder="Chọn trạng thái"
              style={{ width: 180 }}
              options={REFUND_REQUEST_STATUS_OPTIONS}
              value={filters.status}
              onChange={handleStatusChange}
            />
            <Button onClick={handleResetFilters}>Xóa lọc</Button>
            <Button icon={<RefreshCcw size={16} />} onClick={handleRefresh}>
              Tải lại
            </Button>
          </Space>
        }
      >
        <Table
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={tableData}
          loading={loading}
          bordered
          pagination={false}
          scroll={{ x: true }}
        />
        <div className="flex justify-end mt-4">
          <Pagination
            current={currentPage}
            pageSize={filters.size}
            total={totalItems}
            onChange={handlePaginationChange}
            showSizeChanger
            pageSizeOptions={["10", "20", "50"]}
            showTotal={(total) => `Tổng ${total} mục`}
          />
        </div>
      </Card>
    </div>
  );
};

export default ManagementRefundRequests;
