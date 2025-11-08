import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Result,
  Spin,
  Tag,
  Typography,
  Switch,
  message,
  Space,
} from "antd";
import { ArrowLeftOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  adminFetchBlogDetail,
  adminUpdateBlog,
} from "../../../services/admin/AdminBlogAPI";
import RichTextEditor from "../../../components/admin/RichTextEditor";
import { Box } from "@mui/material";

const { Title, Text } = Typography;

const formatDateTime = (value) =>
  value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "--";

const stripHtml = (value = "") =>
  typeof value === "string" ? value.replace(/<[^>]+>/g, "").trim() : "";

const AdminBlogDetail = () => {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const watchedValues = Form.useWatch([], form);
  const editablePreview = useMemo(() => {
    return {
      title: watchedValues?.title ?? "",
      author: watchedValues?.author ?? "",
      content: watchedValues?.content ?? "",
      isPublish: Boolean(watchedValues?.isPublish),
    };
  }, [watchedValues]);

  const loadBlogDetail = useCallback(async () => {
    if (!blogId) {
      setState({
        loading: false,
        data: null,
        error: "Không tìm thấy mã blog.",
      });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await adminFetchBlogDetail(blogId);
      setState({ loading: false, data, error: null });
    } catch (error) {
      const messageText =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tải chi tiết blog. Vui lòng thử lại.";
      setState({ loading: false, data: null, error: messageText });
    }
  }, [blogId]);

  useEffect(() => {
    loadBlogDetail();
  }, [loadBlogDetail]);

  const { loading, data, error } = state;

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        title: data.title || "",
        author: data.author || "",
        content: data.content || "",
        isPublish: Boolean(data.isPublish),
      });
    }
  }, [data, form]);

  const handleSubmitEdit = async () => {
    if (!blogId) return;
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await adminUpdateBlog(blogId, values);
      message.success("Cập nhật blog thành công!");
      await loadBlogDetail();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể cập nhật blog. Vui lòng thử lại.";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const statusTag = useMemo(() => {
    if (!data) return <Tag color="default">Đang cập nhật</Tag>;
    return data.isPublish ? (
      <Tag color="green">Đã xuất bản</Tag>
    ) : (
      <Tag color="default">Bản nháp</Tag>
    );
  }, [data]);

  const metadata = useMemo(
    () => [
      { label: "Tiêu đề", value: data?.title || "--" },
      { label: "Tác giả", value: data?.author || "--" },
      { label: "Mã blog", value: data?.id || "--" },
      { label: "Ngày tạo", value: formatDateTime(data?.createdAt) },
      { label: "Ngày cập nhật", value: formatDateTime(data?.updatedAt) },
    ],
    [data]
  );

  const previewItems = useMemo(
    () => [
      { label: "Tiêu đề", value: editablePreview.title || "--" },
      { label: "Tác giả", value: editablePreview.author || "--" },
      {
        label: "Nội dung",
        value: stripHtml(editablePreview.content).slice(0, 160) || "--",
      },
      {
        label: "Xuất bản",
        value: editablePreview.isPublish ? "Bật" : "Tắt",
      },
    ],
    [editablePreview]
  );

  const renderInfoCard = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      );
    }
    if (!data && !error) {
      return (
        <Empty
          description="Không có dữ liệu blog."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }
    return (
      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Text type="secondary">Trạng thái</Text>
          <div>{statusTag}</div>
        </div>
        {metadata.map((item) => (
          <div key={item.label} className="flex flex-col gap-1.5">
            <Text type="secondary">{item.label}</Text>
            <Text className="text-base font-semibold text-gray-800">
              {item.value}
            </Text>
          </div>
        ))}
      </div>
    );
  };

  const renderContentCard = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      );
    }
    if (!data?.content) {
      return (
        <Empty
          description="Bài viết chưa có nội dung."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }
    return (
      <div
        className="min-h-[220px] leading-relaxed text-base text-gray-800 blog-detail-content"
        dangerouslySetInnerHTML={{ __html: data.content }}
      />
    );
  };

  const renderEditableInfoCard = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      );
    }
    return (
      <div className="grid gap-5 md:grid-cols-2">
        <Form.Item
          label="Tiêu đề"
          name="title"
          rules={[
            { required: true, message: "Vui lòng nhập tiêu đề bài viết." },
          ]}
        >
          <Input placeholder="Nhập tiêu đề bài viết" />
        </Form.Item>
        <Form.Item label="Tác giả" name="author">
          <Input placeholder="Nhập tên tác giả" />
        </Form.Item>
        <Form.Item label="Xuất bản" name="isPublish" valuePropName="checked">
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>
      </div>
    );
  };

  const renderEditableContentCard = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      );
    }
    return (
      <Form.Item
        label="Nội dung"
        name="content"
        rules={[
          {
            required: true,
            message: "Vui lòng nhập nội dung bài viết.",
          },
        ]}
        className="mb-0"
      >
        <RichTextEditor
          placeholder="Nhập nội dung blog..."
          style={{ minHeight: 500 }}
        />
      </Form.Item>
    );
  };

  if (error) {
    return (
      <Result
        status="error"
        title="Không thể tải chi tiết blog"
        subTitle={error}
        extra={[
          <Button
            key="reload"
            icon={<ReloadOutlined />}
            onClick={loadBlogDetail}
            type="primary"
          >
            Thử lại
          </Button>,
          <Button
            key="back"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
            Quay lại
          </Button>,
        ]}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1">
            Chi tiết blog #{blogId}
          </Title>
          <Text type="secondary">
            Xem hoặc chỉnh sửa thông tin chi tiết và nội dung bài viết.
          </Text>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadBlogDetail}
            loading={loading}
            type="primary"
          >
            Tải lại
          </Button>
          <Button
            type={showEditor ? "default" : "primary"}
            onClick={() => setShowEditor((prev) => !prev)}
          >
            {showEditor ? "Ẩn chỉnh sửa" : "Chỉnh sửa"}
          </Button>
        </div>
      </div>

      {showEditor ? (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitEdit}
          className="space-y-6"
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <Card title="Thông tin chung">{renderEditableInfoCard()}</Card>
            <Card title="Nội dung bài viết">{renderEditableContentCard()}</Card>
          </div>
          <div className="flex justify-end">
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              disabled={loading}
            >
              Cập nhật
            </Button>
          </div>
        </Form>
      ) : (
        <>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <Card title="Thông tin chung">{renderInfoCard()}</Card>
            <Card title="Nội dung bài viết">{renderContentCard()}</Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminBlogDetail;
