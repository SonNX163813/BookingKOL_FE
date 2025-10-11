import { Search, Trash2, Eye } from "lucide-react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Pagination,
  Table,
  Tag,
  Rate,
  Tooltip,
  Image,
  Select,
} from "antd";
import { useState } from "react";
import { useGetAllKol } from "../../../../hook/admin/management-user/useGetAllKol";
import imgdef from "../../../../assets/default.png";
import { VerifiedUserOutlined } from "@mui/icons-material";
const ManagementKOL = () => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [openViewDetail, setOpenViewDetail] = useState(false);
  const [selectedKOL, setSelectedKOL] = useState(null);
  const [form] = Form.useForm();
  const [searchValue, setSearchValue] = useState(undefined);
  const [searchMinBookingPrice, setSearchMinBookingPrice] = useState(undefined);
  const [minRating, setMinRating] = useState(null);

  const { isLoadingGetALlKol, ResponseGetAllKol } = useGetAllKol(
    page,
    size,
    searchMinBookingPrice,
    minRating
  );

  const dataResponse = ResponseGetAllKol?.data?.content;

  const handleViewDetail = (record) => {
    setSelectedKOL(record);
    setOpenViewDetail(true);
  };

  const handleSearch = (value) => {
    setSearchValue(value.search);
    setSearchMinBookingPrice(value.minBookingPrice);
    setPage(0);
  };

  const resetForm = () => {
    form.resetFields();
    setSearchValue(undefined);
    setSearchMinBookingPrice(undefined);
    setMinRating(undefined);
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => (
        <div className="font-bold">#{page * size + index + 1}</div>
      ),
    },
    {
      title: "Ảnh",
      key: "fileUrl",
      dataIndex: "fileUsageDtos",
      render: (fileUsageDtos) => {
        const imgUrl = fileUsageDtos?.[0]?.file?.fileUrl;
        return imgUrl ? (
          <Tooltip title="Xem ảnh">
            <Image
              src={imgUrl}
              alt="Ảnh"
              width={70}
              height={70}
              className="rounded-xl object-cover shadow-sm hover:shadow-md transition-all duration-200"
              preview={{ mask: "Phóng to" }}
            />
          </Tooltip>
        ) : (
          <div>
            <img
              src={imgdef}
              alt="Ảnh mặc định"
              className="w-[70px] h-[70px] rounded-xl"
            />
          </div>
        );
      },
    },
    {
      title: "Tên KOL",
      key: "displayName",
      dataIndex: "displayName",
    },
    {
      title: "Quốc gia",
      key: "country",
      dataIndex: "country",
    },
    {
      title: "Chuyên mục",
      key: "categories",
      dataIndex: "categories",
      render: (categories) => (
        <>
          {categories.map((cat) => (
            <Tag color="blue" key={cat.id}>
              <div className="!h-10 !flex !items-center">{cat.name}</div>
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: "Giá booking tối thiểu",
      key: "minBookingPrice",
      dataIndex: "minBookingPrice",
      render: (price) =>
        price ? price.toLocaleString("vi-VN") + " VNĐ" : "N/A",
    },
    {
      title: "Đánh giá",
      key: "overallRating",
      dataIndex: "overallRating",
      render: (rating, record) => (
        <span>
          <Rate disabled value={rating} /> ({record.feedbackCount})
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      render: (record) => (
        <div className="w-full flex justify-center">
          <Button
            onClick={() => handleViewDetail(record)}
            className="!h-10 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
          >
            <Eye size={18} className="font-semibold" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="relative h-full">
      <div className="flex gap-2 items-center">
        <div className="border-2 p-2 border-gray-300">
          <VerifiedUserOutlined className="text-gray-400" />
        </div>
        <section>
          <h1 className="text-[18px] font-bold">QUẢN LÝ KOL</h1>
          <p className="text-[14px]">Danh sách KOL hệ thống</p>
        </section>
      </div>

      <div className="flex gap-3 py-3">
        <Form form={form} className="flex gap-3" onFinish={handleSearch}>
          <Form.Item name="search">
            <Input className="h-12!" placeholder="Tìm tên KOL" />
          </Form.Item>
          <Form.Item name="minBookingPrice">
            <Input
              className="h-12!"
              placeholder="Tìm với giá Booking nhỏ nhất"
            />
          </Form.Item>
          <Select
            placeholder="Đánh giá tối thiểu"
            value={minRating}
            onChange={(value) => setMinRating(value)}
            className="w-48 !h-12"
            allowClear={false}
            options={[
              { label: "Tất cả", value: null },
              { label: "1 sao trở lên", value: 1 },
              { label: "2 sao trở lên", value: 2 },
              { label: "3 sao trở lên", value: 3 },
              { label: "4 sao trở lên", value: 4 },
              { label: "5 sao", value: 5 },
            ]}
          />
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
          loading={isLoadingGetALlKol}
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
          // total={filteredData.length}
          showSizeChanger
        />
      </div>

      <Modal
        open={openViewDetail}
        onCancel={() => setOpenViewDetail(false)}
        footer={null}
        width={700}
        closable={false}
      >
        {selectedKOL && (
          <Card className="shadow-lg rounded-2xl border border-gray-200 p-6 space-y-6">
            <div className="flex gap-6 items-center pb-4">
              {selectedKOL.fileUsageDtos?.[0]?.file?.fileUrl && (
                <img
                  src={selectedKOL.fileUsageDtos[0].file.fileUrl}
                  alt={selectedKOL.displayName}
                  style={{
                    width: 120,
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 12,
                  }}
                />
              )}
              <div>
                <p className="text-gray-600 font-medium">Tên KOL:</p>
                <p className="text-gray-900 font-semibold">
                  {selectedKOL.displayName}
                </p>
                <p className="text-gray-600 font-medium">
                  Quốc gia:{" "}
                  <span className="text-gray-900">{selectedKOL.country}</span>
                </p>
                <p className="text-gray-600 font-medium">
                  Ngôn ngữ:{" "}
                  <span className="text-gray-900">{selectedKOL.languages}</span>
                </p>
                <p className="text-gray-600 font-medium">Chuyên mục:</p>
                <div>
                  {selectedKOL.categories.map((cat) => (
                    <Tag color="blue" key={cat.id}>
                      {cat.name}
                    </Tag>
                  ))}
                </div>
                {/* <p className="text-gray-600 font-medium">Giá booking tối thiểu: <span className="text-gray-900">{selectedKOL.minBookingPrice.toLocaleString("vi-VN")} đ</span></p> */}
                <p className="text-gray-600 font-medium">
                  Đánh giá: <Rate disabled value={selectedKOL.overallRating} />{" "}
                  ({selectedKOL.feedbackCount})
                </p>
                <p className="text-gray-600 font-medium">
                  Trạng thái:{" "}
                  <span className="text-gray-900">
                    {selectedKOL.isAvailable ? "Sẵn sàng" : "Không hoạt động"}
                  </span>
                </p>
              </div>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Kinh nghiệm:</p>
              <p className="text-gray-900 whitespace-pre-line">
                {selectedKOL.experience}
              </p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Ghi chú rate card:</p>
              <p className="text-gray-900">{selectedKOL.rateCardNote}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">ID:</p>
              <p className="text-gray-900">{selectedKOL.id}</p>
            </div>
          </Card>
        )}
      </Modal>
    </div>
  );
};

export default ManagementKOL;
