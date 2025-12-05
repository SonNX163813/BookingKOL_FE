import { useCallback, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Pagination,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { Plus, RefreshCcw, Eye, ShieldCheck } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetSuperAdminMerchants } from "../../hook/superadmin/useGetSuperAdminMerchants";
import {
  activateSuperAdminMerchant,
  createSuperAdminMerchant,
  getSuperAdminMerchantDetail,
} from "../../services/superadmin/SuperAdminMerchantAPI";
import { maxLengthRule, requiredRule } from "../../utils/formValidators";
import { MonetizationOnOutlined } from "@mui/icons-material";

const { Title, Text } = Typography;

const DEFAULT_PAGE_SIZE = 10;

const formatDateTime = (value) => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY HH:mm") : "--";
};

const maskApiKey = (value) => {
  if (!value) return "--";
  return "*".repeat(String(value).length);
};

const ManagementMerchant = () => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [createForm] = Form.useForm();

  const queryClient = useQueryClient();

  const {
    data: merchantsResponse,
    isPending,
    isFetching,
    refetch,
  } = useGetSuperAdminMerchants({ page, size });

  const tableLoading = isPending || isFetching;
  const payload = useMemo(() => {
    if (!merchantsResponse) return {};
    if (merchantsResponse?.data) return merchantsResponse.data;
    return merchantsResponse;
  }, [merchantsResponse]);

  const rows = useMemo(() => {
    if (Array.isArray(payload?.content)) {
      return payload.content;
    }
    if (Array.isArray(payload?.data?.content)) {
      return payload.data.content;
    }
    return [];
  }, [payload]);

  const totalElements = useMemo(() => {
    if (typeof payload?.totalElements === "number")
      return payload.totalElements;
    if (typeof payload?.data?.totalElements === "number") {
      return payload.data.totalElements;
    }
    return Array.isArray(rows) ? rows.length : 0;
  }, [payload, rows]);

  const pageRange = useMemo(() => {
    if (!Array.isArray(rows) || rows.length === 0) return null;
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

  const handleOpenCreateModal = () => {
    createForm.resetFields();
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleSubmitCreate = () => {
    createForm
      .validateFields()
      .then((values) => {
        createMerchantMutation.mutate(values);
      })
      .catch(() => {});
  };

  const createMerchantMutation = useMutation({
    mutationFn: (payload) => createSuperAdminMerchant(payload),
    onSuccess: () => {
      message.success("Tạo phương thức thanh toán thành công.");
      setIsCreateModalOpen(false);
      createForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["superAdminMerchants"] });
    },
    onError: (error) => {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tạo phương thức thanh toán. Vui lòng thử lại.";
      message.error(errorMsg);
    },
  });

  const [activatingId, setActivatingId] = useState(null);
  const activateMerchantMutation = useMutation({
    mutationFn: (merchantId) => activateSuperAdminMerchant(merchantId),
    onSuccess: (_, merchantId) => {
      message.success("Kích hoạt phương thức thanh toán thành công.");
      queryClient.invalidateQueries({ queryKey: ["superAdminMerchants"] });
      if (detailData && detailData.id === merchantId) {
        setDetailData((prev) => (prev ? { ...prev, isActive: true } : prev));
      }
    },
    onError: (error) => {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể kích hoạt. Vui lòng thử lại.";
      message.error(errorMsg);
    },
    onSettled: () => {
      setActivatingId(null);
    },
  });

  const handleActivateMerchant = (merchantId) => {
    if (!merchantId) {
      message.warning("Không tìm thấy ID phương thức thanh toán.");
      return;
    }
    setActivatingId(merchantId);
    activateMerchantMutation.mutate(merchantId);
  };

  const handleViewDetail = useCallback(async (merchantId) => {
    if (!merchantId) {
      message.warning("Không tìm thấy ID phương thức thanh toán.");
      return;
    }
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const detailResponse = await getSuperAdminMerchantDetail({
        merchantId,
      });
      const normalized = detailResponse?.data ??
        detailResponse ?? { id: merchantId };
      setDetailData(normalized);
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tải chi tiết. Vui lòng thử lại.";
      message.error(errorMsg);
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setDetailData(null);
    setDetailLoading(false);
  };

  const columns = [
    {
      title: "Chủ tài khoản",
      dataIndex: "name",
      key: "name",
      width: 180,
      render: (value, record) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{value || "--"}</span>
          {/* <Text type="secondary" className="text-xs">
            ID: {record?.id || "--"}
          </Text> */}
        </div>
      ),
    },
    {
      title: "Ngân hàng",
      dataIndex: "bank",
      key: "bank",
      width: 140,
      render: (value) => value || "--",
    },
    {
      title: "Tài khoản",
      key: "accountNumber",
      width: 200,
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          <Text strong>
            Số TK: <Text>{record?.accountNumber || "--"}</Text>
          </Text>

          <Text strong>
            VA: <Text>{record?.vaNumber || "--"}</Text>
          </Text>
        </div>
      ),
    },
    {
      title: "API Key",
      dataIndex: "apiKey",
      key: "apiKey",
      width: 150,
      render: (value) => maskApiKey(value),
    },
    {
      title: "Ngày tạo / cập nhật",
      key: "timestamps",
      width: 200,
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          <Text type="secondary">Tạo: {formatDateTime(record?.createdAt)}</Text>
          <Text type="secondary">
            Cập nhật: {formatDateTime(record?.updatedAt)}
          </Text>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 140,
      render: (value) =>
        value ? (
          <Tag color="green">Đang kích hoạt</Tag>
        ) : (
          <Tag color="default">Tạm tắt</Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 200,
      render: (_, record) => {
        const recordId = record?.id;
        const isActive = Boolean(record?.isActive);
        const isActivating =
          activatingId === recordId && activateMerchantMutation.isPending;
        return (
          <Space>
            <Button
              icon={<Eye size={16} />}
              onClick={() => handleViewDetail(recordId)}
            >
              Chi tiết
            </Button>
            <Button
              type="primary"
              icon={<ShieldCheck size={16} />}
              onClick={() => handleActivateMerchant(recordId)}
              disabled={isActive}
              loading={isActivating}
            >
              Kích hoạt
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* <div>
          <Title level={3} className="!mb-0">
            Quản lý người dùng
          </Title>
          <Text type="secondary">
            Danh sách tất cả tài khoản trong hệ thống.
          </Text>
        </div> */}
        <div className="flex gap-2 items-center">
          <div className="border-2 p-2 border-gray-300">
            <MonetizationOnOutlined className="text-gray-400" />
          </div>
          <section>
            <Title level={3} className="!mb-0">
              Quản lý phương thức thanh toán
            </Title>
            <Text type="secondary">
              Theo dõi và kích hoạt các merchant thu tiền SePay.
            </Text>
          </section>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={handleOpenCreateModal}
          >
            Thêm phương thức
          </Button>
          <Button icon={<RefreshCcw size={16} />} onClick={handleRefresh}>
            Tải lại
          </Button>
        </div>
      </div>

      <Card>
        <Table
          rowKey={(record) => record?.id}
          columns={columns}
          dataSource={rows}
          loading={tableLoading}
          pagination={false}
          scroll={{ x: "auto" }}
          locale={{
            emptyText: tableLoading ? "Đang tải dữ liệu..." : <Empty />,
          }}
        />
        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <Text type="secondary">
            {pageRange
              ? `Hiển thị ${pageRange.start}-${pageRange.end} / ${totalElements}`
              : "Không có dữ liệu"}
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

      <Modal
        title="Thêm phương thức thanh toán"
        open={isCreateModalOpen}
        onCancel={handleCloseCreateModal}
        onOk={handleSubmitCreate}
        okText="Tạo"
        cancelText="Hủy"
        confirmLoading={createMerchantMutation.isPending}
        destroyOnClose
        maskClosable={false}
      >
        <Form layout="vertical" form={createForm}>
          <Form.Item
            label="Chủ tài khoản"
            name="name"
            rules={[
              requiredRule("Chủ tài khoản"),
              maxLengthRule("Chủ tài khoản", 120),
            ]}
          >
            <Input placeholder="Tên chủ tài khoản" allowClear />
          </Form.Item>
          <Form.Item
            label="API Key"
            name="apiKey"
            rules={[requiredRule("API Key"), maxLengthRule("API Key", 255)]}
          >
            <Input.Password placeholder="API key đã cấu hình trên SePay" />
          </Form.Item>
          <Form.Item
            label="Ngân hàng"
            name="bank"
            rules={[requiredRule("Ngân hàng"), maxLengthRule("Ngân hàng", 120)]}
          >
            <Input placeholder="VD: BIDV" allowClear />
          </Form.Item>
          <Form.Item
            label="Số tài khoản"
            name="accountNumber"
            rules={[
              requiredRule("Số tài khoản"),
              maxLengthRule("Số tài khoản", 64),
            ]}
          >
            <Input placeholder="4510xxxxxx" allowClear />
          </Form.Item>
          <Form.Item
            label="Số tài khoản phụ (VA)"
            name="vaNumber"
            rules={[
              requiredRule("Số tài khoản phụ"),
              maxLengthRule("Số tài khoản phụ", 64),
            ]}
          >
            <Input placeholder="Mã VA trên SePay" allowClear />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Chi tiết phương thức thanh toán"
        open={isDetailModalOpen}
        onCancel={handleCloseDetailModal}
        footer={
          <Button type="primary" onClick={handleCloseDetailModal}>
            Đóng
          </Button>
        }
        width={600}
        destroyOnClose
      >
        {detailLoading ? (
          <div className="flex justify-center py-6">
            <Spin />
          </div>
        ) : detailData ? (
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label="ID">
              {detailData?.id || "--"}
            </Descriptions.Item>
            <Descriptions.Item label="Chủ tài khoản">
              {detailData?.name || "--"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngân hàng">
              {detailData?.bank || "--"}
            </Descriptions.Item>
            <Descriptions.Item label="Số tài khoản">
              {detailData?.accountNumber || "--"}
            </Descriptions.Item>
            <Descriptions.Item label="Số tài khoản phụ (VA)">
              {detailData?.vaNumber || "--"}
            </Descriptions.Item>
            <Descriptions.Item label="API Key">
              {maskApiKey(detailData?.apiKey)}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {detailData?.isActive ? (
                <Tag color="green">Đang kích hoạt</Tag>
              ) : (
                <Tag color="default">Tạm tắt</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {formatDateTime(detailData?.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày cập nhật">
              {formatDateTime(detailData?.updatedAt)}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty description="Không có dữ liệu" />
        )}
      </Modal>
    </div>
  );
};

export default ManagementMerchant;
