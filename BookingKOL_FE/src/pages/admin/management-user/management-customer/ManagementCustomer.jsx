import { Search, Trash2, Eye, RefreshCcw, Loader2 } from "lucide-react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Pagination,
  Spin,
  Table,
} from "antd";
import { useState } from "react";
import { useGetAllBrands } from "../../../../hook/admin/management-user/useGetAllBrands";
import { AccountCircleOutlined } from "@mui/icons-material";
import { usePatchAdminUpdateStatusAccount } from "../../../../hook/admin/management-user/usePatchAdminUpdateStatusAccount";
import { useNavigate } from "react-router-dom";

const ManagementCustomer = () => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [form] = Form.useForm();
  const [searchValue, setSearchValue] = useState(undefined);
  const navigate = useNavigate();
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
  };

  const handleUpdateStatus = (value) => {
    setUserIdUpdate(value.userId);
    const payload = {
      id: value.userId,
      status: "ACTIVE",
    };

    handleUpdateStatusAccount(payload);
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
      width: "30%",
    },
    {
      title: "Họ tên",
      key: "fullName",
      dataIndex: "fullName",
      render: (fullName) => fullName || "Chưa cập nhật",
      width: "30%",
    },
    {
      title: "Trạng thái",
      key: "status",
      dataIndex: "status",
      width: "18%",
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      render: (record) => (
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
            onClick={() => handleUpdateStatus(record)}
            className="!h-10 !bg-green-600 !text-white !border-none hover:!bg-green-700 transition-all flex items-center justify-center"
          >
            {isLoadingAdminUpdateStatusAccount &&
            userIdUpdate === record.userId ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCcw size={18} className="font-semibold" />
            )}
          </Button>
        </div>
      ),
      width: "20%",
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
          <Form.Item name="search">
            <Input
              className="h-12!"
              placeholder="Tìm email hoặc tên khách hàng"
            />
          </Form.Item>
          <Form.Item>
            <Button
              htmlType="submit"
              className="h-12! bg-[#fa7833]! text-[white]! font-bold!"
            >
              <Search size={16} /> Tìm kiếm
            </Button>
          </Form.Item>
          <Form.Item>
            <Button
              onClick={resetForm}
              className="h-12! bg-[#fa7833]! text-[white]! font-bold!"
            >
              <Trash2 size={16} /> Xóa tìm kiếm
            </Button>
          </Form.Item>
        </Form>
      </div>

      <div>
        <Table
          columns={columns}
          dataSource={dataResponse}
          loading={isLoadingGetAllBrands}
          pagination={false}
          rowKey="userId"
        />
      </div>

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
