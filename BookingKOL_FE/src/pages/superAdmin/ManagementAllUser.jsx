import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Avatar,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { PersonOutlined } from "@mui/icons-material";
import {
  Plus,
  RefreshCcw,
  RotateCcw,
  Search as SearchIcon,
} from "lucide-react";
import { useGetSuperAdminAccounts } from "../../hook/superadmin/useGetSuperAdminAccounts";
import { createSuperAdminAdminAccount } from "../../services/superadmin/SuperAdminAccountAPI";
import {
  emailRule,
  maxLengthRule,
  passwordRule,
  phoneRule,
  requiredRule,
} from "../../utils/formValidators";

const { TextArea } = Input;

const { Title, Text } = Typography;

const STATUS_META = {
  ACTIVE: { label: "Hoạt động", color: "green" },
  PENDING: { label: "Chờ duyệt", color: "orange" },
  SUSPENDED: { label: "Tạm khóa", color: "red" },
  INACTIVE: { label: "Không hoạt động", color: "default" },
};

const ROLE_META = {
  SUPER_ADMIN: { label: "Super Admin", color: "magenta" },
  ADMIN: { label: "Admin", color: "purple" },
  KOL: { label: "Host chính", color: "geekblue" },
  USER: { label: "Người dùng", color: "blue" },
  BRAND: { label: "Nhãn hàng", color: "gold" },
};

const DEFAULT_FILTERS = {
  search: undefined,
  status: undefined,
  role: undefined,
};

const GENDER_OPTIONS = [
  { label: "Nam", value: "Male" },
  { label: "Nữ", value: "Female" },
  { label: "Khác", value: "Other" },
];

const formatDateTime = (value) => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY HH:mm") : "--";
};

const getInitials = (fullName, email) => {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(
      0
    )}`.toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return "?";
};

const ManagementAllUser = () => {
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS }));
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const {
    data: response,
    isPending,
    isFetching,
    refetch,
  } = useGetSuperAdminAccounts({
    page,
    size,
    status: filters.status,
    role: filters.role,
    search: filters.search,
  });

  useEffect(() => {
    form.setFieldsValue({
      search: filters.search,
      status: filters.status,
      role: filters.role,
    });
  }, [filters, form]);

  const payload = response?.data ?? {};
  const rows = Array.isArray(payload.content) ? payload.content : [];
  const totalElements = Number(payload.totalElements) || 0;

  const handleSubmit = (values) => {
    setFilters({
      search: values.search?.trim() || undefined,
      status: values.status || undefined,
      role: values.role || undefined,
    });
    setPage(0);
  };

  const handleReset = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setPage(0);
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    createForm.resetFields();
  };

  const handleCreateAdmin = async () => {
    try {
      const values = await createForm.validateFields();
      setIsCreatingAdmin(true);
      await createSuperAdminAdminAccount(values);
      message.success("Tạo tài khoản admin thành công");
      handleCloseCreateModal();
      refetch();
    } catch (error) {
      if (error?.errorFields) {
        return;
      }
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handlePageChange = (pageNumber, pageSize) => {
    setPage(pageNumber - 1);
    setSize(pageSize);
  };

  const tableLoading = isPending || isFetching;
  const showLoadingPlaceholder = isPending && !rows.length;
  const refreshing = isFetching && !isPending;

  const pageRange = useMemo(() => {
    if (!rows.length || !totalElements) return null;
    const start = page * size + 1;
    const end = Math.min(totalElements, page * size + rows.length);
    return { start, end };
  }, [page, size, rows.length, totalElements]);

  const columns = [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (_, __, index) => page * size + index + 1,
      fixed: "left",
    },
    {
      title: "Người dùng",
      dataIndex: "fullName",
      key: "user",
      width: 260,
      render: (_, record) => (
        <Space align="start" size={12}>
          <Avatar src={record?.avatarUrl} size={48}>
            {getInitials(record?.fullName, record?.email)}
          </Avatar>
          <div>
            <div className="font-semibold leading-5">
              {record?.fullName || "Chưa có tên"}
            </div>
            <div className="text-sm text-gray-500 break-all">
              {record?.email || "--"}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Điện thoại",
      dataIndex: "phone",
      width: 140,
      render: (value) => value || "--",
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      width: 120,
      render: (value) => {
        switch (value) {
          case "Male":
            return "Nam";
          case "Female":
            return "Nữ";
          case "Other":
            return "Khác";
          default:
            return "--";
        }
      },
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      width: 200,
      ellipsis: true,
      render: (value) => value || "--",
    },
    {
      title: "Vai trò",
      dataIndex: "roles",
      width: 150,
      render: (roles) => {
        if (!Array.isArray(roles) || !roles.length) {
          return <Tag>--</Tag>;
        }
        return (
          <Space wrap size={[4, 4]}>
            {roles.map((role) => {
              const meta = ROLE_META[role] ?? { label: role, color: "default" };
              return (
                <Tag key={role} color={meta.color} className="capitalize">
                  {meta.label}
                </Tag>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 150,
      render: (status) => {
        const meta = STATUS_META[status] ?? {
          label: status || "--",
          color: "default",
        };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    // {
    //   title: "Đăng nhập lần cuối",
    //   dataIndex: "lastLoginAt",
    //   width: 200,
    //   render: (value) => formatDateTime(value),
    // },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      width: 200,
      render: (value) => formatDateTime(value),
    },
    {
      title: "Ngày cập nhật",
      dataIndex: "updatedAt",
      width: 200,
      render: (value) => formatDateTime(value),
    },
  ];

  const statusOptions = useMemo(
    () =>
      Object.entries(STATUS_META).map(([value, meta]) => ({
        value,
        label: meta.label,
      })),
    []
  );

  const roleOptions = useMemo(
    () =>
      Object.entries(ROLE_META).map(([value, meta]) => ({
        value,
        label: meta.label,
      })),
    []
  );

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
            <PersonOutlined className="text-gray-400" />
          </div>
          <section>
            <Title level={3} className="!mb-0">
              Quản lý người dùng
            </Title>
            <Text type="secondary">
              Danh sách tất cả tài khoản trong hệ thống.
            </Text>
          </section>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={handleOpenCreateModal}
          >
            Tạo tài khoản admin
          </Button>
          <Button
            icon={<RefreshCcw size={16} />}
            onClick={() => refetch()}
            loading={refreshing}
          >
            Làm mới
          </Button>
        </div>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={DEFAULT_FILTERS}
        >
          <div className="grid gap-4 md:grid-cols-[2fr_repeat(2,_1fr)_auto_auto]">
            <Form.Item label="Tìm kiếm" name="search" className="mb-0">
              <Input
                allowClear
                placeholder="Email, họ tên..."
                maxLength={120}
              />
            </Form.Item>
            <Form.Item label="Trạng thái" name="status" className="mb-0">
              <Select
                allowClear
                placeholder="Tất cả trạng thái"
                options={statusOptions}
              />
            </Form.Item>
            <Form.Item label="Vai trò" name="role" className="mb-0">
              <Select
                allowClear
                placeholder="Tất cả vai trò"
                options={roleOptions}
              />
            </Form.Item>
            <Form.Item label=" " colon={false} className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchIcon size={16} />}
                className="w-full"
              >
                Lọc
              </Button>
            </Form.Item>
            <Form.Item label=" " colon={false} className="mb-0">
              <Button
                icon={<RotateCcw size={16} />}
                onClick={handleReset}
                className="w-full"
              >
                Đặt lại
              </Button>
            </Form.Item>
          </div>
        </Form>
      </Card>

      <Card>
        <Table
          rowKey={(record) => record?.id}
          columns={columns}
          dataSource={rows}
          loading={tableLoading}
          pagination={false}
          scroll={{ x: "auto" }}
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
              ? `Hiển thị ${pageRange.start}-${pageRange.end} trên tổng ${totalElements}`
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
        title="Tạo tài khoản admin"
        open={isCreateModalOpen}
        okText="Tạo"
        cancelText="Hủy"
        onCancel={handleCloseCreateModal}
        onOk={handleCreateAdmin}
        confirmLoading={isCreatingAdmin}
        destroyOnClose
        maskClosable={false}
      >
        <Form
          layout="vertical"
          form={createForm}
          initialValues={{ gender: GENDER_OPTIONS[0]?.value }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item
              label="Email"
              name="email"
              rules={[requiredRule("Email"), emailRule]}
            >
              <Input placeholder="admin@example.com" allowClear />
            </Form.Item>
            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[requiredRule("Số điện thoại"), phoneRule]}
            >
              <Input placeholder="0xxx xxx xxx" allowClear />
            </Form.Item>
            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[requiredRule("Mật khẩu"), passwordRule]}
            >
              <Input.Password placeholder="Tối thiểu 6 ký tự chữ và số" />
            </Form.Item>
            <Form.Item
              label="Họ và tên"
              name="fullName"
              rules={[
                requiredRule("Họ và tên"),
                maxLengthRule("Họ và tên", 120),
              ]}
            >
              <Input placeholder="Nguyễn Văn A" allowClear />
            </Form.Item>
            <Form.Item
              label="Giới tính"
              name="gender"
              rules={[requiredRule("Giới tính")]}
            >
              <Select options={GENDER_OPTIONS} placeholder="Chọn giới tính" />
            </Form.Item>
          </div>
          <Form.Item
            label="Địa chỉ"
            name="address"
            rules={[requiredRule("Địa chỉ"), maxLengthRule("Địa chỉ", 255)]}
          >
            <TextArea rows={3} placeholder="Ví dụ: Hà Nội" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManagementAllUser;
