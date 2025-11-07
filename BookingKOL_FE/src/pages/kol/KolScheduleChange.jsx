// src/pages/kol/KolScheduleChange.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Typography,
  Form,
  Input,
  Button,
  Space,
  Table,
  message,
  Empty,
  DatePicker,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import {
  getKolFreeTime,
  getKolProfileByUserId,
  removeKolAvailabilityRange,
} from "../../services/kol/KolAPI";

dayjs.locale("vi");
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function KolScheduleChange() {
  const { kolId: kolIdParam } = useParams();
  const auth = useAuth?.() || {};
  const userId = auth?.user?.id;
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  // ===== 1. Resolve KOL ID giống KolSchedule.jsx =====
  const [kolId, setKolId] = useState(
    kolIdParam || auth?.user?.kolId || auth?.user?.kolProfileId || ""
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      // Nếu đã có kolId từ route / user thì thôi
      if (kolId) return;
      if (!userId) return;
      try {
        const me = await getKolProfileByUserId(userId);
        if (mounted) setKolId(me?.id || "");
      } catch (e) {
        console.warn("[KolScheduleChange] getKolProfileByUserId fail:", e);
        if (mounted) {
          setKolId("");
          message.error("Không lấy được KOL ID. Vui lòng kiểm tra tài khoản.");
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [kolId, userId]);

  // ===== 2. Khoảng ngày filter free-time =====
  const [dateRange, setDateRange] = useState(() => {
    const start = dayjs().startOf("day");
    const end = dayjs().add(14, "day").endOf("day");
    return [start, end];
  });

  // ===== 3. Load danh sách ca rảnh từ /availabilities/free-time/{kolId} =====
  const {
    data: freeSlots = [],
    isLoading: loadingFree,
    isError: freeError,
    error: freeErrorObj,
  } = useQuery({
    queryKey: [
      "kol-free-time-for-change",
      kolId,
      dateRange[0]?.toISOString(),
      dateRange[1]?.toISOString(),
    ],
    enabled: !!kolId, // CHỈ chạy khi đã có kolId => trước đó bạn bị kẹt ở đây
    queryFn: () =>
      getKolFreeTime({
        kolId,
        startDate: dateRange[0]?.toISOString(),
        endDate: dateRange[1]?.toISOString(),
      }),
  });

  const slots = useMemo(
    () =>
      (freeSlots || []).map((x, index) => ({
        key: x.availabilityId || x.id || index,
        availabilityId: x.availabilityId || x.id, // cần BE trả trường này
        startAt: x.startAt,
        endAt: x.endAt,
      })),
    [freeSlots]
  );

  // ===== 4. Gọi /availabilities/kol/remove-range =====
  const { mutateAsync: doRemoveRange, isLoading: removing } = useMutation({
    mutationFn: removeKolAvailabilityRange,
    onSuccess: () => {
      message.success("Đã xóa khung giờ trong ca.");
      queryClient.invalidateQueries({
        queryKey: ["kol-free-time-for-change"],
      });
      form.resetFields(["removeRange"]);
    },
    onError: (e) => {
      const msg =
        e?.response?.data?.message?.[0] ||
        e?.response?.data?.message ||
        e?.message ||
        "Không thể cập nhật lịch.";
      message.error(msg);
    },
  });

  const handleSubmit = async (values) => {
    const { availabilityId, removeRange } = values;

    if (!kolId) {
      message.warning("Không xác định được KOL ID.");
      return;
    }
    if (!availabilityId) {
      message.warning("Vui lòng chọn Availability ID từ bảng ca bên dưới.");
      return;
    }
    if (!removeRange || removeRange.length !== 2) {
      message.warning("Vui lòng chọn khoảng giờ cần xóa.");
      return;
    }

    const [start, end] = removeRange;
    if (!dayjs(end).isAfter(start)) {
      message.warning("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }

    const slot = slots.find((s) => s.availabilityId === availabilityId);
    if (slot && slot.startAt && slot.endAt) {
      const sSlot = dayjs(slot.startAt);
      const eSlot = dayjs(slot.endAt);

      if (
        !start.isBetween(sSlot, eSlot, null, "[)") ||
        !end.isBetween(sSlot, eSlot, null, "(]")
      ) {
        message.warning(
          "Khoảng giờ cần xóa phải nằm hoàn toàn trong ca đã chọn."
        );
        return;
      }
    }

    await doRemoveRange({
      availabilityId,
      startRemove: start,
      endRemove: end,
    });
  };

  // ===== 5. Bảng ca rảnh =====
  const columns = [
    {
      title: "Availability ID",
      dataIndex: "availabilityId",
      key: "availabilityId",
      width: 260,
      render: (v) =>
        v ? (
          <Text code>{v}</Text>
        ) : (
          <Text type="secondary">
            Thiếu availabilityId (backend cần trả thêm trường này)
          </Text>
        ),
    },
    {
      title: "Thời gian ca",
      key: "time",
      render: (record) => {
        const s = record.startAt ? dayjs(record.startAt) : null;
        const e = record.endAt ? dayjs(record.endAt) : null;
        if (!s?.isValid() || !e?.isValid()) return "-";
        return `${s.format("HH:mm")} - ${e.format("HH:mm")}, ${s.format(
          "DD/MM/YYYY"
        )}`;
      },
    },
    {
      title: "",
      key: "action",
      width: 110,
      render: (record) => {
        const s = record.startAt ? dayjs(record.startAt) : null;
        const e = record.endAt ? dayjs(record.endAt) : null;
        return (
          <Button
            type="link"
            size="small"
            onClick={() => {
              if (!record.availabilityId) {
                message.warning(
                  "Ca này không có availabilityId trong response. Liên hệ backend để bổ sung."
                );
                return;
              }
              if (!s?.isValid() || !e?.isValid()) {
                message.warning("Thời gian ca không hợp lệ.");
                return;
              }
              form.setFieldsValue({
                availabilityId: record.availabilityId,
                removeRange: [s, e],
              });
            }}
          >
            Chọn ca
          </Button>
        );
      },
    },
  ];

  return (
    <Card style={{ margin: 16 }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Title level={4} style={{ marginBottom: 0 }}>
          Thay đổi lịch làm theo khung giờ
        </Title>

        <Text type="secondary">
          Dùng <code>/v1/availabilities/free-time/{"{kolId}"}</code> để lấy ca
          đã đăng ký và <code>/v1/availabilities/kol/remove-range</code> để xóa
          1 phần ca.
        </Text>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="KOL ID">
            <Input
              value={kolId || ""}
              disabled
              placeholder="Không xác định được KOL ID"
            />
          </Form.Item>

          <Form.Item
            label="Availability ID"
            name="availabilityId"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn Availability ID từ bảng ca bên dưới.",
              },
            ]}
          >
            <Input placeholder="Nhấn 'Chọn ca' bên dưới để tự điền." />
          </Form.Item>

          <Form.Item
            label="Khoảng giờ cần xóa trong ca"
            name="removeRange"
            rules={[
              { required: true, message: "Vui lòng chọn khoảng giờ cần xóa." },
            ]}
          >
            <RangePicker
              showTime
              style={{ width: "100%" }}
              format="DD/MM/YYYY HH:mm"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={removing}
            disabled={!kolId}
          >
            Xác nhận xóa khung giờ
          </Button>
        </Form>

        <div>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Title level={5}>Danh sách ca đã đăng ký</Title>

            <Space style={{ marginBottom: 8 }}>
              <RangePicker
                format="DD/MM/YYYY"
                value={dateRange}
                onChange={(vals) => {
                  if (!vals || vals.length !== 2) return;
                  setDateRange([vals[0].startOf("day"), vals[1].endOf("day")]);
                }}
              />
            </Space>

            <Table
              size="small"
              rowKey="key"
              loading={loadingFree}
              columns={columns}
              dataSource={slots}
              pagination={false}
              locale={{
                emptyText: freeError ? (
                  <Empty
                    description={
                      freeErrorObj?.response?.data?.message ||
                      "Không tải được danh sách ca."
                    }
                  />
                ) : kolId ? (
                  "Không có ca nào trong khoảng ngày đã chọn."
                ) : (
                  "Chưa xác định được KOL ID."
                ),
              }}
            />
          </Space>
        </div>
      </Space>
    </Card>
  );
}
