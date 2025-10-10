import { Search, Trash2, Eye, Plus } from "lucide-react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Pagination,
  Table,
  Tag,
  Image,
  Tooltip,
} from "antd";
import { useState } from "react";
import { useGetAllCourse } from "../../../hook/admin/course/useGetAllCourse";
import { SchoolOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const ManagementCourse = () => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [form] = Form.useForm();
  const [searchValue, setSearchValue] = useState(undefined);
  const [searchMinPrice, setSearchMinPrice] = useState(undefined);
  const [searchMaxPrice, setSearchMaxPrice] = useState(undefined);
  const navigate = useNavigate();

  const { isLoadingGetAllCourse, ResponseGetAllCourse } = useGetAllCourse(
    page,
    size,
    searchMinPrice,
    searchMaxPrice
  );

  const dataResponse = ResponseGetAllCourse?.data?.content;

  const handleSearch = (value) => {
    setSearchValue(value.search);
    setSearchMinPrice(value.minPrice);
    setSearchMaxPrice(value.maxPrice);
    setPage(0);
  };

  const resetForm = () => {
    form.resetFields();
    setSearchValue(undefined);
    setSearchMinPrice(undefined);
    setSearchMaxPrice(undefined);
  };

  const handleCreateCourse = () => {
    navigate("/admin/create-course");
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => (
        <div className="font-bold">#{page * size + index + 1}</div>
      ),
      width: "5%",
    },
    {
      title: "Tên khóa học",
      key: "name",
      dataIndex: "name",
      width: "20%",
    },
    {
      title: "Mô tả",
      key: "description",
      dataIndex: "description",
      width: "30%",
      render: (description) => (
        <div className="line-clamp-2">{description}</div>
      ),
    },
    {
      title: "Giá",
      key: "price",
      dataIndex: "price",
      render: (price) =>
        price ? price.toLocaleString("vi-VN") + " VNĐ" : "N/A",
      width: "10%",
    },
    {
      title: "Giảm giá",
      key: "discount",
      dataIndex: "discount",
      render: (discount) => (discount ? discount + "%" : "0%"),
      width: "10%",
    },
    {
      title: "Trạng thái",
      key: "isAvailable",
      dataIndex: "isAvailable",
      render: (isAvailable) => (
        <Tag color={isAvailable ? "green" : "red"}>
          {isAvailable ? "Sẵn sàng" : "Không hoạt động"}
        </Tag>
      ),
      width: "10%",
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      render: (record) => (
        <div className="flex justify-center">
          <Button
            onClick={() => navigate(`/admin/view-detail-course/${record.id}`)}
            className="!h-10 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
          >
            <Eye size={18} className="font-semibold" />
          </Button>
        </div>
      ),
      width: "15%",
    },
  ];

  return (
    <div className="relative h-full">
      <div className="flex gap-2 items-center">
        <div className="border-2 p-2 border-gray-300">
          <SchoolOutlined className="text-gray-400" />
        </div>
        <section>
          <h1 className="text-[18px] font-bold">QUẢN LÝ KHÓA HỌC</h1>
          <p className="text-[14px]">Danh sách khóa học hệ thống</p>
        </section>
      </div>

      <div className="flex gap-3 py-3 justify-between">
        <Form form={form} className="flex gap-3" onFinish={handleSearch}>
          <Form.Item name="search">
            <Input className="h-12!" placeholder="Tìm tên khóa học" />
          </Form.Item>
          <Form.Item name="minPrice">
            <Input className="h-12!" placeholder="Tìm với giá trị nhỏ nhất" />
          </Form.Item>
          <Form.Item name="maxPrice">
            <Input className="h-12!" placeholder="Tìm với giá trị lớn nhất" />
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

        <Button
          className=" bg-[#fa7833]! text-[white]! h-12! font-bold!"
          onClick={handleCreateCourse}
        >
          <Plus size={16} />
          Tạo khóa học
        </Button>
      </div>

      <div>
        <Table
          columns={columns}
          dataSource={dataResponse}
          loading={isLoadingGetAllCourse}
          pagination={false}
          rowKey="id"
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
          total={ResponseGetAllCourse?.data?.totalElements}
          showSizeChanger
        />
      </div>
    </div>
  );
};

export default ManagementCourse;
