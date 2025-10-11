import {
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Upload,
  message,
  Row,
  Col,
  Typography,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useCreateCourse } from "../../../hook/admin/course/useCreateCourse";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetAllCourse } from "../../../hook/admin/course/useGetAllCourse";

const { Title } = Typography;
const { TextArea } = Input;

const CreateCoursePage = () => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const navigate = useNavigate();

  const { refetchGetAllCourse } = useGetAllCourse(0, 20);

  const onSuccessCreateCourse = () => {
    navigate("/admin/management-course");
    refetchGetAllCourse();
  };
  const { isLoadingCreateCourse, handleCreateCourse } = useCreateCourse(
    onSuccessCreateCourse
  );

  const normFile = (e) => {
    if (Array.isArray(e)) return e;
    return e?.fileList;
  };

  const onFinish = (values) => {
    const medias = fileList.map((file) => file.originFileObj);
    handleCreateCourse({
      ...values,
      courseMedias: medias,
    });
  };

  return (
    <Card
      title={
        <Title level={3}>
          <div className="flex justify-between !items-center py-2">
            <span>Tạo mới khóa học</span>
            <div className="flex items-center justify-between">
              <Button
                onClick={() => navigate("/admin/management-course")}
                className="rounded-xl !h-10 !flex !items-center"
                type="default"
              >
                <ArrowRight size={18} /> Quay lại
              </Button>
            </div>
          </div>
        </Title>
      }
      bodyStyle={{ padding: 32 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ discount: 0 }}
      >
        <Row gutter={32}>
          <Col xs={24} md={14}>
            <Card
              title="Thông tin khóa học"
              bordered={false}
              style={{ marginBottom: 24, background: "#f9fafb" }}
            >
              <Form.Item
                label="Tên khóa học"
                name="name"
                rules={[
                  { required: true, message: "Vui lòng nhập tên khóa học!" },
                ]}
              >
                <Input placeholder="Nhập tên khóa học" className="h-12!" />
              </Form.Item>
              <Form.Item
                label="Giá"
                name="price"
                rules={[{ required: true, message: "Vui lòng nhập giá!" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Nhập giá khóa học"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  className="h-12!"
                />
              </Form.Item>
              <Form.Item
                label="Giảm giá (%)"
                name="discount"
                rules={[
                  { required: true, message: "Vui lòng nhập giảm giá!" },
                  {
                    type: "number",
                    min: 0,
                    max: 100,
                    message: "Giảm giá từ 0 đến 100%",
                  },
                ]}
              >
                <InputNumber
                  className="h-12!"
                  style={{ width: "100%" }}
                  min={0}
                  max={100}
                  placeholder="Nhập phần trăm giảm giá"
                />
              </Form.Item>
              <Form.Item
                label="Mô tả"
                name="description"
                rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
              >
                <TextArea rows={6} placeholder="Nhập mô tả chi tiết khóa học" />
              </Form.Item>
            </Card>
          </Col>
          <Col xs={24} md={10}>
            {/* <Card
                        title="Hình ảnh khóa học"
                        bordered={false}
                        style={{ background: "#f9fafb" }}
                        >
                            <Form.Item
                                label="Upload hình ảnh"
                                name="courseMedias"
                                valuePropName="fileList"
                                getValueFromEvent={normFile}
                                rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 ảnh!" }]}
                            >
                                <Upload
                                    multiple
                                    listType="picture-card"
                                    beforeUpload={() => false}
                                    fileList={fileList}
                                    onChange={({ fileList }) => setFileList(fileList)}
                                    accept="image/*"
                                    className="!w-100"
                                >
                                    <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                                </Upload>
                            </Form.Item>
                            <p className="text-gray-500 text-xs mt-2">* Có thể chọn nhiều ảnh, ảnh đầu tiên sẽ là ảnh đại diện.</p>
                        </Card> */}
            <Card
              title="Hình ảnh khóa học"
              bordered={false}
              style={{ background: "#f9fafb" }}
            >
              <Form.Item
                label="Upload hình ảnh"
                name="courseMedias"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                rules={[
                  { required: true, message: "Vui lòng chọn ít nhất 1 ảnh!" },
                ]}
              >
                <Upload
                  multiple
                  listType="picture-card"
                  beforeUpload={() => false}
                  fileList={fileList}
                  onChange={({ fileList }) => setFileList(fileList)}
                  accept="image/*"
                  className="!w-full"
                >
                  <Button
                    icon={<UploadOutlined />}
                    className="!w-full flex justify-center items-center"
                  >
                    Chọn ảnh
                  </Button>
                </Upload>
              </Form.Item>

              <p className="text-gray-500 text-xs mt-2">
                * Có thể chọn nhiều ảnh, ảnh đầu tiên sẽ là ảnh đại diện.
              </p>
            </Card>

            <div className="flex justify-end mt-10">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={isLoadingCreateCourse}
                className="h-12! px-5!"
              >
                Tạo khóa học
              </Button>
            </div>
          </Col>
        </Row>
        {/* <Row>
                    <Col span={24} style={{ textAlign: "center", marginTop: 32 }}>
                        
                    </Col>
                </Row> */}
      </Form>
    </Card>
  );
};

export default CreateCoursePage;
