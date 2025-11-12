import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  Space,
  Switch,
  Typography,
  message,
} from "antd";
import RichTextEditor from "../../../components/admin/RichTextEditor";
import { adminCreateBlog } from "../../../services/admin/AdminBlogAPI";

const { Title, Text } = Typography;

const CreateBlog = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);
    try {
      await adminCreateBlog(values);
      message.success("Tạo blog thành công");
      navigate("/admin/management-blogs");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tạo blog. Vui lòng thử lại.";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={3} className="!mb-1">
            Tạo blog mới
          </Title>
          <Text type="secondary">
            Nhập thông tin chi tiết và nội dung bài viết trước khi công khai.
          </Text>
        </div>
        <Space wrap>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/admin/management-blogs")}
          >
            Quay lại
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={submitting}
            onClick={handleSubmit}
          >
            Lưu blog
          </Button>
        </Space>
      </div>

      <Card>
        <Form
          layout="vertical"
          form={form}
          initialValues={{ isPublish: true }}
          disabled={submitting}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="title"
              label="Tiêu đề"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập tiêu đề bài viết",
                },
              ]}
            >
              <Input placeholder="Nhập tiêu đề bài viết" />
            </Form.Item>
            <Form.Item
              name="author"
              label="Tác giả"
              rules={[{ required: true, message: "Vui lòng nhập tên tác giả" }]}
            >
              <Input placeholder="Nhập tên tác giả" />
            </Form.Item>
            <Form.Item
              name="isPublish"
              label="Trạng thái"
              valuePropName="checked"
            >
              <Switch checkedChildren="Công khai" unCheckedChildren="Ẩn" />
            </Form.Item>
          </div>
          <Form.Item
            name="content"
            label="Nội dung"
            valuePropName="value"
            getValueFromEvent={(content) => content}
            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
          >
            <RichTextEditor placeholder="Nhập nội dung bài viết" />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateBlog;
