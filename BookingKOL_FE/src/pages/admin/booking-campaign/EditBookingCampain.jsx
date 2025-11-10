import { useEffect, useState } from "react";
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
import { getKolProfiles, resolveAvatarUrl } from "../../../services/kol/KolAPI";
import { adminCreateBookingFromCampaign } from "../../../services/admin/AdminBookingFromCampaignAPI";

dayjs.locale("vi");

const REPEAT_TYPE_PLACEHOLDER =
  "Ví dụ: Hàng tuần, 2 buổi/tuần, mỗi T2-T4 trong 3 tuần...";

/** Tag render: avatar nhỏ + tên, không hiện id */
const createTagRender = (options) => (tagProps) => {
  const { value, closable, onClose } = tagProps;
  const opt = options.find((o) => o.value === value);
  if (!opt) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-[2px] bg-gray-100 rounded-full mr-1 mb-1"
      onClick={(e) => e.stopPropagation()}
    >
      {opt.avatar && (
        <img
          src={opt.avatar}
          alt={opt.name || "KOL"}
          className="w-4 h-4 rounded-full object-cover"
        />
      )}
      <span className="text-xs">{opt.name || "KOL"}</span>
      {closable && (
        <span
          onClick={onClose}
          className="cursor-pointer ml-1 text-gray-400 hover:text-red-400"
        >
          ×
        </span>
      )}
    </span>
  );
};

/** Format số: giữ digit, group mỗi 3 số bằng dấu phẩy */
const formatNumberWithCommas = (value) => {
  if (value === undefined || value === null) return "";
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export default function EditBookingCampain() {
  const [form] = Form.useForm();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [kolOptions, setKolOptions] = useState([]);
  const [liveOptions, setLiveOptions] = useState([]);
  const [loadingKols, setLoadingKols] = useState(false);

  // Lấy row từ state (từ list truyền sang)
  const row = location.state || {};

  // ✅ Ưu tiên campaignId đúng từ state; nếu không có thì mới lấy query
  const campaignIdFromState = row.campaignId;
  const campaignIdFromQuery = search.get("campaignId");
  const campaignId = campaignIdFromState || campaignIdFromQuery || "";

  // Prefill form
  useEffect(() => {
    const stateRow = location.state || {};
    form.setFieldsValue({
      campaignId,
      description: stateRow.objective || stateRow.campaignName || "",
      repeatType: "",
    });
  }, [campaignId, form, location.state]);

  // Load danh sách KOL & LIVE
  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const fetchKols = async () => {
      try {
        setLoadingKols(true);
        const res = await getKolProfiles({
          signal: controller.signal,
          params: { page: 0, size: 500 },
        });

        if (ignore) return;
        const list = Array.isArray(res?.content) ? res.content : [];

        const buildOption = (item) => {
          const name =
            item.displayName ||
            item.fullName ||
            item.username ||
            item.email ||
            item.phone ||
            item.id;
          const avatar = resolveAvatarUrl(item) || item.avatarUrl || "";

          return {
            label: (
              <div className="flex items-center gap-2">
                {avatar && (
                  <img
                    src={avatar}
                    alt={name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                )}
                <span>{name}</span>
              </div>
            ),
            value: item.id,
            name,
            avatar,
            searchText: `${name} ${item.id}`,
          };
        };

        const kolOpts = list
          .filter((i) => String(i?.role || "").toUpperCase() === "KOL")
          .map(buildOption);

        const liveOpts = list
          .filter((i) => String(i?.role || "").toUpperCase() === "LIVE")
          .map(buildOption);

        setKolOptions(kolOpts);
        setLiveOptions(liveOpts);
      } catch (err) {
        if (!ignore) {
          // eslint-disable-next-line no-console
          console.error("Fetch KOL/LIVE error:", err);
          message.error("Không tải được danh sách KOL / trợ LIVE");
        }
      } finally {
        if (!ignore) setLoadingKols(false);
      }
    };

    fetchKols();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  const onSubmit = async (values) => {
    try {
      if (!values.campaignId) {
        throw new Error("Campaign ID là bắt buộc và phải là campaignId");
      }

      const bookingPayload = {
        campaignId: values.campaignId, // dùng đúng campaignId
        description: values.description,

        repeatType: values.repeatType || undefined,
        startAt: values.startAt,
        repeatUntil: values.repeatUntil,
        contractAmount: values.contractAmount,
        kolIds: values.kolIds,
        liveIds: values.liveIds,
      };

      await adminCreateBookingFromCampaign(bookingPayload);

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
        {/* Header */}
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

        {/* Form */}
        <Card bordered={false} className="shadow-sm">
          <Form form={form} layout="vertical" onFinish={onSubmit}>
            <Row gutter={[16, 16]}>
              {/* Campaign ID */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="Campaign ID (campaignId)"
                  name="campaignId"
                  rules={[{ required: true, message: "Bắt buộc" }]}
                >
                  <Input
                    placeholder="e7d9-... (campaignId)"
                    disabled={!!campaignId}
                  />
                </Form.Item>
              </Col>

              {/* Repeat type: nhập chữ */}
              <Col xs={24} md={12}>
                <Form.Item label="Kiểu lặp" name="repeatType">
                  <Input placeholder={REPEAT_TYPE_PLACEHOLDER} />
                </Form.Item>
              </Col>

              {/* StartAt */}
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

              {/* RepeatUntil */}
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

              {/* Description */}
              <Col xs={24}>
                <Form.Item label="Mô tả" name="description">
                  <Input.TextArea
                    rows={3}
                    maxLength={500}
                    placeholder="Mô tả booking..."
                  />
                </Form.Item>
              </Col>

              {/* Contract amount */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="Giá trị hợp đồng (VND)"
                  name="contractAmount"
                  tooltip="Nhập số, tự format 1,000,000 (tối đa 13 chữ số)"
                  getValueFromEvent={(e) => {
                    const input = e?.target?.value || "";
                    const digits = input.replace(/\D/g, "");
                    if (digits.length > 13) {
                      message.open({
                        type: "warning",
                        content: "Chỉ có thể nhập tối đa 13 chữ số",
                        key: "contractAmountMaxDigits",
                      });
                    }
                    const limited = digits.slice(0, 13);
                    return formatNumberWithCommas(limited);
                  }}
                  rules={[
                    {
                      validator: (_, v) => {
                        if (!v || String(v).trim() === "") {
                          return Promise.resolve();
                        }
                        const raw = String(v).replace(/,/g, "").trim();
                        if (!/^\d+$/.test(raw)) {
                          return Promise.reject(
                            new Error("Số tiền không hợp lệ")
                          );
                        }
                        if (raw.length > 13) {
                          return Promise.reject(
                            new Error("Chỉ có thể nhập tối đa 13 chữ số")
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input placeholder="1,000,000" />
                </Form.Item>
              </Col>

              {/* KOL IDs */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="KOL IDs (KOL chính)"
                  name="kolIds"
                  tooltip="Chọn từ danh sách KOL (role = KOL)"
                >
                  <Select
                    mode="multiple"
                    placeholder="Chọn KOL (không bắt buộc)"
                    options={kolOptions}
                    loading={loadingKols}
                    allowClear
                    showSearch
                    optionFilterProp="searchText"
                    filterOption={(input, option) =>
                      (option?.searchText || "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    tagRender={createTagRender(kolOptions)}
                  />
                </Form.Item>
              </Col>

              {/* LIVE IDs */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="LIVE IDs (Trợ live)"
                  name="liveIds"
                  tooltip="Chọn từ danh sách trợ LIVE (role = LIVE)"
                >
                  <Select
                    mode="multiple"
                    placeholder="Chọn trợ LIVE (không bắt buộc)"
                    options={liveOptions}
                    loading={loadingKols}
                    allowClear
                    showSearch
                    optionFilterProp="searchText"
                    filterOption={(input, option) =>
                      (option?.searchText || "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    tagRender={createTagRender(liveOptions)}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Actions */}
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
