// src/pages/admin/booking/EditBookingCampain.jsx
import { useEffect, useMemo, useState } from "react";
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
  InputNumber,
  Row,
  Select,
  Space,
  message,
  Alert,
} from "antd";
import viVN from "antd/locale/vi_VN";
import { ArrowLeft, Save, CalendarRange, XCircle } from "lucide-react";
import { getKolProfiles, resolveAvatarUrl } from "../../../services/kol/KolAPI";
import { adminCreateBookingFromCampaign } from "../../../services/admin/AdminBookingFromCampaignAPI";
import { adminCreateContractPayments } from "../../../services/admin/AdminContractPaymentAPI";

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

/** Parse "1,000,000" -> number | undefined */
const parseAmount = (value) => {
  if (value === undefined || value === null) return undefined;
  const raw = String(value).replace(/,/g, "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

export default function EditBookingCampain() {
  const [form] = Form.useForm();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [kolOptions, setKolOptions] = useState([]);
  const [liveOptions, setLiveOptions] = useState([]);
  const [loadingKols, setLoadingKols] = useState(false);

  const row = location.state || {};

  // ✅ Ưu tiên campaignId từ state (BE trả), fallback từ query
  const campaignIdFromState = row.campaignId;
  const campaignIdFromQuery = search.get("campaignId");
  const campaignId = campaignIdFromState || campaignIdFromQuery || "";

  // Prefill
  useEffect(() => {
    const stateRow = location.state || {};
    form.setFieldsValue({
      campaignId,
      description: stateRow.objective || stateRow.campaignName || "",
      repeatType: "",
    });
  }, [campaignId, form, location.state]);

  // Load KOL / LIVE
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
          console.error("Fetch KOL/LIVE error:", err);
          message.open({
            type: "error",
            content: "Không tải được danh sách KOL / trợ LIVE",
            icon: <XCircle size={18} className="text-red-500" />,
          });
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

  /** disabledDate cho startAt: chỉ từ hôm nay trở đi */
  const disabledStartDate = (current) => {
    if (!current) return false;
    return current < dayjs().startOf("day");
  };

  /** disabledDate cho repeatUntil: phải sau ngày startAt (tính theo ngày) */
  const disabledRepeatUntilDate = (current) => {
    if (!current) return false;
    const startAt = form.getFieldValue("startAt");
    if (!startAt) {
      return current < dayjs().startOf("day");
    }
    const minEndDate = dayjs(startAt).startOf("day").add(1, "day");
    return current < minEndDate;
  };

  /** Khi đổi số lần thanh toán: sync Form.List installments (1-5) */
  const handleTotalInstallmentsChange = (val) => {
    let n = Number(val);
    if (!Number.isFinite(n)) n = 0;

    if (n > 5) {
      n = 5;
      message.open({
        type: "warning",
        content: "Chỉ được tối đa thanh toán 5 đợt",
      });
    } else if (n === 5) {
      message.open({
        type: "info",
        content: "Chỉ được tối đa thanh toán 5 đợt",
      });
    }

    if (n < 1) {
      form.setFieldsValue({
        totalInstallments: undefined,
        installments: [],
      });
      return;
    }

    form.setFieldsValue({ totalInstallments: n });

    const current = form.getFieldValue("installments") || [];
    const next = [...current];

    if (n > next.length) {
      for (let i = next.length; i < n; i++) {
        next.push({ amount: "", dueDate: null });
      }
    } else if (n < next.length) {
      next.length = n;
    }

    form.setFieldsValue({ installments: next });
    // validate lại tổng tiền
    form.validateFields(["installments", "__sumGuard"]).catch(() => {});
  };

  /* ====== WATCH & TÍNH TỔNG ====== */
  const watchInstallments = Form.useWatch("installments", form);
  const watchContractAmountRaw = Form.useWatch("contractAmount", form);

  const sumState = useMemo(() => {
    const contractAmount = parseAmount(watchContractAmountRaw);
    const list = Array.isArray(watchInstallments) ? watchInstallments : [];
    const amounts = list
      .map((i) => parseAmount(i?.amount))
      .filter((v) => typeof v === "number" && !Number.isNaN(v));

    const hasAnyInstallmentAmount = amounts.length > 0;
    const sumInstallments = amounts.reduce((acc, v) => acc + v, 0);

    // Chỉ check khi có contractAmount & có cấu hình installments
    const sumMismatch =
      !!contractAmount &&
      hasAnyInstallmentAmount &&
      sumInstallments !== contractAmount;

    return {
      contractAmount,
      hasAnyInstallmentAmount,
      sumInstallments,
      sumMismatch,
    };
  }, [watchInstallments, watchContractAmountRaw]);

  const disableSave = sumState.sumMismatch;

  // ====== CHẶN PHÍM & PASTE CHO "Số lần thanh toán" (chỉ 1–5) ======
  const handleTotalInstallmentsKeyDown = (e) => {
    const controlKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
      "Enter",
      "Home",
      "End",
    ];
    if (controlKeys.includes(e.key)) return;

    // chỉ cho nhập 1,2,3,4,5
    if (!/^[1-5]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleTotalInstallmentsPaste = (e) => {
    const text = (e.clipboardData || window.clipboardData)
      .getData("text")
      .trim();
    if (!/^[1-5]$/.test(text)) {
      e.preventDefault();
    }
  };

  const onSubmit = async (values) => {
    try {
      if (!values.campaignId) {
        throw new Error("Campaign ID là bắt buộc và phải là campaignId");
      }

      // 1. Tạo booking từ campaign
      const bookingPayload = {
        campaignId: values.campaignId,
        description: values.description,
        repeatType: values.repeatType || undefined,
        startAt: values.startAt,
        repeatUntil: values.repeatUntil,
        contractAmount: values.contractAmount,
        kolIds: values.kolIds,
        liveIds: values.liveIds,
      };

      const bookingResult = await adminCreateBookingFromCampaign(
        bookingPayload
      );

      // 2. Lấy contractId & bookingRequestId từ response để tạo payments
      const data = (bookingResult && bookingResult.data) || bookingResult || {};

      const contractId =
        data.contractId ||
        data.contract_id ||
        data.contract?.id ||
        data.contract?.contractId ||
        null;

      const bookingRequestId =
        data.bookingRequestId ||
        data.booking_request_id ||
        data.bookingRequest?.id ||
        data.booking?.id ||
        data.bookingId ||
        data.id ||
        null;

      // 3. Chuẩn bị installments (nếu có)
      const rawInstallments = Array.isArray(values.installments)
        ? values.installments
        : [];

      const cleanedInstallments = rawInstallments
        .map((ins) => {
          const amount = parseAmount(ins?.amount);

          let dueDate;
          if (dayjs.isDayjs(ins?.dueDate)) {
            dueDate = ins.dueDate.format("YYYY-MM-DD");
          } else if (ins?.dueDate) {
            const d = dayjs(ins.dueDate);
            dueDate = d.isValid() ? d.format("YYYY-MM-DD") : undefined;
          }

          if (!amount || !dueDate) return null;
          return { amount, dueDate };
        })
        .filter(Boolean);

      let totalInstallments = Number(values.totalInstallments);
      if (!Number.isFinite(totalInstallments) || totalInstallments <= 0) {
        totalInstallments = cleanedInstallments.length;
      }
      if (totalInstallments > 5) totalInstallments = 5;

      // 4. Gọi API tạo lịch thanh toán hợp đồng (nếu có installments hợp lệ)
      if (cleanedInstallments.length > 0) {
        if (!contractId || !bookingRequestId) {
          message.open({
            type: "error",
            content:
              "Đã tạo booking nhưng không lấy được contractId/bookingRequestId để tạo lịch thanh toán. Vui lòng kiểm tra lại phản hồi từ server.",
            icon: <XCircle size={18} className="text-red-500" />,
          });
        } else {
          try {
            await adminCreateContractPayments({
              contractId,
              bookingRequestId,
              totalInstallments,
              installments: cleanedInstallments,
            });
          } catch (e) {
            console.error("Create payments error:", e);
            message.open({
              type: "error",
              content:
                "Đã tạo booking, nhưng tạo lịch thanh toán thất bại. Vui lòng kiểm tra lại trong mục Hợp đồng.",
              icon: <XCircle size={18} className="text-red-500" />,
            });
          }
        }
      }

      message.success("Tạo booking request thành công");
      navigate("/admin/management-booking-campaigns");
    } catch (err) {
      const beMsg =
        err?.response?.data?.message?.[0] ||
        (Array.isArray(err?.message) ? err.message[0] : err?.message) ||
        "";

      const is409 = err?.response?.status === 409 || err?.appStatus === 409;

      if (is409) {
        message.open({
          type: "error",
          content:
            beMsg || "Campaign này đã có Booking Request, không thể tạo thêm.",
          icon: <XCircle size={18} className="text-red-500" />,
        });
      } else {
        message.open({
          type: "error",
          content: beMsg || "Tạo booking thất bại",
          icon: <XCircle size={18} className="text-red-500" />,
        });
      }
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
                Gửi yêu cầu booking từ Campaign, sinh hợp đồng và cấu hình thanh
                toán.
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
                  rules={[
                    { required: true, message: "Bắt buộc" },
                    () => ({
                      validator(_, value) {
                        if (!value) return Promise.resolve();
                        if (
                          dayjs(value).isBefore(dayjs().startOf("day"), "day")
                        ) {
                          return Promise.reject(
                            new Error("Ngày bắt đầu phải từ hôm nay trở đi.")
                          );
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    className="w-full"
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    placeholder="Chọn ngày giờ bắt đầu"
                    disabledDate={disabledStartDate}
                  />
                </Form.Item>
              </Col>

              {/* RepeatUntil */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="Lặp đến ngày (repeatUntil)"
                  name="repeatUntil"
                  rules={[
                    { required: true, message: "Bắt buộc" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value) return Promise.resolve();
                        const startAt = getFieldValue("startAt");
                        if (!startAt) return Promise.resolve();
                        const startDate = dayjs(startAt).startOf("day");
                        const endDate = dayjs(value).startOf("day");
                        if (endDate.isAfter(startDate)) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Ngày kết thúc phải sau ngày bắt đầu.")
                        );
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    className="w-full"
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày kết thúc lặp"
                    disabledDate={disabledRepeatUntilDate}
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
                    const formatted = formatNumberWithCommas(limited);
                    // validate lại tổng installments khi đổi giá trị hợp đồng
                    setTimeout(() => {
                      form
                        .validateFields(["installments", "__sumGuard"])
                        .catch(() => {});
                    }, 0);
                    return formatted;
                  }}
                  rules={[
                    { required: true, message: "Bắt buộc" },
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

            {/* Payment schedule */}
            <div className="mt-6 border-t pt-4">
              <h2 className="text-base font-semibold mb-2">
                Cấu hình thanh toán hợp đồng
              </h2>

              {/* Thông báo mismatch hiện ngay tại section */}
              {sumState.sumMismatch && (
                <Alert
                  type="error"
                  showIcon
                  className="mb-3"
                  message="Tổng số tiền các đợt thanh toán phải bằng Giá trị hợp đồng."
                  description={
                    sumState.contractAmount
                      ? `Tổng đợt hiện tại: ${formatNumberWithCommas(
                          sumState.sumInstallments
                        )} / Giá trị hợp đồng: ${formatNumberWithCommas(
                          sumState.contractAmount
                        )}`
                      : undefined
                  }
                />
              )}

              {/* Guard validator ẩn: chặn submit khi mismatch */}
              <Form.Item
                name="__sumGuard"
                style={{ display: "none" }}
                dependencies={["installments", "contractAmount"]}
                rules={[
                  () => ({
                    validator() {
                      if (sumState.sumMismatch) {
                        return Promise.reject(
                          new Error(
                            "Tổng số tiền các đợt thanh toán phải bằng Giá trị hợp đồng."
                          )
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input style={{ display: "none" }} />
              </Form.Item>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Số lần thanh toán (1 - 5)"
                    name="totalInstallments"
                    tooltip="Nhập hoặc chọn, tự sinh số đợt phía dưới"
                    rules={[
                      { required: true, message: "Bắt buộc" },
                      {
                        validator: (_, v) => {
                          if (v === undefined || v === null || v === "") {
                            // rule required sẽ xử lý
                            return Promise.resolve();
                          }
                          const n = Number(v);
                          if (!Number.isFinite(n)) {
                            return Promise.reject(
                              new Error("Giá trị không hợp lệ")
                            );
                          }
                          if (n < 1 || n > 5) {
                            return Promise.reject(
                              new Error("Chỉ được tối đa thanh toán 5 đợt")
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={5}
                      step={1}
                      precision={0}
                      className="w-full"
                      placeholder="Chọn số lần thanh toán"
                      onChange={handleTotalInstallmentsChange}
                      onKeyDown={handleTotalInstallmentsKeyDown}
                      onPaste={handleTotalInstallmentsPaste}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.List name="installments">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <Row key={field.key} gutter={[8, 8]} align="middle">
                        <Col xs={24} md={8}>
                          <Form.Item
                            {...field}
                            name={[field.name, "amount"]}
                            fieldKey={[field.fieldKey, "amount"]}
                            label={index === 0 ? "Số tiền đợt thanh toán" : ""}
                            tooltip="Tự format, tối đa 13 chữ số"
                            getValueFromEvent={(e) => {
                              const input = e?.target?.value || "";
                              const digits = input.replace(/\D/g, "");
                              if (digits.length > 13) {
                                message.open({
                                  type: "warning",
                                  content: "Chỉ có thể nhập tối đa 13 chữ số",
                                  key: `instAmountMaxDigits_${field.key}`,
                                });
                              }
                              const limited = digits.slice(0, 13);
                              const formatted = formatNumberWithCommas(limited);
                              // validate lại tổng khi sửa từng đợt
                              setTimeout(() => {
                                form
                                  .validateFields([
                                    "installments",
                                    "__sumGuard",
                                  ])
                                  .catch(() => {});
                              }, 0);
                              return formatted;
                            }}
                            rules={[
                              { required: true, message: "Bắt buộc" },
                              {
                                validator: (_, v) => {
                                  if (!v || String(v).trim() === "") {
                                    // required rule xử lý case rỗng
                                    return Promise.resolve();
                                  }
                                  const raw = String(v)
                                    .replace(/,/g, "")
                                    .trim();
                                  if (!/^\d+$/.test(raw)) {
                                    return Promise.reject(
                                      new Error("Số tiền không hợp lệ")
                                    );
                                  }
                                  if (raw.length > 13) {
                                    return Promise.reject(
                                      new Error(
                                        "Chỉ có thể nhập tối đa 13 chữ số"
                                      )
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

                        <Col xs={24} md={8}>
                          <Form.Item
                            {...field}
                            name={[field.name, "dueDate"]}
                            fieldKey={[field.fieldKey, "dueDate"]}
                            label={
                              index === 0 ? "Hạn thanh toán (dueDate)" : ""
                            }
                            rules={[{ required: true, message: "Bắt buộc" }]}
                          >
                            <DatePicker
                              className="w-full"
                              format="DD/MM/YYYY"
                              placeholder="Chọn hạn thanh toán"
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={4}>
                          <Button
                            danger
                            type="link"
                            onClick={() => {
                              remove(field.name);
                              setTimeout(() => {
                                form
                                  .validateFields([
                                    "installments",
                                    "__sumGuard",
                                  ])
                                  .catch(() => {});
                              }, 0);
                            }}
                          >
                            Xóa
                          </Button>
                        </Col>
                      </Row>
                    ))}

                    {fields.length < 5 && (
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => {
                            const current =
                              form.getFieldValue("installments") || [];
                            if (current.length >= 5) {
                              message.open({
                                type: "warning",
                                content: "Chỉ được tối đa thanh toán 5 đợt",
                              });
                              return;
                            }
                            add();
                            form.setFieldsValue({
                              totalInstallments: (current.length || 0) + 1,
                            });
                            setTimeout(() => {
                              form
                                .validateFields(["installments", "__sumGuard"])
                                .catch(() => {});
                            }, 0);
                          }}
                          block
                        >
                          Thêm đợt thanh toán
                        </Button>
                      </Form.Item>
                    )}

                    {fields.length >= 5 && (
                      <div className="text-[12px] text-red-500 mt-1">
                        Chỉ được tối đa thanh toán 5 đợt.
                      </div>
                    )}
                  </>
                )}
              </Form.List>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center gap-3">
              <Button
                htmlType="submit"
                type="link"
                className="!h-10 !w-10 !p-0 !rounded-xl !text-white !border-none flex items-center justify-center"
                style={{ backgroundColor: "#10B981" }}
                title={
                  disableSave
                    ? "Tổng các đợt ≠ Giá trị hợp đồng — vui lòng điều chỉnh"
                    : "Lưu booking & thanh toán"
                }
                disabled={disableSave}
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
