import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Tag,
  Select,
  Image,
  Table,
  Typography,
  Space,
  Button,
} from "antd";
import {
  FileImageOutlined,
  EyeOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { ArrowRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetDetailCourse } from "../../../hook/admin/course/useGetDetailCourse";

const { TextArea } = Input;
const { Title, Text } = Typography;

const columns = [
  {
    title: "Tên tệp",
    dataIndex: ["file", "fileName"],
    key: "fileName",
  },
  {
    title: "Loại",
    key: "fileType",
    render: () => (
      <Tag color="blue" className="rounded-md">
        IMAGE
      </Tag>
    ),
  },
  {
    title: "Ảnh bìa",
    dataIndex: "isCover",
    render: (isCover) =>
      isCover ? <Tag color="green">Có</Tag> : <Tag color="default">Không</Tag>,
  },
  {
    title: "Trạng thái",
    render: () => <Tag color="green">ACTIVE</Tag>,
  },
  {
    title: "Ngày tạo",
    render: () => "25/09/2025",
  },
  {
    title: "Thao tác",
    align: "center",
    render: () => (
      <Space>
        <EyeOutlined style={{ color: "#1677ff", cursor: "pointer" }} />
        <DeleteOutlined style={{ color: "#ff4d4f", cursor: "pointer" }} />
      </Space>
    ),
  },
];

const ViewDetailCourse = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  console.log(id);

  const { isLoadingGetDetailCourse, ResponseGetDetailCourse } =
    useGetDetailCourse(id);

  const dataResponse = ResponseGetDetailCourse?.data;
  console.log(dataResponse);

  return (
    <div className="px-4 py-6 space-y-6 flex flex-col gap-5">
      <Card
        title={
          <Title level={4} className="font-bold">
            <div className="flex justify-between !items-center py-2">
              <span>Thông tin cơ bản</span>
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
        className="shadow-sm rounded-2xl"
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <Form layout="vertical">
              <Form.Item label="Tên khóa học">
                <Input className="!h-12" value={dataResponse?.name} readOnly />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Giá (VNĐ)">
                    <Input
                      className="!h-12"
                      value={dataResponse?.price.toLocaleString("vi-VN")}
                      readOnly
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Giảm giá (%)">
                    <Input
                      className="!h-12"
                      value={dataResponse?.discount}
                      readOnly
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Trạng thái">
                <Select
                  className="!h-12"
                  value={
                    dataResponse?.isAvailable ? "Có sẵn" : "Không hoạt động"
                  }
                  disabled
                  options={[
                    { value: "Có sẵn", label: "Có sẵn" },
                    { value: "Không hoạt động", label: "Không hoạt động" },
                  ]}
                />
              </Form.Item>
            </Form>
          </Col>

          <Col xs={24} md={8}>
            <div className="border rounded-xl p-3 bg-gray-50 border-gray-300">
              <div className="flex items-center justify-between mb-2">
                <Text strong>Hình ảnh khóa học</Text>
                <Tag color="green">Có sẵn</Tag>
              </div>
              <Text type="secondary" className="block mb-1">
                ID: {dataResponse?.id}
              </Text>

              {dataResponse?.fileUsageDtos.map((img) => (
                <div
                  key={img.id}
                  className="border border-gray-200 rounded-lg bg-white p-2 flex flex-col items-center justify-center mb-3 hover:shadow-md transition"
                >
                  <Image
                    src={img.file.fileUrl}
                    alt={img.file.fileName}
                    width={100}
                    height={100}
                    style={{ objectFit: "cover", borderRadius: 8 }}
                    preview={false}
                    fallback={<FileImageOutlined />}
                  />
                  {/* <Text className="text-center mt-1" type="secondary">
                                        {img.isCover ? "Ảnh bìa khóa học" : "Ảnh phụ"}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {img.file.fileName}
                                    </Text> */}
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        title={<Title level={4}>Mô tả khóa học</Title>}
        className="shadow-sm rounded-2xl"
      >
        <Form layout="vertical">
          <Form.Item label="Nội dung">
            <TextArea
              value={dataResponse?.description}
              readOnly
              autoSize={{ minRows: 10 }}
              style={{ backgroundColor: "#fafafa", fontSize: 15 }}
            />
          </Form.Item>
        </Form>
      </Card>

      <Card
        title={<Title level={4}>Quản lý tệp tin</Title>}
        className="shadow-sm rounded-2xl"
      >
        <Table
          columns={columns}
          dataSource={dataResponse?.fileUsageDtos}
          pagination={false}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

export default ViewDetailCourse;
