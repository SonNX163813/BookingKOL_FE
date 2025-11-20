// src/pages/admin/booking-campaign/BookingCampaignSchedule.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
  Button,
  Card,
  DatePicker,
  TimePicker,
  Form,
  Input,
  Row,
  Col,
  Select,
  Space,
  Table,
  Typography,
  message,
  ConfigProvider,
  Alert,
} from "antd";
import viVN from "antd/locale/vi_VN";
import { CalendarRange, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  adminGetWorktimesByBooking,
  adminCreateWorktime,
  adminSearchFreeSlots,
} from "../../../services/admin/AdminWorktimeCampaignAPI";
import { adminGetCampaignBookingDetail } from "../../../services/admin/AdminBookingCampaignAPI";

dayjs.locale("vi");
const { RangePicker } = DatePicker;
const { RangePicker: TimeRangePicker } = TimePicker;
const { Text } = Typography;

/**
 * BookingCampaignSchedule
 *
 * - BookingRequestId:
 *   + Ưu tiên lấy từ location.state.bookingRequestId (navigate từ màn khác).
 *   + Nếu không có, gọi /admin/bookings/admin/{campaignId} để lấy bookingRequests[0].id.
 *
 * - Flow tạo lịch:
 *   1) Chọn "Khoảng thời gian muốn tìm lịch rảnh" (searchRange).
 *   2) Bấm "Tìm KOL / trợ live rảnh" -> gọi adminSearchFreeSlots(startDate, endDate).
 *   3) Chọn 1 slot rảnh -> set selectedSlot (kolId, kolName, startAt, endAt, availabilityId).
 *   4) Chọn ngày + khoảng giờ cụ thể (workDate + timeRange) -> submit -> adminCreateWorktime.
 */
export default function BookingCampaignSchedule() {
  const { campaignId: campaignIdParam } = useParams();
  const location = useLocation();
  const [form] = Form.useForm();

  // Nếu màn trước truyền bookingRequestId & campaignName qua state
  const prefilledBookingRequestId = location.state?.bookingRequestId || "";
  const prefilledCampaignName = location.state?.campaignName || "";

  const [bookingRequestId, setBookingRequestId] = useState(
    prefilledBookingRequestId
  );

  // Danh sách slot rảnh & slot đang chọn
  const [freeSlots, setFreeSlots] = useState([]);
  const [loadingFreeSlots, setLoadingFreeSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [freeSlotKolFilter, setFreeSlotKolFilter] = useState(undefined);

  // ===== disabledDate cho khoảng thời gian tìm lịch rảnh: chỉ từ hôm nay trở đi =====
  const disabledSearchDate = (current) => {
    if (!current) return false;
    return current < dayjs().startOf("day");
  };

  // ===== LẤY BOOKING DETAIL THEO campaignId ĐỂ SUY RA bookingRequestId (NẾU CHƯA CÓ SẴN) =====
  const {
    data: bookingDetailResp,
    isLoading: loadingBookingDetail,
    error: errorBookingDetail,
  } = useQuery({
    queryKey: ["admin-campaign-booking-detail", campaignIdParam],
    queryFn: () => adminGetCampaignBookingDetail(campaignIdParam),
    enabled: !!campaignIdParam && !prefilledBookingRequestId,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const bookingDetail = bookingDetailResp?.data ?? bookingDetailResp ?? null;

  const bookingRequestsFromCampaign = useMemo(
    () =>
      Array.isArray(bookingDetail?.bookingRequests)
        ? bookingDetail.bookingRequests
        : [],
    [bookingDetail?.bookingRequests]
  );

  // Auto-fill bookingRequestId nếu chưa có mà API detail trả về bookingRequests
  useEffect(() => {
    if (prefilledBookingRequestId) return;

    if (!bookingRequestId && bookingRequestsFromCampaign.length > 0) {
      const first = bookingRequestsFromCampaign[0];
      if (first?.id) {
        const id = String(first.id);
        setBookingRequestId(id);
        form.setFieldsValue({ bookingRequestId: id });
      }
    }
  }, [
    prefilledBookingRequestId,
    bookingRequestId,
    bookingRequestsFromCampaign,
    form,
  ]);

  // ===== Load worktimes by bookingRequestId =====
  const {
    data: worktimeResp,
    isFetching: loadingWorktimes,
    refetch: refetchWorktimes,
  } = useQuery({
    queryKey: ["admin-worktimes-by-booking", bookingRequestId],
    queryFn: async () => {
      if (!bookingRequestId) return null;
      return adminGetWorktimesByBooking(bookingRequestId);
    },
    enabled: !!bookingRequestId,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const worktimeList = useMemo(() => {
    if (!worktimeResp) return [];
    const content = worktimeResp?.content ?? [];
    return Array.isArray(content) ? content : [];
  }, [worktimeResp]);

  // ===== OPTION KOL / TRỢ LIVE TỪ DANH SÁCH SLOT RẢNH =====
  const freeSlotKolOptions = useMemo(() => {
    const map = new Map();
    freeSlots.forEach((slot) => {
      if (slot.kolId) {
        const key = String(slot.kolId);
        if (!map.has(key)) {
          map.set(key, slot.kolName || key);
        }
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [freeSlots]);

  // Dữ liệu hiển thị cho bảng slot rảnh: có filter theo KOL
  const filteredFreeSlots = useMemo(() => {
    if (!freeSlotKolFilter) return freeSlots;
    return freeSlots.filter(
      (slot) => String(slot.kolId) === String(freeSlotKolFilter)
    );
  }, [freeSlots, freeSlotKolFilter]);

  // ===== TÌM LỊCH RẢNH DỰA TRÊN searchRange (dùng startDate/endDate) =====
  const handleSearchFreeSlots = async () => {
    try {
      const range = form.getFieldValue("searchRange");
      if (!Array.isArray(range) || range.length !== 2) {
        message.warning("Vui lòng chọn khoảng thời gian muốn tìm lịch rảnh.");
        return;
      }

      const [start, end] = range;

      // swagger: startDate, endDate (date-time)
      const startDateIso = dayjs(start).toISOString();
      const endDateIso = dayjs(end).toISOString();

      setLoadingFreeSlots(true);

      // 1) Gọi API lấy slot rảnh
      const list = await adminSearchFreeSlots({
        startDate: startDateIso,
        endDate: endDateIso,
        page: 0,
        size: 100,
      });

      const qStart = dayjs(startDateIso);
      const qEnd = dayjs(endDateIso);

      // 2) FE lọc lại: status AVAILABLE + có giao với khoảng đang tìm
      const filtered = (list || []).filter((slot) => {
        const status = String(slot.status || "").toUpperCase();
        if (status !== "AVAILABLE") return false;

        if (!slot.startAt || !slot.endAt) return false;

        const s = dayjs(slot.startAt);
        const e = dayjs(slot.endAt);
        if (!s.isValid() || !e.isValid()) return false;

        // Có giao nhau với [qStart, qEnd]
        const overlap = s.isBefore(qEnd) && e.isAfter(qStart);
        return overlap;
      });

      setFreeSlots(filtered);
      setSelectedSlot(null);
      setFreeSlotKolFilter(undefined);

      form.setFieldsValue({
        kolDisplay: undefined,
        kolId: undefined,
        availabilityId: undefined,
        timeRange: undefined,
        workDate: undefined,
        freeSlotKolId: undefined,
      });
    } catch (e) {
      console.error("Search free slots failed:", e);
      const beMsg =
        e?.response?.data?.message ||
        e?.message ||
        "Không tìm được lịch rảnh, vui lòng thử lại.";
      message.error(beMsg);
    } finally {
      setLoadingFreeSlots(false);
    }
  };

  // ===== SUBMIT TẠO WORKTIME =====
  const handleCreateWorktime = async (values) => {
    try {
      const id =
        bookingRequestId ||
        prefilledBookingRequestId ||
        values.bookingRequestId?.trim();

      if (!id) {
        message.warning(
          "Booking Request ID chưa được xác định. Vui lòng quay lại trang trước hoặc đảm bảo campaign đã có booking."
        );
        return;
      }

      if (!selectedSlot) {
        message.warning("Vui lòng chọn một slot rảnh trước khi tạo lịch.");
        return;
      }

      const workDate = values.workDate;
      const timeRange = values.timeRange;

      if (!workDate) {
        message.warning("Vui lòng chọn ngày làm việc.");
        return;
      }

      if (!Array.isArray(timeRange) || timeRange.length !== 2) {
        message.warning("Vui lòng chọn khoảng giờ làm việc.");
        return;
      }

      const [startTime, endTime] = timeRange;
      if (!startTime || !endTime) {
        message.warning("Vui lòng chọn đủ giờ bắt đầu và giờ kết thúc.");
        return;
      }

      // Combine ngày + giờ, phút luôn = 00
      const baseDate = dayjs(workDate).startOf("day");
      const startAt = baseDate
        .hour(startTime.hour())
        .minute(0)
        .second(0)
        .millisecond(0);

      const endAt = baseDate
        .hour(endTime.hour())
        .minute(0)
        .second(0)
        .millisecond(0);

      if (!endAt.isAfter(startAt)) {
        message.error("Giờ kết thúc phải lớn hơn giờ bắt đầu.");
        return;
      }

      const diffMinutes = endAt.diff(startAt, "minute");
      if (diffMinutes < 60) {
        message.error("Một lần tạo lịch tối thiểu là 1 giờ.");
        return;
      }
      if (diffMinutes > 180) {
        message.error("Một lần tạo lịch tối đa là 3 giờ.");
        return;
      }

      const slotStart = dayjs(selectedSlot.startAt);
      const slotEnd = dayjs(selectedSlot.endAt);

      if (startAt.isBefore(slotStart) || endAt.isAfter(slotEnd)) {
        message.error(
          "Khoảng thời gian tạo lịch phải nằm trong khoảng rảnh đã chọn."
        );
        return;
      }

      const kolId = selectedSlot.kolId;
      if (!kolId) {
        message.warning("Không xác định được KOL / trợ live từ slot đã chọn.");
        return;
      }

      const availabilityId = values.availabilityId || selectedSlot.id || null;

      const payload = {
        bookingRequestId: id,
        availabilityId,
        kolId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        note: values.note || null,
      };

      await adminCreateWorktime(payload);
      message.success("Tạo lịch làm việc thành công.");

      setBookingRequestId(id);
      form.setFieldsValue({ bookingRequestId: id });

      // reload worktimes
      refetchWorktimes();
    } catch (e) {
      console.error("Create worktime failed:", e);
      const beMsg =
        e?.response?.data?.message ||
        e?.message ||
        "Tạo lịch thất bại, vui lòng kiểm tra lại.";
      message.error(beMsg);
    }
  };

  // ===== COLUMNS TABLE WORKTIME (đã bỏ cột ID) =====
  const worktimeColumns = [
    {
      title: "KOL",
      dataIndex: "kolId",
      key: "kolId",
      width: 200,
      render: (v) => v || "--",
    },
    {
      title: "Bắt đầu",
      dataIndex: "startAt",
      key: "startAt",
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "--"),
      width: 180,
    },
    {
      title: "Kết thúc",
      dataIndex: "endAt",
      key: "endAt",
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "--"),
      width: 180,
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      render: (v) => v || "--",
      ellipsis: true,
    },
  ];

  // ===== COLUMNS TABLE FREE SLOTS =====
  const freeSlotColumns = [
    {
      title: "KOL / Trợ live",
      dataIndex: "kolName",
      key: "kolName",
      width: 220,
      render: (v) => v || "--",
    },
    {
      title: "Bắt đầu rảnh",
      dataIndex: "startAt",
      key: "startAt",
      width: 180,
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "--"),
    },
    {
      title: "Kết thúc rảnh",
      dataIndex: "endAt",
      key: "endAt",
      width: 180,
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "--"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (v) => v || "AVAILABLE",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Button
          type={selectedSlot?.id === record.id ? "primary" : "default"}
          onClick={() => {
            setSelectedSlot(record);
            form.setFieldsValue({
              kolDisplay: record.kolName,
              kolId: record.kolId,
              availabilityId: record.id,
              workDate: dayjs(record.startAt),
              // Gợi ý sẵn giờ, nhưng cũng ép phút = 00
              timeRange: [
                dayjs(record.startAt).minute(0).second(0),
                dayjs(record.endAt).minute(0).second(0),
              ],
            });
          }}
        >
          {selectedSlot?.id === record.id ? "Đang chọn" : "Chọn"}
        </Button>
      ),
    },
  ];

  return (
    <ConfigProvider locale={viVN}>
      <div className="h-full flex flex-col gap-4 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="border-2 border-gray-300 p-2 rounded-md w-fit">
              <CalendarRange className="text-gray-500" size={20} />
            </div>
            <div>
              <h1 className="text-[18px] font-bold uppercase">Lịch làm việc</h1>
              <p className="text-[14px] text-gray-600">
                Tạo và xem lịch làm việc theo Booking Request, dựa trên lịch
                rảnh của KOL / trợ live.
              </p>
              {prefilledCampaignName && (
                <Text type="secondary">Campaign: {prefilledCampaignName}</Text>
              )}
            </div>
          </div>

          <Space>
            <Button
              type="primary"
              onClick={() => {
                form.resetFields();
                setBookingRequestId("");
                setFreeSlots([]);
                setSelectedSlot(null);
                setFreeSlotKolFilter(undefined);
              }}
            >
              Tạo lại
            </Button>
          </Space>
        </div>

        {/* FORM TÌM SLOT RẢNH + TẠO LỊCH */}
        <Card bordered={false} className="shadow-sm">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateWorktime}
            initialValues={{ bookingRequestId: prefilledBookingRequestId }}
          >
            {/* BookingRequestId + khoảng thời gian muốn tìm lịch rảnh */}
            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}>
                <Form.Item label="Booking Request ID" name="bookingRequestId">
                  <Input disabled placeholder="Booking Request ID" />
                </Form.Item>
              </Col>

              <Col xs={24} md={16}>
                <Form.Item
                  label="Khoảng thời gian muốn tìm lịch rảnh"
                  name="searchRange"
                  tooltip="Chọn khoảng thời gian mong muốn, hệ thống sẽ trả về các KOL / trợ live rảnh trong khoảng đó"
                  rules={[
                    {
                      required: true,
                      message:
                        "Vui lòng chọn khoảng thời gian muốn tìm lịch rảnh.",
                    },
                  ]}
                >
                  <RangePicker
                    showTime={{
                      format: "HH",
                      minuteStep: 60,
                    }}
                    format="DD/MM/YYYY HH:00"
                    className="w-full"
                    placeholder={["Bắt đầu", "Kết thúc"]}
                    disabledDate={disabledSearchDate}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}>
                <Button
                  type="primary"
                  onClick={handleSearchFreeSlots}
                  loading={loadingFreeSlots}
                  style={{ backgroundColor: "#10B981", borderColor: "#10B981" }}
                >
                  Tìm KOL / trợ live rảnh
                </Button>
              </Col>
            </Row>

            {/* Bảng slot rảnh + CHỌN KOL FILTER Ở TRÊN */}
            {freeSlots.length > 0 && (
              <Card
                className="mt-4"
                size="small"
                title="Lịch rảnh của KOL / trợ live trong khoảng đã chọn"
              >
                <Row gutter={[12, 12]} className="mb-3">
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Chọn KOL / trợ live để hiển thị lịch rảnh"
                      name="freeSlotKolId"
                    >
                      <Select
                        allowClear
                        placeholder="Tất cả KOL / trợ live"
                        options={freeSlotKolOptions}
                        onChange={(val) =>
                          setFreeSlotKolFilter(val || undefined)
                        }
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Table
                  dataSource={filteredFreeSlots}
                  columns={freeSlotColumns}
                  rowKey={(r) => r.id}
                  pagination={false}
                  scroll={{ x: "auto" }}
                />
              </Card>
            )}

            {/* Thông tin slot đã chọn + cấu hình time cụ thể */}
            <div className="mt-6 border-t pt-4">
              <h2 className="text-base font-semibold mb-2">
                Cấu hình thời gian cụ thể cho lịch làm việc
              </h2>

              <Row gutter={[12, 12]}>
                {/* KOL đã chọn (readonly) */}
                <Col xs={24} md={8}>
                  <Form.Item
                    label="KOL / trợ live"
                    name="kolDisplay"
                    tooltip="Được chọn từ bảng slot rảnh bên trên"
                  >
                    <Input disabled placeholder="Chưa chọn slot rảnh nào" />
                  </Form.Item>

                  {/* hidden fields để submit */}
                  <Form.Item name="kolId" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item name="availabilityId" hidden>
                    <Input />
                  </Form.Item>
                </Col>

                {/* Ngày làm việc */}
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Ngày làm việc"
                    name="workDate"
                    rules={[{ required: true, message: "Chọn ngày làm việc" }]}
                  >
                    <DatePicker
                      className="w-full"
                      format="DD/MM/YYYY"
                      placeholder="Chọn ngày"
                    />
                  </Form.Item>
                </Col>

                {/* Khoảng giờ tạo lịch (chỉ chọn giờ, phút = 00) */}
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Khoảng giờ tạo lịch"
                    name="timeRange"
                    rules={[
                      { required: true, message: "Chọn khoảng giờ" },
                      () => ({
                        validator(_, value) {
                          if (!value || value.length !== 2) {
                            return Promise.resolve();
                          }
                          const [startTime, endTime] = value || [];
                          if (!startTime || !endTime) {
                            return Promise.resolve();
                          }
                          if (!dayjs(endTime).isAfter(dayjs(startTime))) {
                            return Promise.reject(
                              new Error(
                                "Giờ kết thúc phải lớn hơn giờ bắt đầu."
                              )
                            );
                          }
                          const diffMinutes = endTime.diff(startTime, "minute");
                          if (diffMinutes < 60) {
                            return Promise.reject(
                              new Error("Một lần tạo lịch tối thiểu là 1 giờ.")
                            );
                          }
                          if (diffMinutes > 180) {
                            return Promise.reject(
                              new Error("Một lần tạo lịch tối đa là 3 giờ.")
                            );
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <TimeRangePicker
                      format="HH"
                      minuteStep={60}
                      className="w-full"
                      placeholder={["Giờ bắt đầu", "Giờ kết thúc"]}
                    />
                  </Form.Item>
                </Col>

                {/* Ghi chú + nút tạo lịch */}
                <Col xs={24} md={8}>
                  <Form.Item label="Ghi chú" name="note">
                    <Input placeholder="Ghi chú (không bắt buộc)" />
                  </Form.Item>

                  <div className="flex items-center justify-end">
                    <Button htmlType="submit" type="primary" icon={<Plus />}>
                      Tạo lịch
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Thông báo load booking detail */}
            {loadingBookingDetail && !prefilledBookingRequestId && (
              <Alert
                className="mt-2"
                type="info"
                showIcon
                message="Đang lấy Booking Request ID từ Campaign..."
              />
            )}
            {errorBookingDetail && !prefilledBookingRequestId && (
              <Alert
                className="mt-2"
                type="error"
                showIcon
                message="Không thể lấy Booking Request ID từ Campaign."
                description={String(errorBookingDetail?.message ?? "")}
              />
            )}
          </Form>
        </Card>

        {/* Bảng lịch đã tạo */}
        <Card
          bordered={false}
          className="flex-1 shadow-sm"
          title="Lịch đăng ký của KOL / trợ live"
        >
          {!bookingRequestId ? (
            <Alert
              message="Chưa xác định được Booking Request ID"
              description="Vui lòng mở màn hình này từ trang Chi tiết / Tạo booking campaign, hoặc đảm bảo campaign đã có Booking Request."
              type="info"
              showIcon
            />
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <Text strong>
                  Danh sách lịch cho Booking: {bookingRequestId}
                </Text>
              </div>

              <Table
                dataSource={worktimeList}
                columns={worktimeColumns}
                rowKey={(r) => r.id || `${r.startAt}_${r.endAt}`}
                loading={loadingWorktimes}
                pagination={false}
                scroll={{ x: "auto" }}
              />
            </>
          )}
        </Card>
      </div>
    </ConfigProvider>
  );
}
