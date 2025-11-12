import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  Button,
  Card,
  Modal,
  Table,
  Tag,
  Typography,
  Upload,
  message,
  Image,
} from "antd";
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Eye, Pencil } from "lucide-react";
import {
  adminDeleteBlog,
  adminDeleteBlogThumbnail,
  adminFetchBlogList,
  adminUploadBlogThumbnail,
} from "../../../services/admin/AdminBlogAPI";

const { Title, Text } = Typography;

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const formatDateTime = (value) =>
  value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "--";

const resolveBlogId = (blog) => {
  if (!blog || typeof blog !== "object") {
    return null;
  }
  if (blog.id !== undefined && blog.id !== null && blog.id !== "") {
    return blog.id;
  }
  if (blog.blogId !== undefined && blog.blogId !== null && blog.blogId !== "") {
    return blog.blogId;
  }
  if (blog._id !== undefined && blog._id !== null && blog._id !== "") {
    return blog._id;
  }
  return null;
};

const ManagementBlog = () => {
  const navigate = useNavigate();
  const [modal, contextHolder] = Modal.useModal(); // ✅ thêm dòng này
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageMeta, setPageMeta] = useState({
    totalElements: 0,
    totalPages: 0,
  });
  const [deletingId, setDeletingId] = useState(null);
  const [thumbnailUploadingId, setThumbnailUploadingId] = useState(null);
  const [thumbnailRemovingId, setThumbnailRemovingId] = useState(null);

  const fetchBlogs = useCallback(async (targetPage, targetSize) => {
    setLoading(true);
    try {
      const data = await adminFetchBlogList({
        params: { page: targetPage, size: targetSize },
      });
      const content = Array.isArray(data?.content) ? data.content : [];
      setBlogs(content);
      setPageMeta({
        totalElements: Number(data?.totalElements) || content.length || 0,
        totalPages: Number(data?.totalPages) || 0,
      });
    } catch (error) {
      console.error("Failed to fetch blogs", error);
      setBlogs([]);
      setPageMeta({ totalElements: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs(page, size);
  }, [page, size, fetchBlogs]);

  const handleRefresh = () => fetchBlogs(page, size);

  const handleTableChange = (pagination) => {
    const nextPage = (pagination?.current ?? 1) - 1;
    const nextSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
    setPage(nextPage);
    setSize(nextSize);
  };

  const handleUploadThumbnail = async (blogId, file) => {
    if (!blogId) {
      message.warning("Khong tim thay blog id.");
      return;
    }
    if (!file) {
      message.warning("Vui long chon file anh.");
      return;
    }

    try {
      setThumbnailUploadingId(blogId);
      await adminUploadBlogThumbnail(blogId, file);
      message.success("Cap nhat thumbnail thanh cong.");
      fetchBlogs(page, size);
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Khong the cap nhat thumbnail. Vui long thu lai.";
      message.error(errorMsg);
    } finally {
      setThumbnailUploadingId(null);
    }
  };

  const handleRemoveThumbnail = async (blogId) => {
    if (!blogId) {
      message.warning("Khong tim thay blog id.");
      return;
    }

    try {
      setThumbnailRemovingId(blogId);
      await adminDeleteBlogThumbnail(blogId);
      message.success("Da xoa thumbnail cua blog.");
      fetchBlogs(page, size);
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Khong the xoa thumbnail. Vui long thu lai.";
      message.error(errorMsg);
    } finally {
      setThumbnailRemovingId(null);
    }
  };

  const handleConfirmRemoveThumbnail = (blogId) => {
    if (!blogId) {
      message.warning("Không tìm thấy mã blog để xóa thumbnail.");
      return;
    }

    modal.confirm({
      title: "Xoá thumbnail",
      icon: <ExclamationCircleOutlined />,
      centered: true,
      okText: "Xoá",
      okButtonProps: { danger: true },
      cancelText: "Huỷ",
      content: "Hành động này không thể hoàn tác.",
      onOk: () => handleRemoveThumbnail(blogId),
    });
  };

  const handleDeleteBlog = (blogId) => {
    console.log("Delete blog with ID:", blogId);
    if (!blogId) {
      message.warning("Không tìm thấy mã blog để xóa.");
      return;
    }

    modal.confirm({
      title: "Xóa blog",
      icon: <ExclamationCircleOutlined />,
      centered: true,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Huỷ",
      content: "Hành động này không thể hoàn tác.",
      onOk: async () => {
        try {
          setDeletingId(blogId);
          await adminDeleteBlog(blogId);
          message.success("Xóa blog thành công");
          fetchBlogs(page, size);
        } catch (error) {
          const errorMsg =
            error?.response?.data?.message ||
            error?.message ||
            "Không thể xóa blog. Vui lòng thử lại.";
          message.error(errorMsg);
        } finally {
          setDeletingId(null);
        }
      },
    });
  };
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      render: (id) => id || "Chưa cập nhật",
    },
    {
      title: "Thumbnail",
      dataIndex: "thumbnail",
      key: "thumbnail",
      width: 240,
      render: (_, record) => {
        const blogId = resolveBlogId(record);
        const isMissingBlogId =
          blogId === null || blogId === undefined || blogId === "";
        const isUploading = !isMissingBlogId && thumbnailUploadingId === blogId;
        const isRemoving = !isMissingBlogId && thumbnailRemovingId === blogId;
        const thumbnailUrl =
          typeof record?.thumbnail === "string" &&
          record.thumbnail.trim().length > 0
            ? record.thumbnail.trim()
            : null;

        return (
          <div className="flex flex-col items-center gap-2">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt="Thumbnail"
                preview={{ mask: "Xem ảnh" }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <Text type="secondary" className="text-xs">
                Chưa có thumbnail
              </Text>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <Upload
                accept="image/*"
                showUploadList={false}
                maxCount={1}
                disabled={isMissingBlogId || isUploading || isRemoving}
                beforeUpload={(file) => {
                  handleUploadThumbnail(blogId, file);
                  return false;
                }}
              >
                <Button
                  size="small"
                  type="primary"
                  disabled={isMissingBlogId || isUploading || isRemoving}
                  loading={isUploading}
                >
                  Cập nhật
                </Button>
              </Upload>
              <Button
                size="small"
                danger
                disabled={
                  isMissingBlogId || !thumbnailUrl || isRemoving || isUploading
                }
                loading={isRemoving}
                onClick={() => handleConfirmRemoveThumbnail(blogId)}
              >
                Xoá
              </Button>
            </div>
          </div>
        );
      },
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (value) => value || "Chưa cập nhật",
      width: 260,
    },
    {
      title: "Tác giả",
      dataIndex: "author",
      key: "author",
      width: 160,
      render: (value) => value || "--",
    },
    {
      title: "Trạng thái",
      dataIndex: "isPublish",
      key: "isPublish",
      width: 150,
      render: (value) =>
        value ? (
          <Tag color="green">Công khai</Tag>
        ) : (
          <Tag color="default">Ẩn</Tag>
        ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 200,
      render: (value) => formatDateTime(value),
    },

    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: (_, record) => {
        const blogId = resolveBlogId(record);
        const isMissingBlogId =
          blogId === null || blogId === undefined || blogId === "";
        const isDeleting = !isMissingBlogId && deletingId === blogId;
        return (
          <div className="flex justify-center gap-2">
            <Button
              onClick={() =>
                !isMissingBlogId &&
                navigate(`/admin/management-blogs/${blogId}`)
              }
              className="!h-10 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
              title="Xem chi tiết"
              disabled={isMissingBlogId}
            >
              <Eye size={18} className="font-semibold" />
            </Button>
            {/* <Button
            onClick={() => handleNavigateToEdit(blogId)}
            className="!h-10 !bg-emerald-600 !text-white !border-none hover:!bg-emerald-700 transition-all"
            title="Chỉnh sửa"
          >
            <Pencil size={18} className="font-semibold" />
          </Button> */}
            <Button
              className="!h-10 !bg-red-600 !text-white !border-none hover:!bg-red-700 transition-all"
              onClick={() => handleDeleteBlog(blogId)}
              loading={isDeleting}
              disabled={isMissingBlogId || isDeleting}
              title="Xóa blog"
            >
              <DeleteOutlined size={18} className="font-semibold" />
            </Button>
          </div>
        );
      },
    },
  ];

  const paginationConfig = {
    current: page + 1,
    pageSize: size,
    total: pageMeta.totalElements,
    showSizeChanger: true,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    showTotal: (total) => `Tổng ${total} bài viết`,
  };

  return (
    <div className="p-4">
      {contextHolder}
      <Card
        className="mb-4"
        title={
          <div className="flex flex-col gap-1">
            <Title level={4} className="!mb-0">
              Quản lý blog
            </Title>
            <Text type="secondary">
              Kiểm tra, chỉnh sửa hoặc xóa bài viết hiển thị trên hệ thống khách
              hàng.
            </Text>
          </div>
        }
        extra={
          <div className="flex gap-2">
            <Button
              type="primary"
              onClick={() => navigate("/admin/management-blogs/create")}
              className="!bg-emerald-600 hover:!bg-emerald-700"
            >
              Tạo blog
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              Tải lại
            </Button>
          </div>
        }
        bordered={false}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={blogs}
          loading={loading}
          pagination={paginationConfig}
          onChange={handleTableChange}
          // scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
};

export default ManagementBlog;
