import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  Alert,
  Button,
  Checkbox,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
} from "antd";
import {
  ArrowLeft,
  CalendarRange,
  Edit3,
  FileText,
  Layers,
  UserCircle2,
} from "lucide-react";
import { useGetMySingleBookingRequestDetail } from "../../../hook/user/booking/useGetMySingleBookingRequestDetail";
import { UploadOutlined } from "@ant-design/icons";
import { useUpdateMySingleBookingRequest } from "../../../hook/user/booking/useUpdateMySingleBookingRequest";

const { Text } = Typography;

const BOOKING_STATUS_LABEL = {
  DRAFT: "Bản nháp",
  REQUESTED: "Đang yêu cầu",
  PENDING: "Chờ xử lý",
  NEGOTIATING: "Đang đàm phán",
  ACCEPTED: "Đã chấp nhận",
  CONFIRMED: "Đã xác nhận",
  IN_PROGRESS: "Đang thực hiện",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  DISPUTED: "Đang tranh chấp",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã hủy",
  CONTRACT_SIGNED: "Đã ký hợp đồng",
  EXPIRED: "Hết hạn",
};

const STATUS_TAG_COLOR = {
  DRAFT: "default",
  REQUESTED: "processing",
  PENDING: "processing",
  NEGOTIATING: "cyan",
  ACCEPTED: "success",
  CONFIRMED: "blue",
  IN_PROGRESS: "processing",
  DELIVERED: "gold",
  COMPLETED: "success",
  DISPUTED: "magenta",
  REJECTED: "error",
  CANCELLED: "warning",
  CONTRACT_SIGNED: "purple",
  EXPIRED: "volcano",
};

const PAYMENT_STATUS_LABEL = {
  PAID: "Đã thanh toán",
  PENDING: "Chờ thanh toán",
  PROCESSING: "Đang xử lý",
  COMPLETED: "Hoàn tất",
  FAILED: "Thất bại",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
};

const PAYMENT_STATUS_COLOR = {
  PAID: "success",
  PENDING: "processing",
  PROCESSING: "processing",
  COMPLETED: "success",
  FAILED: "error",
  EXPIRED: "volcano",
  CANCELLED: "warning",
  REFUNDED: "purple",
};

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") =>
  value ? (dayjs(value).isValid() ? dayjs(value).format(pattern) : "--") : "--";

const formatCurrency = (value, currency = "VND") =>
  value
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value)
    : "--";

const composeExecutionTime = (record) => {
  const start = record?.startAt ?? record?.startTime;
  const end = record?.endAt ?? record?.endTime;
  if (!start && !end) return "--";
  const startLabel = formatDateTime(start);
  const endLabel = formatDateTime(end);
  const sameDay =
    dayjs(start).isValid() &&
    dayjs(end).isValid() &&
    dayjs(start).isSame(dayjs(end), "day");

  return sameDay
    ? `${dayjs(start).format("DD/MM/YYYY HH:mm")} → ${dayjs(end).format(
        "HH:mm"
      )}`
    : `${startLabel} → ${endLabel}`;
};

const formatArray = (v) => (Array.isArray(v) && v.length ? v.join(", ") : "--");

const normalizeStatus = (s) =>
  s && typeof s === "string" ? s.toUpperCase() : s;

const MySingleBookingRequestDetail = () => {
  const navigate = useNavigate();
  const { requestId } = useParams();

  const {
    isLoadingMyBookingRequestDetail,
    isFetchingMyBookingRequestDetail,
    myBookingRequestDetailResponse,
    refetchMyBookingRequestDetail,
    myBookingRequestDetailError,
  } = useGetMySingleBookingRequestDetail(requestId);
  const {
    isUpdatingMySingleBookingRequest,
    handleUpdateMySingleBookingRequest,
  } = useUpdateMySingleBookingRequest();
  const [updateForm] = Form.useForm();
  const [newAttachments, setNewAttachments] = useState([]);
  const [fileIdsToDelete, setFileIdsToDelete] = useState([]);

  const detail = myBookingRequestDetailResponse?.data ?? null;
  const contracts = Array.isArray(detail?.contracts)
    ? detail.contracts.filter(Boolean)
    : [];
  const attachedFiles = Array.isArray(detail?.attachedFiles)
    ? detail.attachedFiles.filter(Boolean)
    : [];
  const formattedAttachments = useMemo(
    () =>
      attachedFiles
        .map((item) => {
          const rawId =
            item?.id ??
            item?.fileId ??
            item?.file?.id ??
            item?.file?.fileId ??
            null;
          return {
            id: rawId ? String(rawId) : null,
            name:
              item?.file?.fileName ??
              item?.fileName ??
              (rawId ? `Tệp ${String(rawId).slice(-6)}` : "Tệp không tên"),
            type: item?.file?.fileType ?? item?.fileType ?? "",
          };
        })
        .filter(Boolean),
    [attachedFiles]
  );
  const deletableAttachments = useMemo(
    () => formattedAttachments.filter((item) => item.id),
    [formattedAttachments]
  );
  const deletableAttachmentOptions = useMemo(
    () =>
      deletableAttachments.map((item) => ({
        label: `${item.name}${item.type ? ` (${item.type})` : ""}`,
        value: item.id,
      })),
    [deletableAttachments]
  );

  const status = normalizeStatus(detail?.status);
  const statusLabel = status ? BOOKING_STATUS_LABEL[status] ?? status : "--";

  const handleBack = useCallback(() => {
    navigate("/don-booking-kol");
  }, [navigate]);

  const updateFormInitialValues = useMemo(
    () => ({
      fullName:
        detail?.fullName ??
        detail?.contact?.fullName ??
        detail?.user?.fullName ??
        "",
      phone:
        detail?.phone ?? detail?.contact?.phone ?? detail?.user?.phone ?? "",
      email:
        detail?.email ?? detail?.contact?.email ?? detail?.user?.email ?? "",
      description: detail?.description ?? "",
      location: detail?.location ?? "",
    }),
    [detail]
  );

  useEffect(() => {
    if (!detail) return;
    updateForm.setFieldsValue(updateFormInitialValues);
  }, [detail, updateForm, updateFormInitialValues]);

  useEffect(() => {
    if (!detail) return;
    setNewAttachments([]);
    setFileIdsToDelete([]);
  }, [detail]);

  const handleUploadChange = useCallback(({ fileList }) => {
    setNewAttachments(fileList);
  }, []);

  const handleSelectFilesToDelete = useCallback((values) => {
    const sanitized = (values ?? [])
      .map((value) => (value == null ? null : String(value)))
      .filter((value) => typeof value === "string" && value.trim().length > 0);
    setFileIdsToDelete(sanitized);
  }, []);

  const handleTriggerInlineUpdate = useCallback(() => {
    updateForm.submit();
  }, [updateForm]);

  const handleSubmitUpdate = useCallback(
    async (values) => {
      const attachmentsPayload = newAttachments
        .map((file) => file?.originFileObj)
        .filter(Boolean);

      const payloadDto = {};
      ["fullName", "phone", "email", "description", "location"].forEach(
        (key) => {
          const raw = values?.[key];
          if (raw === undefined || raw === null) return;
          if (typeof raw === "string") {
            payloadDto[key] = raw.trim();
          } else {
            payloadDto[key] = raw;
          }
        }
      );

      const sanitizedIds = fileIdsToDelete.filter(
        (id) => typeof id === "string" && id.trim().length > 0
      );

      try {
        await handleUpdateMySingleBookingRequest({
          requestId,
          updateBookingReqDTO:
            Object.keys(payloadDto).length > 0 ? payloadDto : undefined,
          attachedFiles: attachmentsPayload,
          fileIdsToDelete: sanitizedIds,
        });
        await refetchMyBookingRequestDetail();
        setNewAttachments([]);
        setFileIdsToDelete([]);
      } catch (error) {
        // handled by interceptors
      }
    },
    [
      newAttachments,
      fileIdsToDelete,
      handleUpdateMySingleBookingRequest,
      requestId,
      refetchMyBookingRequestDetail,
    ]
  );

  const attachedFileColumns = useMemo(
    () => [
      {
        title: "Tên tệp",
        dataIndex: ["file", "fileName"],
        key: "fileName",
        render: (_, r) => r?.file?.fileName ?? "--",
      },
      {
        title: "Loại",
        dataIndex: ["file", "fileType"],
        key: "fileType",
        render: (_, r) => r?.file?.fileType ?? "--",
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (v) => formatDateTime(v),
      },
      {
        title: "Liên kết",
        key: "link",
        render: (_, r) =>
          r?.file?.fileUrl ? (
            <Typography.Link
              href={r.file.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mở
            </Typography.Link>
          ) : (
            "--"
          ),
      },
    ],
    []
  );

  const isLoading =
    isLoadingMyBookingRequestDetail || isFetchingMyBookingRequestDetail;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-pink-50 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-purple-300/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 md:px-6 lg:px-8 flex flex-col gap-10">
        {/* Header */}
        <div>
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={handleBack}
            className="!flex !items-center !gap-2 !h-11 !rounded-xl !border !border-slate-200 !bg-white !text-indigo-600 !font-semibold !shadow-sm hover:!border-indigo-500/60 hover:!text-indigo-700 hover:!bg-indigo-50 transition-all duration-300"
          >
            Trở về đơn đặt KOL
          </Button>
        </div>
        <section className="rounded-3xl border border-white/40 bg-white/90 shadow-[0_40px_80px_-50px_rgba(79,70,229,0.6)] backdrop-blur p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                <CalendarRange size={16} />
                <span>Chi tiết booking KOL</span>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Xem chi tiết thông tin đơn, hợp đồng và thanh toán.
              </p>
            </div>
          </div>
        </section>

        {myBookingRequestDetailError ? (
          <Alert
            type="error"
            showIcon
            message="Không thể tải chi tiết đơn booking"
            description={
              myBookingRequestDetailError?.message ?? "Vui lòng thử lại sau."
            }
          />
        ) : null}

        <Skeleton active loading={isLoading}>
          {detail ? (
            <>
              {/* Booking Info */}
              <section className="rounded-3xl border border-white/40 bg-white/95 shadow-[0_45px_90px_-55px_rgba(15,23,42,0.45)] backdrop-blur p-6">
                <Space direction="vertical" size="large" className="w-full">
                  <Descriptions bordered size="middle" column={1}>
                    <Descriptions.Item label="Trạng thái">
                      {status ? (
                        <Tag color={STATUS_TAG_COLOR[status] ?? "default"}>
                          {statusLabel}
                        </Tag>
                      ) : (
                        "--"
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Thời gian thực hiện">
                      {composeExecutionTime(detail)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">
                      {formatDateTime(detail?.createdAt)}
                    </Descriptions.Item>
                  </Descriptions>

                  <Form
                    form={updateForm}
                    layout="vertical"
                    initialValues={updateFormInitialValues}
                    onFinish={handleSubmitUpdate}
                    requiredMark={false}
                    className="w-full"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <Form.Item
                        label="Người liên hệ"
                        name="fullName"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập người liên hệ",
                          },
                        ]}
                      >
                        <Input placeholder="Nhập tên người liên hệ" />
                      </Form.Item>
                      <Form.Item
                        label="Số điện thoại"
                        name="phone"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập số điện thoại",
                          },
                        ]}
                      >
                        <Input placeholder="Nhập số điện thoại liên hệ" />
                      </Form.Item>
                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                          { required: true, message: "Vui lòng nhập email" },
                          { type: "email", message: "Email không hợp lệ" },
                        ]}
                      >
                        <Input placeholder="Nhập email liên hệ" />
                      </Form.Item>
                      <Form.Item label="Địa điểm" name="location">
                        <Input placeholder="Nhập địa điểm thực hiện" />
                      </Form.Item>
                    </div>

                    <Form.Item label="Ghi chú" name="description">
                      <Input.TextArea
                        rows={4}
                        placeholder="Mô tả chi tiết yêu cầu hoặc ghi chú"
                      />
                    </Form.Item>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          Tệp đính kèm hiện có
                        </p>
                        <p className="mb-3  text-slate-500">
                          Chọn các tệp bạn muốn xóa khi cập nhật.
                        </p>
                        {deletableAttachmentOptions.length > 0 ? (
                          <Checkbox.Group
                            value={fileIdsToDelete}
                            onChange={handleSelectFilesToDelete}
                            className="flex flex-col gap-2"
                          >
                            {deletableAttachmentOptions.map((item) => (
                              <Checkbox key={item.value} value={item.value}>
                                <span
                                  className={`text-sm transition-all duration-200 ${
                                    fileIdsToDelete.includes(item.value)
                                      ? "line-through text-slate-700/60"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {item.label}
                                </span>
                              </Checkbox>
                            ))}
                          </Checkbox.Group>
                        ) : (
                          <div className="text-sm text-slate-500">
                            Không có tệp đính kèm.
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          Thêm tệp mới
                        </p>
                        <p className="mb-3  text-slate-500">
                          Các tệp này sẽ được đính kèm khi cập nhật.
                        </p>
                        <Upload
                          beforeUpload={() => false}
                          multiple
                          fileList={newAttachments}
                          onChange={handleUploadChange}
                        >
                          <Button icon={<UploadOutlined />}>Chọn tệp</Button>
                        </Upload>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={isUpdatingMySingleBookingRequest}
                        className="!h-11 !rounded-xl !bg-indigo-600 !px-6 hover:!bg-indigo-500"
                      >
                        Cập nhật booking
                      </Button>
                    </div>
                  </Form>
                </Space>
              </section>

              {/* User Info */}
              <section className="rounded-3xl border border-white/40 bg-white/95 shadow-[0_45px_90px_-55px_rgba(15,23,42,0.45)] backdrop-blur p-6">
                <Space>
                  <UserCircle2 size={18} />
                  <span className="text-lg font-semibold text-slate-900">
                    Thông tin người đặt
                  </span>
                </Space>
                {detail?.user ? (
                  <Descriptions
                    bordered
                    size="middle"
                    column={1}
                    className="mt-4"
                  >
                    <Descriptions.Item label="Tên">
                      {detail.user.fullName ?? "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {detail.user.email ?? "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">
                      {detail.user.phone ?? "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ">
                      {detail.user.address ?? "--"}
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Empty description="Không có thông tin người đặt" />
                )}
              </section>

              {/* KOL Info */}
              <section className="rounded-3xl border border-white/40 bg-white/95 shadow-[0_45px_90px_-55px_rgba(15,23,42,0.45)] backdrop-blur p-6">
                <Space>
                  <UserCircle2 size={18} />
                  <span className="text-lg font-semibold text-slate-900">
                    Thông tin KOL
                  </span>
                </Space>
                {detail?.kol ? (
                  <Descriptions
                    bordered
                    size="middle"
                    column={1}
                    className="mt-4"
                  >
                    <Descriptions.Item label="Tên KOL">
                      {detail.kol.displayName ?? detail.kol.fullName ?? "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Quốc gia">
                      {detail.kol.country ?? "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Thành phố">
                      {detail.kol.city ?? "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Danh mục">
                      {formatArray(
                        detail.kol.categories
                          ?.map((c) => c?.name)
                          .filter(Boolean)
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Kinh nghiệm">
                      {detail.kol.experience ?? "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mô tả">
                      <Text style={{ whiteSpace: "pre-wrap" }}>
                        {detail.kol.bio ?? "--"}
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Empty description="Không có thông tin KOL" />
                )}
              </section>

              {/* Contract & Payment */}
              <section className="rounded-3xl border border-white/40 bg-white/95 shadow-[0_45px_90px_-55px_rgba(15,23,42,0.45)] backdrop-blur p-6">
                <Space>
                  <Layers size={18} />
                  <span className="text-lg font-semibold text-slate-900">
                    Hợp đồng & thanh toán
                  </span>
                </Space>
                {contracts.length > 0 ? (
                  <Space
                    direction="vertical"
                    size="large"
                    className="w-full mt-4"
                  >
                    {contracts.map((c) => {
                      const paymentStatus = normalizeStatus(
                        c?.paymentDTO?.status
                      );
                      return (
                        <Card
                          key={c?.id}
                          type="inner"
                          title={`Hợp đồng ${c?.id ?? ""}`}
                          className="shadow-sm"
                        >
                          <Descriptions bordered size="middle" column={1}>
                            <Descriptions.Item label="Trạng thái hợp đồng">
                              <Tag
                                color={
                                  STATUS_TAG_COLOR[c?.status?.toUpperCase()] ??
                                  "default"
                                }
                              >
                                {BOOKING_STATUS_LABEL[
                                  c?.status?.toUpperCase()
                                ] ?? c?.status}
                              </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Thanh toán">
                              {paymentStatus ? (
                                <Tag
                                  color={PAYMENT_STATUS_COLOR[paymentStatus]}
                                >
                                  {PAYMENT_STATUS_LABEL[paymentStatus]}
                                </Tag>
                              ) : (
                                "--"
                              )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tổng tiền">
                              {formatCurrency(
                                c?.paymentDTO?.totalAmount,
                                c?.paymentDTO?.currency ?? "VND"
                              )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Đã thanh toán">
                              {formatCurrency(
                                c?.paymentDTO?.paidAmount,
                                c?.paymentDTO?.currency ?? "VND"
                              )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Hết hạn thanh toán">
                              {formatDateTime(c?.paymentDTO?.expiresAt)}
                            </Descriptions.Item>
                          </Descriptions>
                        </Card>
                      );
                    })}
                  </Space>
                ) : (
                  <Empty description="Không có thông tin hợp đồng" />
                )}
              </section>

              {/* Attached Files */}
              <section className="rounded-3xl border border-white/40 bg-white/95 shadow-[0_45px_90px_-55px_rgba(15,23,42,0.45)] backdrop-blur p-6">
                <Space>
                  <FileText size={18} />
                  <span className="text-lg font-semibold text-slate-900">
                    Tệp đính kèm
                  </span>
                </Space>
                {attachedFiles.length > 0 ? (
                  <Table
                    columns={attachedFileColumns}
                    dataSource={attachedFiles}
                    pagination={false}
                    rowKey={(r) => r?.id ?? Math.random()}
                    className="mt-4"
                  />
                ) : (
                  <Empty description="Không có tệp đính kèm" />
                )}
              </section>
            </>
          ) : (
            <Empty description="Không tìm thấy dữ liệu" />
          )}
        </Skeleton>
      </div>
    </div>
  );
};

export default MySingleBookingRequestDetail;
