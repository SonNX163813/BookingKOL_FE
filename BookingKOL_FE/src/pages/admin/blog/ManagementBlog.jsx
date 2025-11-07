import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Switch,
  Table,
  Tag,
  Typography,
  Spin,
} from "antd";
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Search, Trash2, Eye, Plus, Pencil } from "lucide-react";
import {
  adminDeleteBlog,
  adminFetchBlogDetail,
  adminFetchBlogList,
  adminUpdateBlog,
} from "../../../services/admin/AdminBlogAPI";
import RichTextEditor from "../../../components/admin/RichTextEditor";

const { Title, Text } = Typography;

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const formatDateTime = (value) =>
  value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "--";

const emptyEditState = {
  open: false,
  loading: false,
  submitting: false,
  blogId: null,
};

const ManagementBlog = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageMeta, setPageMeta] = useState({
    totalElements: 0,
    totalPages: 0,
  });

  const [editModal, setEditModal] = useState(emptyEditState);
  const [editForm] = Form.useForm();

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

  const openEditModal = async (blogId) => {
    setEditModal({
      open: true,
      loading: true,
      submitting: false,
      blogId,
    });
    try {
      const detail = await adminFetchBlogDetail(blogId);
      editForm.setFieldsValue({
        title: detail?.title ?? "",
        author: detail?.author ?? "",
        content: detail?.content ?? "",
        isPublish: detail?.isPublish ?? false,
      });
      setEditModal({
        open: true,
        loading: false,
        submitting: false,
        blogId,
      });
    } catch (error) {
      console.error("Failed to load blog for editing", error);
      setEditModal(emptyEditState);
    }
  };

  const closeEditModal = () => {
    setEditModal(emptyEditState);
    editForm.resetFields();
  };

  const handleSubmitEdit = async () => {
    if (!editModal.blogId) return;
    const values = await editForm.validateFields();
    setEditModal((prev) => ({ ...prev, submitting: true }));
    try {
      await adminUpdateBlog(editModal.blogId, values);
      closeEditModal();
      fetchBlogs(page, size);
    } finally {
      setEditModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const confirmDeleteBlog = (blogId) => {
    Modal.confirm({
      title: `Xóa blog #${blogId}?`,
      icon: <ExclamationCircleOutlined />,
      centered: true,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: () => adminDeleteBlog(blogId).then(() => fetchBlogs(page, size)),
    });
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      width: 70,
      render: (_, __, index) => (
        <span className="font-semibold">#{page * size + index + 1}</span>
      ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (value) => value || "Chưa cập nhật",
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
          <Tag color="green">Đã xuất bản</Tag>
        ) : (
          <Tag color="default">Nháp</Tag>
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
      width: 260,
      render: (_, record) => (
        <div className="flex justify-center gap-2">
            <Button
              onClick={() => navigate(`/admin/management-blogs/${record.id}`)}
              className="!h-10 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
              title="Xem chi tiết"
            >
              <Eye size={18} className="font-semibold" />
            </Button>
          <Button
            onClick={() => openEditModal(record.id)}
            className="!h-10 !bg-emerald-600 !text-white !border-none hover:!bg-emerald-700 transition-all"
            title="Chỉnh sửa"
          >
            <Pencil size={18} className="font-semibold" />
          </Button>
          <Button
            className="!h-10 !bg-red-600 !text-white !border-none hover:!bg-red-700 transition-all"
            onClick={() => confirmDeleteBlog(record.id)}
          >
            <DeleteOutlined size={18} className="font-semibold" />
          </Button>
        </div>
      ),
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
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Tải lại
          </Button>
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
          scroll={{ x: 900 }}
        />
      </Card>

      <Modal
        open={editModal.open}
        onCancel={closeEditModal}
        onOk={handleSubmitEdit}
        confirmLoading={editModal.submitting}
        title={
          editModal.blogId
            ? `Chỉnh sửa blog #${editModal.blogId}`
            : "Chỉnh sửa blog"
        }
        width={900}
        okText="Luu"
        cancelText="Huy"
        okButtonProps={{ disabled: editModal.loading }}
      >
        {editModal.loading ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : (
          <Form form={editForm} layout="vertical">
            <Form.Item
              label="Tiêu đề"
              name="title"
              rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
            >
              <Input placeholder="Nhập tiêu đề bài viết" />
            </Form.Item>
            <Form.Item label="Tác giả" name="author">
              <Input placeholder="Tên tác giả" />
            </Form.Item>
            <Form.Item
              label="Nội dung"
              name="content"
              rules={[
                { required: true, message: "Vui lòng nhập nội dung bài viết" },
              ]}
            >
              <RichTextEditor placeholder="Nhập nội dung blog" />
            </Form.Item>
            <Form.Item
              label="Xuất bản"
              name="isPublish"
              valuePropName="checked"
            >
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default ManagementBlog;
