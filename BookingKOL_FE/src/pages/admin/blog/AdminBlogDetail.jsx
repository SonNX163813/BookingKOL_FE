import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  Button,
  Card,
  Empty,
  Result,
  Spin,
  Tag,
  Typography,
} from "antd";
import { ArrowLeftOutlined, ReloadOutlined } from "@ant-design/icons";
import { adminFetchBlogDetail } from "../../../services/admin/AdminBlogAPI";

const { Title, Text } = Typography;

const formatDateTime = (value) =>
  value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "--";

const AdminBlogDetail = () => {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: null,
  });

  const loadBlogDetail = useCallback(async () => {
    if (!blogId) {
      setState({
        loading: false,
        data: null,
        error: "Không tìm thấy mã blog",
      });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await adminFetchBlogDetail(blogId);
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tải chi tiết blog. Vui lòng thử lại.";
      setState({ loading: false, data: null, error: message });
    }
  }, [blogId]);

  useEffect(() => {
    loadBlogDetail();
  }, [loadBlogDetail]);

  const { loading, data, error } = state;

  const statusTag = useMemo(() => {
    if (!data) return <Tag color="default">Đang cập nhật</Tag>;
    return data.isPublish ? (
      <Tag color="green">Đã xuất bản</Tag>
    ) : (
      <Tag color="default">Nháp</Tag>
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
        <Empty description="Không có dữ liệu blog" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
          description="Chưa có nội dung bài viết"
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
            Xem đầy đủ nội dung và trạng thái bài viết trên hệ thống.
          </Text>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
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
        </div>
      </div>

      <Card title="Thông tin chung">{renderInfoCard()}</Card>

      <Card title="Nội dung bài viết">{renderContentCard()}</Card>
    </div>
  );
};

export default AdminBlogDetail;

