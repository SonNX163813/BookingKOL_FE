import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Space,
  message,
} from "antd";
import viVN from "antd/locale/vi_VN";
import { ArrowLeft, Save, CalendarRange } from "lucide-react";
import { adminCreateBookingFromCampaign } from "../../../services/admin/AdminBookingFromCampaignAPI";

dayjs.locale("vi");

const STATUS_OPTS = [
  { label: "Đang yêu cầu", value: "REQUESTED" },
  { label: "Đã phê duyệt", value: "APPROVED" },
  { label: "Đã từ chối", value: "REJECTED" },
  { label: "Hoàn tất", value: "COMPLETED" },
];

const REPEAT_TYPE_OPTS = [
  { label: "Một lần", value: "ONCE" },
  { label: "Hàng ngày", value: "DAILY" },
  { label: "Hàng tuần", value: "WEEKLY" },
  { label: "Hàng tháng", value: "MONTHLY" },
];

const DOW_OPTS = [
  { label: "Thứ 2", value: "MONDAY" },
  { label: "Thứ 3", value: "TUESDAY" },
  { label: "Thứ 4", value: "WEDNESDAY" },
  { label: "Thứ 5", value: "THURSDAY" },
  { label: "Thứ 6", value: "FRIDAY" },
  { label: "Thứ 7", value: "SATURDAY" },
  { label: "Chủ nhật", value: "SUNDAY" },
];

export default function EditBookingCampain() {
  const [form] = Form.useForm();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const campaignId =
    search.get("campaignId") ||
    location.state?.campaignId ||
    location.state?.id ||
    undefined;

  useEffect(() => {
    const row = location.state || {};
    form.setFieldsValue({
      campaignId,
      description: row?.objective || row?.campaignName || "",
      status: "REQUESTED",
      repeatType: "WEEKLY",
      dayOfWeek: "MONDAY",
    });
  }, [campaignId, form, location.state]);

  const onSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        startAt: values.startAt ? values.startAt.toISOString() : undefined,
        repeatUntil: values.repeatUntil
          ? values.repeatUntil.format("YYYY-MM-DD")
          : undefined,
      };
      await adminCreateBookingFromCampaign(payload);
      message.success("Tạo booking từ campaign thành công!");
      navigate("/admin/management-booking-campaigns");
    } catch (err) {
      message.error(
        err?.response?.data?.message?.[0] ||
          err?.message ||
          "Tạo booking thất bại"
      );
    }
  };

  return (
    <ConfigProvider locale={viVN}>
      <div className="h-full flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="border-2 border-gray-300 p-2 rounded-md w-fit">
              <CalendarRange className="text-gray-500" size={20} />
            </div>
            <div>
              <h1 className="text-[18px] font-bold uppercase">
                Tạo/Chỉnh sửa Booking Campaign
              </h1>
              <p className="text-[14px] text-gray-600">
                Gửi yêu cầu booking từ Campaign và sinh hợp đồng.
              </p>
            </div>
          </div>

          <Space>
            <Button
              type="default"
              onClick={() => navigate(-1)}
              icon={<ArrowLeft size={16} />}
            >
              Quay lại
            </Button>
          </Space>
        </div>

        <Card bordered={false} className="shadow-sm">
          <Form
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            initialValues={{ status: "REQUESTED", repeatType: "WEEKLY" }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Campaign ID"
                  name="campaignId"
                  rules={[{ required: true, message: "Bắt buộc" }]}
                >
                  <Input placeholder="e7d9-..." disabled={!!campaignId} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Trạng thái"
                  name="status"
                  rules={[{ required: true }]}
                >
                  <Select options={STATUS_OPTS} placeholder="Chọn trạng thái" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Kiểu lặp" name="repeatType">
                  <Select
                    options={REPEAT_TYPE_OPTS}
                    placeholder="Chọn kiểu lặp"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Ngày trong tuần" name="dayOfWeek">
                  <Select options={DOW_OPTS} placeholder="Chọn ngày" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Thời điểm bắt đầu (startAt)"
                  name="startAt"
                  rules={[{ required: true, message: "Bắt buộc" }]}
                >
                  <DatePicker
                    className="w-full"
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    placeholder="Chọn ngày giờ bắt đầu"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Lặp đến ngày (repeatUntil)"
                  name="repeatUntil"
                >
                  <DatePicker
                    className="w-full"
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày kết thúc lặp"
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Mô tả" name="description">
                  <Input.TextArea
                    rows={3}
                    maxLength={500}
                    placeholder="Mô tả booking..."
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Giá trị hợp đồng (VND)"
                  name="contractAmount"
                  tooltip="Ví dụ: 15000000 hoặc 15000000.00"
                  rules={[
                    {
                      validator: (_, v) => {
                        if (!v || String(v).trim() === "")
                          return Promise.resolve();
                        const n = Number(String(v).replace(/,/g, ""));
                        return Number.isFinite(n)
                          ? Promise.resolve()
                          : Promise.reject(new Error("Số tiền không hợp lệ"));
                      },
                    },
                  ]}
                >
                  <Input placeholder="15000000.00" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="KOL IDs"
                  name="kolIds"
                  tooltip="Dán nhiều ID, nhấn Enter để thêm"
                >
                  <Select
                    mode="tags"
                    tokenSeparators={[",", " ", "\n", "\t"]}
                    placeholder="Nhập/dán danh sách KOL ID"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="LIVE IDs"
                  name="liveIds"
                  tooltip="Dán nhiều ID, nhấn Enter để thêm"
                >
                  <Select
                    mode="tags"
                    tokenSeparators={[",", " ", "\n", "\t"]}
                    placeholder="Nhập/dán danh sách LIVE ID"
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="mt-4 flex items-center gap-3">
              <Button
                htmlType="submit"
                type="link"
                className="!h-10 !w-10 !p-0 !rounded-xl !text-white !border-none flex items-center justify-center"
                style={{ backgroundColor: "#10B981" }}
                title="Lưu booking"
              >
                <Save size={18} />
              </Button>
              <Button onClick={() => navigate(-1)}>Hủy</Button>
            </div>
          </Form>
        </Card>
      </div>
    </ConfigProvider>
  );
}
