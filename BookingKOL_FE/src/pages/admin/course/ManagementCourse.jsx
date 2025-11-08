// src/pages/admin/course/ManagementCourse.jsx
import { Search, Trash2, Eye, Plus, Pencil } from "lucide-react";
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
  Typography,
  Divider,
  Select, // <== THÊM
  message,
} from "antd";
import { useMemo, useState } from "react";
import { useGetAllCourse } from "../../../hook/admin/course/useGetAllCourse";
import { SchoolOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { adminCourseDelete } from "../../../services/admin/AdminAPI";

const { Title, Text } = Typography;

// helpers
const formatVND = (n) =>
  typeof n === "number" && Number.isFinite(n)
    ? n.toLocaleString("vi-VN") + " VNĐ"
    : "—";
const calcFinal = (price, discount) => {
  const p = Number(price);
  const d = Number(discount);
  if (!Number.isFinite(p)) return null;
  const rate = Number.isFinite(d) ? Math.min(Math.max(d, 0), 100) : 0;
  return Math.round(p * (1 - rate / 100));
};

const ManagementCourse = () => {
  const [modal, contextHolder] = Modal.useModal();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [form] = Form.useForm();

  const [searchValue, setSearchValue] = useState(undefined);
  const [searchMinPrice, setSearchMinPrice] = useState(undefined);
  const [searchMaxPrice, setSearchMaxPrice] = useState(undefined);
  const [searchIsAvailable, setSearchIsAvailable] = useState(undefined); // <== THÊM

  const navigate = useNavigate();

  const { isLoadingGetAllCourse, ResponseGetAllCourse, refetchGetAllCourse } =
    useGetAllCourse(
      page,
      size,
      searchMinPrice,
      searchMaxPrice,
      searchIsAvailable,
      searchValue
    );

  const dataResponse = ResponseGetAllCourse?.data?.content || [];

  // ===== Modal state =====
  const [openView, setOpenView] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [deletingCourseId, setDeletingCourseId] = useState(null);

  const handleSearch = (value) => {
    setSearchValue(value.search);
    setSearchMinPrice(value.minPrice);
    setSearchMaxPrice(value.maxPrice);

    // Chuyển giá trị từ Select sang đúng kiểu boolean hoặc undefined
    let mapped;
    if (value.status === "true") mapped = true;
    else if (value.status === "false") mapped = false;
    else mapped = undefined;

    setSearchIsAvailable(mapped);
    setPage(0);
  };

  const resetForm = () => {
    form.resetFields();
    setSearchValue(undefined);
    setSearchMinPrice(undefined);
    setSearchMaxPrice(undefined);
    setSearchIsAvailable(undefined); // về mặc định lấy tất cả
    setPage(0);
  };

  const handleCreateCourse = () => {
    navigate("/admin/create-course");
  };

  const handleOpenView = (record) => {
    setSelectedCourse(record);
    setOpenView(true);
  };

  const handleCloseView = () => {
    setOpenView(false);
    setSelectedCourse(null);
  };

  const handleEdit = (record) => {
    navigate(`/admin/edit-detail-course/${record.id}`);
  };

  const handleDeleteCourse = (record) => {
    if (!record?.id) {
      message.warning("Không tìm thấy mã khoá học để xoá.");
      return;
    }

    modal.confirm({
      title: "Xoá khoá học",
      centered: true,
      okText: "Xoá",
      okButtonProps: { danger: true },
      cancelText: "Huỷ",
      content: `Bạn chắc chắn muốn xoá khoá học "${record?.name || ""}"?`,
      onOk: async () => {
        try {
          setDeletingCourseId(record.id);
          await adminCourseDelete(record.id);
          message.success("Xoá khoá học thành công");
          if (typeof refetchGetAllCourse === "function") {
            await refetchGetAllCourse();
          }
        } catch (error) {
          const errMsg =
            error?.response?.data?.message ||
            error?.message ||
            "Không thể xoá khoá học. Vui lòng thử lại.";
          message.error(errMsg);
        } finally {
          setDeletingCourseId(null);
        }
      },
    });
  };

  // ====== derive media ======
  const images = useMemo(() => {
    const list = Array.isArray(selectedCourse?.fileUsageDtos)
      ? selectedCourse.fileUsageDtos
      : [];
    return list
      .filter(
        (u) =>
          u?.isActive !== false &&
          u?.file?.fileType?.toUpperCase() === "IMAGE" &&
          u?.file?.status !== "DELETED" &&
          !!u?.file?.fileUrl
      )
      .map((u) => ({
        usageId: u.id,
        fileId: u?.file?.id || null,
        isCover: !!u?.isCover,
        file: {
          fileName: u?.file?.fileName,
          fileUrl: u?.file?.fileUrl,
        },
      }));
  }, [selectedCourse]);

  const videos = useMemo(() => {
    const list = Array.isArray(selectedCourse?.fileUsageDtos)
      ? selectedCourse.fileUsageDtos
      : [];
    return list
      .filter(
        (u) =>
          u?.isActive !== false &&
          u?.file?.fileType?.toUpperCase() === "VIDEO" &&
          u?.file?.status !== "DELETED" &&
          !!u?.file?.fileUrl
      )
      .map((u) => ({
        usageId: u.id,
        fileId: u?.file?.id || null,
        file: {
          fileName: u?.file?.fileName,
          fileUrl: u?.file?.fileUrl,
        },
      }));
  }, [selectedCourse]);

  const currentCoverFileId = useMemo(() => {
    const u = (selectedCourse?.fileUsageDtos || []).find(
      (x) => x?.isCover && x?.file?.id
    );
    return u?.file?.id || null;
  }, [selectedCourse]);

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
      title: "Tên khóa học",
      key: "name",
      dataIndex: "name",
      width: "20%",
    },
    {
      title: "Mô tả",
      key: "description",
      dataIndex: "description",
      width: "26%",
      render: (description) => (
        <div className="line-clamp-2">{description}</div>
      ),
    },
    {
      title: "Giá",
      key: "price",
      dataIndex: "price",
      render: (price) => (typeof price === "number" ? formatVND(price) : "N/A"),
      width: "10%",
    },
    {
      title: "Giảm giá",
      key: "discount",
      dataIndex: "discount",
      render: (discount) =>
        typeof discount === "number" ? `${discount}%` : "0%",
      width: "8%",
    },
    {
      title: "Sau giảm",
      key: "finalPrice",
      render: (_, record) => {
        const fp = calcFinal(record?.price, record?.discount);
        return fp != null ? formatVND(fp) : "—";
      },
      width: "12%",
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
      width: "8%",
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      render: (record) => (
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => handleOpenView(record)}
            className="!h-10 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
            title="Xem nhanh"
          >
            <Eye size={18} className="font-semibold" />
          </Button>
          <Button
            onClick={() => handleEdit(record)}
            className="!h-10 !bg-emerald-600 !text-white !border-none hover:!bg-emerald-700 transition-all"
            title="Chỉnh sửa"
          >
            <Pencil size={18} className="font-semibold" />
          </Button>
          <Button
            onClick={() => handleDeleteCourse(record)}
            loading={deletingCourseId === record.id}
            className="!h-10 !bg-red-600 !text-white !border-none hover:!bg-red-700 transition-all"
            title="Xoá khóa học"
          >
            <Trash2 size={18} className="font-semibold" />
          </Button>
        </div>
      ),
      width: "10%",
    },
  ];

  return (
    <div className="relative h-full">
      {contextHolder}
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
        <Form
          form={form}
          className="flex gap-3"
          onFinish={handleSearch}
          initialValues={{ status: "all" }} // <== MẶC ĐỊNH: Tất cả
        >
          <Form.Item name="search">
            <Input className="h-12!" placeholder="Tìm tên khóa học" />
          </Form.Item>

          <Form.Item name="minPrice">
            <Input className="h-12!" placeholder="Tìm với giá trị nhỏ nhất" />
          </Form.Item>

          <Form.Item name="maxPrice">
            <Input className="h-12!" placeholder="Tìm với giá trị lớn nhất" />
          </Form.Item>

          {/* ====== Bộ lọc Trạng thái ====== */}
          <Form.Item name="status">
            <Select
              className="min-w-[160px]"
              options={[
                { label: "Tất cả trạng thái", value: "all" },
                { label: "Có sẵn", value: "true" },
                { label: "Không hoạt động", value: "false" },
              ]}
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

      {/* ====== Modal xem nhanh chi tiết khóa học ====== */}
      <Modal
        title={
          <div className="flex items-center justify-between">
            <span>Chi tiết khóa học</span>
            {selectedCourse && (
              <Tag color={selectedCourse.isAvailable ? "green" : "default"}>
                {selectedCourse.isAvailable ? "Có sẵn" : "Không hoạt động"}
              </Tag>
            )}
          </div>
        }
        open={openView}
        onCancel={handleCloseView}
        footer={null}
        width={1000}
        destroyOnClose
        bodyStyle={{ padding: 0 }}
      >
        <div className="px-5 py-4 space-y-8">
          {/* Thông tin cơ bản */}
          <Card className="shadow-sm rounded-2xl" bodyStyle={{ padding: 24 }}>
            <Title level={4} className="!mb-4">
              Thông tin cơ bản
            </Title>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Text type="secondary">Tên khóa học</Text>
                <div className="font-semibold">
                  {selectedCourse?.name || "—"}
                </div>
              </div>
              <div>
                <Text type="secondary">Giá</Text>
                <div className="font-semibold">
                  {formatVND(selectedCourse?.price)}
                </div>
              </div>
              <div>
                <Text type="secondary">Giảm giá</Text>
                <div className="font-semibold">
                  {typeof selectedCourse?.discount === "number"
                    ? `${selectedCourse.discount}%`
                    : "0%"}
                </div>
              </div>
              <div>
                <Text type="secondary">Sau giảm</Text>
                <div className="font-semibold">
                  {formatVND(
                    calcFinal(selectedCourse?.price, selectedCourse?.discount)
                  )}
                </div>
              </div>
              <div>
                <Text type="secondary">ID</Text>
                <div className="font-semibold">{selectedCourse?.id || "—"}</div>
              </div>
            </div>
          </Card>

          {/* Mô tả */}
          <Card className="shadow-sm rounded-2xl" bodyStyle={{ padding: 24 }}>
            <Title level={4} className="!mb-4">
              Mô tả khóa học
            </Title>
            <div
              className="text-[15px]"
              style={{ whiteSpace: "pre-line", color: "#444" }}
            >
              {selectedCourse?.description || "—"}
            </div>
          </Card>

          {/* Media (Ảnh & Video) */}
          <Card className="shadow-sm rounded-2xl" bodyStyle={{ padding: 24 }}>
            <Title level={4} className="!mb-4">
              Media
            </Title>

            {/* Ảnh */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <Text strong>Ảnh</Text>
                <Tag color={images.length ? "green" : "default"}>
                  {images.length ? `${images.length} tệp` : "Trống"}
                </Tag>
              </div>

              <Image.PreviewGroup>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {images.map((img) => {
                    const isCover =
                      img.fileId === currentCoverFileId || img.isCover;
                    return (
                      <div
                        key={img.usageId}
                        className="relative border border-gray-200 rounded-lg overflow-hidden bg-white"
                        style={{ height: 140 }}
                      >
                        <Image
                          src={img.file.fileUrl}
                          alt={img.file.fileName}
                          preview={{ mask: "Xem ảnh" }}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        {isCover && (
                          <Tag
                            className="!absolute !top-1 !left-1 !rounded-full !px-2 !py-0"
                            color="blue"
                          >
                            Ảnh bìa
                          </Tag>
                        )}
                      </div>
                    );
                  })}
                  {!images.length && (
                    <div className="col-span-full text-center text-gray-500 py-4">
                      Chưa có ảnh
                    </div>
                  )}
                </div>
              </Image.PreviewGroup>
            </div>

            <Divider style={{ margin: "12px 0" }} />

            {/* Video */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Text strong>Video</Text>
                <Tag color={videos.length ? "purple" : "default"}>
                  {videos.length ? `${videos.length} tệp` : "Trống"}
                </Tag>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {videos.map((v) => (
                  <div
                    key={v.usageId}
                    className="relative border border-gray-200 rounded-lg overflow-hidden bg-black"
                    style={{ height: 160 }}
                  >
                    <video
                      src={v.file.fileUrl}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      controls
                    />
                  </div>
                ))}
                {!videos.length && (
                  <div className="col-span-full text-center text-gray-500 py-4">
                    Chưa có video
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </Modal>
    </div>
  );
};

export default ManagementCourse;
