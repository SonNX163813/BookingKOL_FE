import { useCallback, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
} from "antd";
import { Eye, RefreshCcw } from "lucide-react";
import { useGetRefundRequests } from "../../../hook/admin/booking/useGetRefundRequests";
import { useGetRefundRequestDetail } from "../../../hook/admin/booking/useGetRefundRequestDetail";
import { useConfirmRefundRequest } from "../../../hook/admin/booking/useConfirmRefundRequest";
import {
  BOOKING_STATUS_LABEL,
  PAYMENT_STATUS_COLOR,
  PAYMENT_STATUS_LABEL,
  REFUND_REQUEST_STATUS_COLOR,
  REFUND_REQUEST_STATUS_OPTIONS,
  STATUS_TAG_COLOR,
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

const resolveBookingStatusMeta = (status) => {
  if (!status) {
    return { label: "--", color: "default" };
  }

  const normalized = status.toUpperCase();

  return {
    label: BOOKING_STATUS_LABEL[normalized] ?? normalized,
    color: STATUS_TAG_COLOR[normalized] ?? "default",
  };
};

const resolvePaymentStatusMeta = (status) => {
  if (!status) {
    return { label: "--", color: "default" };
  }

  const normalized = status.toUpperCase();

  return {
    label: PAYMENT_STATUS_LABEL[normalized] ?? normalized,
    color: PAYMENT_STATUS_COLOR[normalized] ?? "default",
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

const formatCurrencyDisplay = (value) =>
  value === undefined || value === null ? "--" : formatCurrency(value);

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

const CONFIRMABLE_REFUND_STATUSES = new Set(["PENDING"]);

const ManagementRefundRequests = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedRefundId, setSelectedRefundId] = useState(null);

  const {
    refundsResponse,
    isLoadingRefunds,
    isFetchingRefunds,
    refetchRefunds,
  } = useGetRefundRequests(filters);

  const {
    refundDetailResponse,
    isLoadingRefundDetail,
    isFetchingRefundDetail,
    refetchRefundDetail,
    errorRefundDetail,
  } = useGetRefundRequestDetail(selectedRefundId);

  const handleConfirmRefundSuccess = useCallback(() => {
    refetchRefunds();
    refetchRefundDetail();
  }, [refetchRefundDetail, refetchRefunds]);

  const {
    isConfirmingRefundRequest,
    handleConfirmRefundRequest: confirmRefundRequest,
  } = useConfirmRefundRequest({
    onSuccess: handleConfirmRefundSuccess,
  });

  const detailVisible = Boolean(selectedRefundId);

  const refundDetail = useMemo(() => {
    if (!refundDetailResponse) return null;
    if (refundDetailResponse?.data) return refundDetailResponse.data;
    return refundDetailResponse;
  }, [refundDetailResponse]);

  const contractDetail =
    refundDetail && typeof refundDetail.contract === "object"
      ? refundDetail.contract
      : null;

  const paymentDetail =
    contractDetail && typeof contractDetail.paymentDTO === "object"
      ? contractDetail.paymentDTO
      : refundDetail && typeof refundDetail.paymentDTO === "object"
      ? refundDetail.paymentDTO
      : null;

  const contractStatusMeta = useMemo(
    () => resolveBookingStatusMeta(contractDetail?.status),
    [contractDetail?.status]
  );

  const paymentStatusMeta = useMemo(
    () => resolvePaymentStatusMeta(paymentDetail?.status),
    [paymentDetail?.status]
  );

  const detailStatusMeta = resolveRefundStatusMeta(refundDetail?.status);
  const normalizedRefundStatus = useMemo(() => {
    if (!refundDetail?.status) return null;
    return String(refundDetail.status).toUpperCase();
  }, [refundDetail?.status]);

  const hasRefundFinished = useMemo(
    () =>
      normalizedRefundStatus === "REFUNDED" ||
      Boolean(refundDetail?.refundedAt),
    [normalizedRefundStatus, refundDetail?.refundedAt]
  );

  const shouldShowConfirmButton = useMemo(
    () =>
      Boolean(
        detailVisible &&
          !hasRefundFinished &&
          normalizedRefundStatus &&
          CONFIRMABLE_REFUND_STATUSES.has(normalizedRefundStatus)
      ),
    [detailVisible, hasRefundFinished, normalizedRefundStatus]
  );

  const isInitialDetailLoading =
    detailVisible && isLoadingRefundDetail && !refundDetail;

  const isRefreshingDetail =
    detailVisible && isFetchingRefundDetail && Boolean(refundDetail);

  const detailRefreshLoading =
    detailVisible && isFetchingRefundDetail && !isInitialDetailLoading;

  const detailErrorMessage =
    errorRefundDetail?.response?.data?.message ??
    errorRefundDetail?.message ??
    null;

  const handleViewDetail = useCallback((record) => {
    const nextId = record?.id;
    if (!nextId) return;
    setSelectedRefundId(nextId);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedRefundId(null);
  }, []);

  const handleRefetchDetail = useCallback(() => {
    if (!selectedRefundId) return;
    refetchRefundDetail();
  }, [refetchRefundDetail, selectedRefundId]);

  const handleConfirmRefund = useCallback(async () => {
    if (!selectedRefundId) return;
    try {
      await confirmRefundRequest({ refundId: selectedRefundId });
    } catch (error) {
      // Error handling is managed via global interceptors or hook callbacks.
    }
  }, [confirmRefundRequest, selectedRefundId]);

  const tableData = useMemo(() => {
    if (Array.isArray(refundsResponse?.content)) return refundsResponse.content;
    if (Array.isArray(refundsResponse)) return refundsResponse;
    return [];
  }, [refundsResponse]);

  const columns = useMemo(
    () => [
      // ✅ đưa "Mã hợp đồng" lên cột đầu
      {
        title: "Mã hợp đồng",
        dataIndex: "contract",
        key: "contract",
        render: (contract) => extractContractLabel(contract),
        // width: 160,
      },
      {
        title: "Số tiền",
        dataIndex: "amount",
        key: "amount",
        render: (value) => formatCurrency(value),
        // width: 140,
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
        // width: 140,
      },
      {
        title: "Số tài khoản",
        dataIndex: "bankNumber",
        key: "bankNumber",
        render: (value) => value || "--",
        // width: 160,
      },
      {
        title: "Tên tài khoản",
        dataIndex: "ownerName",
        key: "ownerName",
        render: (value) => value || "--",
        // width: 160,
      },
      {
        title: "Ngân hàng",
        dataIndex: "bankName",
        key: "bankName",
        render: (value) => value || "--",
        width: 300,
      },
      {
        title: "Lý do hoàn tiền",
        dataIndex: "reason",
        key: "reason",
        render: (value) => value || "--",
        width: 300,
      },
      {
        title: "Mô tả thêm",
        dataIndex: "description",
        key: "description",
        render: (value) => value || "--",
        width: 300,
      },
      {
        title: "Ngày tạo yêu cầu",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (value) => formatDateTime(value),
        // width: 180,
      },
      {
        title: "Ngày hoàn tiền",
        dataIndex: "refundedAt",
        key: "refundedAt",
        render: (value) => formatDateTime(value),
        // width: 180,
      },
      {
        title: "Thao tác",
        key: "actions",
        fixed: "right",
        // width: 110,
        render: (_, record) => (
          <Button
            type="link"
            onClick={() => handleViewDetail(record)}
            className="!h-10 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
          >
            <Eye size={18} className="font-semibold" />
          </Button>
        ),
      },
    ],
    [handleViewDetail]
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

      <Drawer
        title="Chi tiết yêu cầu hoàn tiền"
        width={640}
        open={detailVisible}
        onClose={handleCloseDetail}
        maskClosable={!isInitialDetailLoading}
        extra={
          detailVisible ? (
            <Space>
              {shouldShowConfirmButton ? (
                <Popconfirm
                  title="Xác nhận hoàn tiền"
                  description="Bạn có chắc chắn đã hoàn tiền cho người dùng?"
                  okText="Xác nhận"
                  cancelText="Huỷ"
                  onConfirm={handleConfirmRefund}
                  okButtonProps={{ loading: isConfirmingRefundRequest }}
                  cancelButtonProps={{ disabled: isConfirmingRefundRequest }}
                >
                  <Button
                    type="primary"
                    loading={isConfirmingRefundRequest}
                    disabled={isConfirmingRefundRequest || !selectedRefundId}
                  >
                    Xác nhận hoàn tiền
                  </Button>
                </Popconfirm>
              ) : null}
              <Button
                type="text"
                icon={<RefreshCcw size={16} />}
                onClick={handleRefetchDetail}
                disabled={!selectedRefundId}
                loading={detailRefreshLoading}
              >
                Tải lại
              </Button>
            </Space>
          ) : null
        }
      >
        {isInitialDetailLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spin />
          </div>
        ) : (
          <Spin spinning={isRefreshingDetail} tip="Đang cập nhật...">
            {errorRefundDetail ? (
              <Alert
                type="error"
                showIcon
                message="Không thể tải chi tiết hoàn tiền"
                description={
                  detailErrorMessage && detailErrorMessage.length > 0
                    ? detailErrorMessage
                    : undefined
                }
              />
            ) : refundDetail ? (
              <div className="space-y-4">
                <Divider orientation="left">Thông tin chung</Divider>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Mã hoàn tiền">
                    {refundDetail.id ?? "--"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số tiền">
                    {formatCurrencyDisplay(refundDetail.amount)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    {detailStatusMeta.label === "--" ? (
                      "--"
                    ) : (
                      <Tag color={detailStatusMeta.color}>
                        {detailStatusMeta.label}
                      </Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Lý do hoàn tiền">
                    {refundDetail.reason || "--"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Mô tả thêm">
                    {refundDetail.description || "--"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày tạo">
                    {formatDateTime(refundDetail.createdAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày hoàn tiền">
                    {formatDateTime(refundDetail.refundedAt)}
                  </Descriptions.Item>
                </Descriptions>

                <Divider orientation="left">Thông tin ngân hàng</Divider>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Ngân hàng">
                    {refundDetail.bankName || "--"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số tài khoản">
                    {refundDetail.bankNumber || "--"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tên tài khoản">
                    {refundDetail.ownerName || "--"}
                  </Descriptions.Item>
                </Descriptions>

                <Divider orientation="left">Thông tin hợp đồng</Divider>
                {contractDetail ? (
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Mã hợp đồng">
                      {extractContractLabel(contractDetail)}
                    </Descriptions.Item>
                    <Descriptions.Item label="ID hợp đồng">
                      {contractDetail.id || "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      {contractStatusMeta.label === "--" ? (
                        "--"
                      ) : (
                        <Tag color={contractStatusMeta.color}>
                          {contractStatusMeta.label}
                        </Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Giá trị">
                      {formatCurrencyDisplay(contractDetail.amount)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">
                      {formatDateTime(contractDetail.createdAt)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Cập nhật lúc">
                      {formatDateTime(contractDetail.updatedAt)}
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Empty description="Không có hợp đồng liên quan" />
                )}

                <Divider orientation="left">Thông tin thanh toán</Divider>
                {paymentDetail ? (
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Mã thanh toán">
                      {paymentDetail.id || "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tổng tiền">
                      {formatCurrencyDisplay(paymentDetail.totalAmount)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Đã thanh toán">
                      {formatCurrencyDisplay(paymentDetail.paidAmount)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tiền tệ">
                      {paymentDetail.currency || "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      {paymentStatusMeta.label === "--" ? (
                        "--"
                      ) : (
                        <Tag color={paymentStatusMeta.color}>
                          {paymentStatusMeta.label}
                        </Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">
                      {formatDateTime(paymentDetail.createdAt)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Cập nhật lúc">
                      {formatDateTime(paymentDetail.updatedAt)}
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Empty description="Không có thông tin thanh toán" />
                )}
              </div>
            ) : (
              <Empty description="Không có dữ liệu hoàn tiền" />
            )}
          </Spin>
        )}
      </Drawer>
    </div>
  );
};

export default ManagementRefundRequests;
