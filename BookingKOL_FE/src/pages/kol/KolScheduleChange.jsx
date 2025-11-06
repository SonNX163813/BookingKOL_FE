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
  Tag,
  message,
  Empty,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import {
  createKolLeaveRequest,
  getMyLeaveRequests,
} from "../../services/kol/LeaveRequestAPI";
import { getKolFreeTime } from "../../services/kol/KolAPI";

dayjs.locale("vi");
const { Title, Text } = Typography;

const STATUS_COLOR = {
  PENDING: "gold",
  APPROVED: "green",
  REJECTED: "red",
  CANCELLED: "volcano",
};

export default function KolScheduleChange() {
  const { kolId: kolIdFromRoute } = useParams();
  const auth = useAuth?.() || {};
  const appUser = auth?.user || {};
  const queryClient = useQueryClient();

  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ page: 0, size: 10 });
  const [keyword, setKeyword] = useState("");

  /** ===== LẤY DANH SÁCH YÊU CẦU NGHỈ (MY LEAVES) ===== */
  const {
    data: leavesRes,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["kol-my-leaves", pagination.page, pagination.size, keyword],
    queryFn: () =>
      getMyLeaveRequests({
        page: pagination.page,
        size: pagination.size,
        keyword,
      }),
    keepPreviousData: true,
  });

  // interceptor GET trả về response.data => leavesRes = { status, message, data, timestamp }
  const leavesPage = leavesRes?.data || {};
  const leavesContent = Array.isArray(leavesPage.content)
    ? leavesPage.content
    : [];
  const totalElements = leavesPage.totalElements ?? 0;
  const pageSize = leavesPage.size || pagination.size;

  /** ===== SUY RA KOL ID TỰ ĐỘNG =====
   * Ưu tiên:
   * 1. kolId trên URL (nếu có)
   * 2. kolId trong danh sách my-leaves (cột kolId)
   * 3. kolId từ user context (nếu BE đã map)
   */
  const kolIdFromLeaves = useMemo(() => {
    if (!leavesContent.length) return "";
    // giả sử tất cả bản ghi thuộc cùng 1 KOL
    return leavesContent[0]?.kolId || "";
  }, [leavesContent]);

  const resolvedKolId =
    kolIdFromRoute ||
    kolIdFromLeaves ||
    appUser?.kolId ||
    appUser?.kolProfileId ||
    "";

  /** ===== LẤY DANH SÁCH LỊCH RẢNH (FREE TIME) CHO KOL =====
   * GET /v1/availabilities/free-time/{kolId}
   */
  const {
    data: freeTimeRes,
    isLoading: loadingFree,
    isError: isErrorFree,
  } = useQuery({
    queryKey: ["kol-free-time-for-leave", resolvedKolId],
    enabled: !!resolvedKolId,
    queryFn: () =>
      getKolFreeTime({
        kolId: resolvedKolId,
        // có thể truyền startDate/endDate nếu BE yêu cầu; để trống = full theo rule BE
      }),
  });

  // getKolFreeTime đã trả về array từ asArray()
  const freeTimeList = Array.isArray(freeTimeRes) ? freeTimeRes : [];

  /** ===== TẠO YÊU CẦU NGHỈ ===== */
  const { mutateAsync, isLoading: creating } = useMutation({
    mutationFn: createKolLeaveRequest,
    onSuccess: () => {
      message.success("Đã gửi yêu cầu xin nghỉ/đổi ca.");
      form.resetFields(["availabilityId", "reason"]);
      queryClient.invalidateQueries({ queryKey: ["kol-my-leaves"] });
    },
    onError: (e) => {
      const msg =
        e?.response?.data?.message?.[0] ||
        e?.response?.data?.message ||
        e?.message ||
        "Gửi yêu cầu thất bại";
      message.error(msg);
    },
  });

  const onSubmit = async (values) => {
    const kolId = resolvedKolId;
    if (!kolId) {
      message.warning(
        "Không xác định được KOL ID. Vui lòng thử lại sau hoặc liên hệ hỗ trợ."
      );
      return;
    }
    if (!values.availabilityId) {
      message.warning("Vui lòng chọn Availability ID.");
      return;
    }
    await mutateAsync({
      kolId,
      availabilityId: values.availabilityId,
      reason: values.reason || "",
    });
  };

  /** ===== CỘT BẢNG YÊU CẦU NGHỈ ===== */
  const leaveColumns = [
    {
      title: "Thời gian tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "-"),
      width: 160,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (v) => <Tag color={STATUS_COLOR[v] || "blue"}>{v || "-"}</Tag>,
      width: 120,
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
    {
      title: "Admin note",
      dataIndex: "adminNote",
      key: "adminNote",
      ellipsis: true,
    },
    {
      title: "Availability ID",
      dataIndex: "availabilityId",
      key: "availabilityId",
      render: (v) => <Text code>{v}</Text>,
      width: 260,
    },
  ];

  /** ===== CỘT BẢNG LỊCH RẢNH (CHỌN AVAILABILITY) ===== */
  const freeColumns = [
    {
      title: "Availability ID",
      dataIndex: "id",
      key: "id",
      render: (v) => <Text code>{v}</Text>,
      width: 260,
    },
    {
      title: "Thời gian",
      key: "time",
      render: (record) => {
        const start = record.startAt || record.startTime || record.start;
        const end = record.endAt || record.endTime || record.end;
        const s = start ? dayjs(start) : null;
        const e = end ? dayjs(end) : null;
        if (!s || !s.isValid() || !e || !e.isValid()) return "-";
        return `${s.format("HH:mm")} - ${e.format("HH:mm")}, ${s.format(
          "DD/MM/YYYY"
        )}`;
      },
    },
    {
      title: "",
      key: "action",
      render: (record) => (
        <Button
          size="small"
          type="link"
          onClick={() => form.setFieldsValue({ availabilityId: record.id })}
        >
          Chọn
        </Button>
      ),
      width: 80,
    },
  ];

  return (
    <Card style={{ margin: 16 }}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Title level={4} style={{ marginBottom: 0 }}>
          Thay đổi lịch làm / Xin nghỉ
        </Title>

        <Text type="secondary">
          1️⃣ Chọn <b>Availability</b> từ danh sách lịch rảnh bên dưới (bấm
          “Chọn” để tự điền).
          <br />
          2️⃣ Nhập lý do (nếu có) và gửi yêu cầu. Hệ thống dùng endpoint:{" "}
          <code>
            /v1/leave-requests/{"{kolId}"}/{"{availabilityId}"}
          </code>
          .
        </Text>

        {/* KOL ID hiển thị tự động, không cho sửa */}
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          initialValues={{ availabilityId: "", reason: "" }}
        >
          <Form.Item label="KOL ID">
            <Input
              value={resolvedKolId || ""}
              disabled
              placeholder="Đang lấy từ dữ liệu hệ thống..."
            />
          </Form.Item>

          <Form.Item
            label="Availability ID"
            name="availabilityId"
            rules={[
              { required: true, message: "Vui lòng chọn Availability ID" },
            ]}
          >
            <Input placeholder="Chọn từ bảng lịch rảnh bên dưới hoặc dán ID ca làm đã đăng ký" />
          </Form.Item>

          <Form.Item label="Lý do (reason — optional)" name="reason">
            <Input.TextArea rows={3} placeholder="Lý do xin nghỉ/đổi ca..." />
          </Form.Item>

          <Space>
            <Button
              htmlType="submit"
              type="primary"
              loading={creating}
              disabled={!resolvedKolId}
            >
              Gửi yêu cầu
            </Button>
          </Space>

          {!resolvedKolId && (
            <div className="mt-1 text-sm text-red-500">
              Không xác định được KOL ID từ hệ thống. Kiểm tra lại đăng nhập
              hoặc dữ liệu my-leaves.
            </div>
          )}
        </Form>

        {/* DANH SÁCH LỊCH RẢNH */}
        <div style={{ marginTop: 16 }}>
          <Title level={5}>Lịch rảnh (để chọn Availability)</Title>
          {isErrorFree ? (
            <Empty
              description="Không tải được danh sách lịch rảnh."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              size="small"
              rowKey={(r) => r.id || `${r.startAt}_${r.endAt}`}
              loading={loadingFree}
              columns={freeColumns}
              dataSource={freeTimeList}
              pagination={false}
              locale={{
                emptyText: resolvedKolId
                  ? "Không có lịch rảnh hoặc chưa đăng ký ca."
                  : "Chưa xác định được KOL ID.",
              }}
            />
          )}
        </div>

        {/* DANH SÁCH YÊU CẦU ĐÃ GỬI */}
        <div style={{ marginTop: 24 }}>
          <Title level={5}>Yêu cầu xin nghỉ/đổi ca của tôi</Title>

          <Space style={{ marginBottom: 8 }}>
            <Input.Search
              placeholder="Tìm theo lý do / ghi chú"
              allowClear
              onSearch={(v) => {
                setPagination((p) => ({ ...p, page: 0 }));
                setKeyword(v || "");
              }}
              style={{ width: 280 }}
            />
          </Space>

          <Table
            bordered
            rowKey={(r) => r.id}
            loading={isLoading}
            columns={leaveColumns}
            dataSource={leavesContent}
            locale={{
              emptyText: isError ? (
                <Empty
                  description={
                    <span>
                      Không tải được dữ liệu.
                      <br />
                      {error?.response?.data?.message?.[0] ||
                        error?.response?.data?.message ||
                        error?.message ||
                        "Vui lòng thử lại."}
                    </span>
                  }
                />
              ) : (
                "Chưa có yêu cầu xin nghỉ nào."
              ),
            }}
            pagination={{
              current:
                typeof leavesPage.number === "number"
                  ? leavesPage.number + 1
                  : pagination.page + 1,
              total: totalElements,
              pageSize: pageSize || pagination.size,
              showSizeChanger: true,
              onChange: (page, size) => {
                setPagination({ page: page - 1, size });
              },
            }}
          />
        </div>
      </Space>
    </Card>
  );
}
