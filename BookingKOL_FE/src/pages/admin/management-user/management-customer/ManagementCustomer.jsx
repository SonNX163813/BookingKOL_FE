import {
  Search,
  Trash2,
  Eye,
  Loader2,
  Check,
  X,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { Button, Form, Input, Pagination, Table, Popconfirm } from "antd";
import { useMemo, useState } from "react";
import { useGetAllBrands } from "../../../../hook/admin/management-user/useGetAllBrands";
import { AccountCircleOutlined } from "@mui/icons-material";
import { usePatchAdminUpdateStatusAccount } from "../../../../hook/admin/management-user/usePatchAdminUpdateStatusAccount";
import { useNavigate } from "react-router-dom";

const STATUS_VI = {
  ACTIVE: "Đang hoạt động",
  SUSPENDED: "Tạm khóa",
  INACTIVE: "Chưa kích hoạt",
  PENDING: "Chờ duyệt",
};

const MAX_SEARCH_LEN = 100;

const ManagementCustomer = () => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [form] = Form.useForm();
  const [searchValue, setSearchValue] = useState(undefined);
  const navigate = useNavigate();

  // ✅ theo dõi độ dài input để hiện cảnh báo dưới ô
  const searchText = Form.useWatch("search", form);
  const reachedMax = useMemo(
    () => (searchText?.length ?? 0) >= MAX_SEARCH_LEN,
    [searchText]
  );

  const { isLoadingGetAllBrands, ResponseGetAllBrands, refetchGetAllBrands } =
    useGetAllBrands(page, size, searchValue);

  const {
    isLoadingAdminUpdateStatusAccount,
    handleUpdateStatusAccount,
    userIdUpdate,
    setUserIdUpdate,
  } = usePatchAdminUpdateStatusAccount(refetchGetAllBrands);

  const dataResponse = ResponseGetAllBrands?.data?.content;

  const handleSearch = (value) => {
    setSearchValue(value.search);
    setPage(0);
  };

  const resetForm = () => {
    form.resetFields();
    setSearchValue(undefined);
    setPage(0);
  };

  const handleActivate = (row) => {
    setUserIdUpdate(row.userId);
    return handleUpdateStatusAccount({
      id: row.userId,
      status: "ACTIVE",
    });
  };

  const handleSuspend = (row) => {
    setUserIdUpdate(row.userId);
    return handleUpdateStatusAccount({
      id: row.userId,
      status: "SUSPENDED",
    });
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => (
        <div className="font-bold">#{page * size + index + 1}</div>
      ),
      width: "6%",
    },
    {
      title: "Email",
      key: "email",
      dataIndex: "email",
      width: "28%",
    },
    {
      title: "Họ tên",
      key: "fullName",
      dataIndex: "fullName",
      render: (fullName) => fullName || "Chưa cập nhật",
      width: "28%",
    },
    {
      title: "Trạng thái",
      key: "status",
      dataIndex: "status",
      render: (st) => STATUS_VI[st] ?? st,
      width: "18%",
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      width: "26%",
      render: (record) => {
        const loadingThisRow =
          isLoadingAdminUpdateStatusAccount && userIdUpdate === record.userId;

        const isActive = record.status === "ACTIVE";
        const canActivate =
          record.status === "PENDING" || record.status === "SUSPENDED";

        return (
          <div className="w-full flex justify-center gap-3">
            <Button
              onClick={() =>
                navigate(`/admin/management-customer/${record.userId}`)
              }
              className="!h-10 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
            >
              <Eye size={18} className="font-semibold" />
            </Button>

            <Button
              onClick={() =>
                navigate(`/admin/management-customer/${record.userId}/bookings`)
              }
              className="!h-10 !bg-amber-600 !text-white !border-none hover:!bg-amber-700 transition-all"
            >
              <span className="relative inline-block">
                <CalendarDays size={18} className="align-middle" />
                <CheckCircle2
                  size={12}
                  strokeWidth={2}
                  className="absolute -right-1 -bottom-1 rounded-full bg-amber-600"
                />
              </span>
            </Button>

            {isActive && (
              <Popconfirm
                title="Bạn có muốn tạm khóa tài khoản này không?"
                okText="Đồng ý"
                cancelText="Hủy"
                onConfirm={() => handleSuspend(record)}
                okButtonProps={{ danger: true, loading: loadingThisRow }}
              >
                <Button className="!h-10 !bg-red-600 !text-white !border-none hover:!bg-red-700 transition-all flex items-center justify-center">
                  {loadingThisRow ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <X size={18} className="font-semibold" />
                  )}
                </Button>
              </Popconfirm>
            )}

            {canActivate && (
              <Popconfirm
                title="Bạn có muốn kích hoạt tài khoản này không?"
                okText="Đồng ý"
                cancelText="Hủy"
                onConfirm={() => handleActivate(record)}
                okButtonProps={{ loading: loadingThisRow }}
              >
                <Button className="!h-10 !bg-green-600 !text-white !border-none hover:!bg-green-700 transition-all flex items-center justify-center">
                  {loadingThisRow ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check size={18} className="font-semibold" />
                  )}
                </Button>
              </Popconfirm>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="relative h-full">
      <div className="flex gap-2 items-center">
        <div className="border-2 p-2 border-gray-300">
          <AccountCircleOutlined className="text-gray-400" />
        </div>
        <section>
          <h1 className="text-[18px] font-bold">QUẢN LÝ KHÁCH HÀNG</h1>
          <p className="text-[14px]">Danh sách khách hàng hệ thống</p>
        </section>
      </div>

      <div className="flex gap-3 py-3">
        <Form form={form} className="flex gap-3" onFinish={handleSearch}>
          <Form.Item
            name="search"
            // ✅ hiện thông báo dưới ô khi đạt max
            help={reachedMax ? `Tối đa ${MAX_SEARCH_LEN} ký tự.` : null}
            validateStatus={reachedMax ? "warning" : ""}
          >
            <Input
              className="!h-12"
              placeholder="Tìm email hoặc tên khách hàng"
              maxLength={MAX_SEARCH_LEN} // ✅ chặn nhập quá 100 ký tự
            />
          </Form.Item>

          <Form.Item>
            <Button
              htmlType="submit"
              className="!h-12 !bg-[#fa7833] !text-white !font-bold"
            >
              <Search size={16} /> Tìm kiếm
            </Button>
          </Form.Item>

          <Form.Item>
            <Button
              onClick={resetForm}
              className="!h-12 !bg-[#fa7833] !text-white !font-bold"
            >
              <Trash2 size={16} /> Xóa tìm kiếm
            </Button>
          </Form.Item>
        </Form>
      </div>

      <Table
        columns={columns}
        dataSource={dataResponse}
        loading={isLoadingGetAllBrands}
        pagination={false}
        rowKey="userId"
      />

      <div className="!my-4 py-5">
        <Pagination
          align="center"
          current={page + 1}
          pageSize={size}
          pageSizeOptions={["5", "10", "20", "50", "100"]}
          onChange={(pageNumber, sizeNumber) => {
            setPage(pageNumber - 1);
            setSize(sizeNumber);
          }}
          total={ResponseGetAllBrands?.data?.totalElements}
          showSizeChanger
        />
      </div>
    </div>
  );
};

export default ManagementCustomer;
