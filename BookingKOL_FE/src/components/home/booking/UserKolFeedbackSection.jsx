import { useCallback, useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import dayjs from "dayjs";
import {
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Rate,
  Space,
  Spin,
  Switch,
  Typography,
  message,
  Row,
  Col,
} from "antd";
import { MessageCircle, Pencil } from "lucide-react";
import {
  createKolFeedback,
  getKolFeedbackDetail,
  updateKolFeedback,
} from "../../../services/user/UserService";

const { Text } = Typography;
const { TextArea } = Input;

const DEFAULT_FORM_VALUES = {
  professionalismRating: 5,
  communicationRating: 5,
  timelineRating: 5,
  contentQualityRating: 5,
  wouldRehire: true,
  isPublic: true,
  commentPublic: "",
  commentPrivate: "",
};

const parseRating = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
};

const normalizeFeedback = (raw) => {
  if (!raw) return null;

  const professionalismRating =
    parseRating(raw?.professionalismRating) ??
    parseRating(raw?.professionalismScore) ??
    parseRating(raw?.professionalism) ??
    null;
  const communicationRating =
    parseRating(raw?.communicationRating) ??
    parseRating(raw?.communicationScore) ??
    parseRating(raw?.communication) ??
    null;
  const timelineRating =
    parseRating(raw?.timelineRating) ??
    parseRating(raw?.timelineScore) ??
    parseRating(raw?.timelinessRating) ??
    parseRating(raw?.timeline) ??
    null;
  const contentQualityRating =
    parseRating(raw?.contentQualityRating) ??
    parseRating(raw?.contentQualityScore) ??
    parseRating(raw?.contentQuality) ??
    null;

  const ratingCandidates = [
    parseRating(raw?.overallRating),
    parseRating(raw?.rating),
    parseRating(raw?.score),
    parseRating(raw?.star),
    parseRating(raw?.ratingValue),
    parseRating(raw?.ratingScore),
  ].filter((value) => Number.isFinite(value));

  const metricValues = [
    professionalismRating,
    communicationRating,
    timelineRating,
    contentQualityRating,
  ].filter((value) => Number.isFinite(value) && value > 0);

  const computedAverage =
    metricValues.length > 0
      ? Number(
          (
            metricValues.reduce((sum, current) => sum + current, 0) /
            metricValues.length
          ).toFixed(2)
        )
      : null;

  const effectiveRating =
    metricValues.length > 0
      ? computedAverage
      : ratingCandidates.length > 0
      ? ratingCandidates[0]
      : null;

  const commentPublicValue =
    raw?.commentPublic ??
    raw?.publicComment ??
    raw?.comment ??
    raw?.content ??
    raw?.review ??
    raw?.feedback ??
    raw?.description ??
    "";

  const commentPrivateValue =
    raw?.commentPrivate ?? raw?.privateComment ?? raw?.internalNote ?? "";

  return {
    id:
      raw?.id ??
      raw?.feedbackId ??
      raw?.kolFeedbackId ??
      raw?.feedback?.id ??
      null,
    rating: Number.isFinite(Number(effectiveRating))
      ? Number(effectiveRating)
      : null,
    professionalismRating,
    communicationRating,
    timelineRating,
    contentQualityRating,
    commentPublic:
      typeof commentPublicValue === "string"
        ? commentPublicValue.trim()
        : String(commentPublicValue ?? ""),
    commentPrivate:
      typeof commentPrivateValue === "string"
        ? commentPrivateValue.trim()
        : String(commentPrivateValue ?? ""),
    wouldRehire:
      typeof raw?.wouldRehire === "boolean"
        ? raw.wouldRehire
        : Boolean(raw?.willRehire ?? raw?.wouldBookAgain ?? false),
    isPublic:
      typeof raw?.isPublic === "boolean"
        ? raw.isPublic
        : Boolean(raw?.public ?? raw?.sharePublicly ?? true),
    createdAt:
      raw?.createdAt ??
      raw?.createdDate ??
      raw?.createdTime ??
      raw?.createdOn ??
      null,
    updatedAt:
      raw?.updatedAt ??
      raw?.updatedDate ??
      raw?.modifiedAt ??
      raw?.lastModifiedAt ??
      null,
    raw,
  };
};

const extractFeedbackFromContract = (contract) => {
  if (!contract) return null;

  const candidates = [
    contract?.feedback,
    contract?.kolFeedback,
    contract?.feedbackDTO,
    contract?.kolFeedbackDTO,
    contract?.feedbackDetail,
    contract?.feedbackInfos,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeFeedback(candidate);
    if (normalized) return normalized;
  }

  if (contract?.feedbackId || contract?.kolFeedbackId) {
    return {
      id: contract.feedbackId ?? contract.kolFeedbackId,
      rating: null,
      commentPublic: "",
      commentPrivate: "",
    };
  }

  return null;
};

const extractFeedbackFromSources = (contract, fallback) => {
  const fromContract = extractFeedbackFromContract(contract);
  if (fromContract) return fromContract;
  return normalizeFeedback(fallback);
};

const buildErrorMessage = (error) => {
  // if (!error) return "Có lỗi xảy ra. Vui lòng thử lại sau.";
  // const responseMessage =
  //   error?.response?.data?.message ??
  //   error?.response?.data?.error ??
  //   error?.response?.data?.errors?.[0] ??
  //   null;
  // if (responseMessage) return responseMessage;
  // return error?.message ?? "Có lỗi xảy ra. Vui lòng thử lại sau.";
};

const formatDateTime = (value) => {
  if (!value) return null;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return null;
  return parsed.format("DD/MM/YYYY HH:mm");
};

const UserKolFeedbackSection = ({
  contract,
  kol,
  onFeedbackUpdated,
  disabled = false,
  initialFeedback = null,
}) => {
  const [form] = Form.useForm();
  const normalizedInitialFeedback = useMemo(
    () => normalizeFeedback(initialFeedback),
    [initialFeedback]
  );
  const fallbackFeedback = normalizedInitialFeedback ?? initialFeedback ?? null;
  const [feedback, setFeedback] = useState(() =>
    extractFeedbackFromSources(contract, fallbackFeedback)
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const feedbackRef = useRef(feedback);
  const isMountedRef = useRef(true);

  useEffect(() => {
    feedbackRef.current = feedback;
  }, [feedback]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const contractId = useMemo(() => {
    if (!contract) return null;
    return contract.id ?? contract.contractId ?? contract?.contract?.id ?? null;
  }, [contract]);

  const feedbackId = useMemo(() => {
    if (feedback?.id) return feedback.id;
    if (normalizedInitialFeedback?.id) return normalizedInitialFeedback.id;
    if (!contract) return null;
    return (
      contract?.feedbackId ??
      contract?.kolFeedbackId ??
      contract?.feedback?.id ??
      contract?.kolFeedback?.id ??
      contract?.feedbackDTO?.id ??
      contract?.kolFeedbackDTO?.id ??
      null
    );
  }, [contract, feedback, normalizedInitialFeedback]);

  useEffect(() => {
    const extracted = extractFeedbackFromSources(contract, fallbackFeedback);
    setFeedback(extracted);
    feedbackRef.current = extracted;
  }, [contract, fallbackFeedback]);

  const fetchFeedbackDetail = useCallback(
    async ({ force = false, signal } = {}) => {
      if (!feedbackId) return null;

      const cachedFeedback = feedbackRef.current;

      if (
        !force &&
        cachedFeedback &&
        (cachedFeedback.commentPublic ||
          Number.isFinite(Number(cachedFeedback.professionalismRating)) ||
          Number.isFinite(Number(cachedFeedback.communicationRating)) ||
          Number.isFinite(Number(cachedFeedback.timelineRating)) ||
          Number.isFinite(Number(cachedFeedback.contentQualityRating)))
      ) {
        return cachedFeedback;
      }

      if (isMountedRef.current) {
        setIsFetchingDetail(true);
      }
      try {
        const response = await getKolFeedbackDetail({
          feedbackId,
          signal,
        });
        const normalized = normalizeFeedback(response?.data ?? response);
        if (isMountedRef.current && normalized) {
          setFeedback(normalized);
          feedbackRef.current = normalized;
        }
        return normalized;
      } catch (error) {
        if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
          return null;
        }
        console.error("Không thể tải chi tiết đánh giá", error);
        if (isMountedRef.current) {
          message.error(buildErrorMessage(error));
        }
        return null;
      } finally {
        if (isMountedRef.current) {
          setIsFetchingDetail(false);
        }
      }
    },
    [feedbackId]
  );

  useEffect(() => {
    if (!feedbackId) return;

    const controller = new AbortController();
    fetchFeedbackDetail({ force: true, signal: controller.signal }).catch(
      () => {}
    );

    return () => {
      controller.abort();
    };
  }, [feedbackId, fetchFeedbackDetail]);

  const handleOpenModal = useCallback(async () => {
    if (!contractId || disabled) return;

    const detail = await fetchFeedbackDetail({ force: true });
    const currentValues = detail ?? feedback ?? null;

    form.setFieldsValue({
      professionalismRating:
        currentValues?.professionalismRating ??
        DEFAULT_FORM_VALUES.professionalismRating,
      communicationRating:
        currentValues?.communicationRating ??
        DEFAULT_FORM_VALUES.communicationRating,
      timelineRating:
        currentValues?.timelineRating ?? DEFAULT_FORM_VALUES.timelineRating,
      contentQualityRating:
        currentValues?.contentQualityRating ??
        DEFAULT_FORM_VALUES.contentQualityRating,
      wouldRehire:
        typeof currentValues?.wouldRehire === "boolean"
          ? currentValues.wouldRehire
          : DEFAULT_FORM_VALUES.wouldRehire,
      isPublic:
        typeof currentValues?.isPublic === "boolean"
          ? currentValues.isPublic
          : DEFAULT_FORM_VALUES.isPublic,
      commentPublic: currentValues?.commentPublic ?? "",
      commentPrivate: currentValues?.commentPrivate ?? "",
    });
    setIsModalOpen(true);
  }, [contractId, disabled, fetchFeedbackDetail, feedback, form]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    form.resetFields();
  }, [form]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        professionalismRating: values.professionalismRating,
        communicationRating: values.communicationRating,
        timelineRating: values.timelineRating,
        contentQualityRating: values.contentQualityRating,
        wouldRehire: Boolean(values.wouldRehire),
        isPublic: Boolean(values.isPublic),
        commentPublic: values.commentPublic?.trim() ?? "",
        commentPrivate: values.commentPrivate?.trim() ?? "",
      };

      if (!contractId) {
        message.error("Không tìm thấy thông tin hợp đồng để gửi đánh giá.");
        return;
      }

      setIsSubmitting(true);

      let result = null;
      if (feedbackId) {
        result = await updateKolFeedback({
          feedbackId,
          data: payload,
        });
        message.success("Cập nhật đánh giá KOL thành công.");
      } else {
        result = await createKolFeedback({
          contractId,
          data: payload,
        });
        message.success("Gửi đánh giá KOL thành công.");
      }

      const normalized = normalizeFeedback(result?.data ?? result);
      setFeedback(normalized);
      feedbackRef.current = normalized;
      setIsModalOpen(false);
      form.resetFields();

      if (typeof onFeedbackUpdated === "function") {
        onFeedbackUpdated(normalized);
      }
    } catch (error) {
      if (error?.errorFields) return;
      console.error("Gửi đánh giá thất bại", error);
      message.error(buildErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [contractId, feedbackId, form, onFeedbackUpdated]);

  const kolLabel = useMemo(() => {
    if (!kol) return "KOL";
    return (
      kol?.displayName ?? kol?.fullName ?? kol?.name ?? kol?.kolName ?? "KOL"
    );
  }, [kol]);

  const hasFeedback = Boolean(feedbackId);
  const isFeedbackUpdated = Boolean(feedback?.updatedAt);
  const isUpdateActionAvailable = hasFeedback && !isFeedbackUpdated;
  const shouldShowActionButton = !hasFeedback || isUpdateActionAvailable;

  const renderFeedbackSummary = () => {
    if (isFetchingDetail) {
      return (
        <div className="flex items-center gap-2 text-slate-500">
          <Spin size="small" />
          <span>Đang tải đánh giá...</span>
        </div>
      );
    }

    const hasAnyDetails =
      feedback &&
      (Number.isFinite(Number(feedback.rating)) ||
        Number.isFinite(Number(feedback.professionalismRating)) ||
        Number.isFinite(Number(feedback.communicationRating)) ||
        Number.isFinite(Number(feedback.timelineRating)) ||
        Number.isFinite(Number(feedback.contentQualityRating)) ||
        Boolean(feedback.commentPublic) ||
        Boolean(feedback.commentPrivate));

    if (!hasAnyDetails) {
      return (
        <Text type="secondary">
          Bạn chưa gửi đánh giá cho {kolLabel}. Hãy chia sẻ trải nghiệm của bạn.
        </Text>
      );
    }

    const ratingRows = [
      {
        label: "Độ chuyên nghiệp",
        value: feedback.professionalismRating,
      },
      {
        label: "Khả năng giao tiếp",
        value: feedback.communicationRating,
      },
      {
        label: "Tuân thủ thời gian",
        value: feedback.timelineRating,
      },
      {
        label: "Chất lượng nội dung",
        value: feedback.contentQualityRating,
      },
    ];

    return (
      <Space direction="vertical" size={8} className="w-full">
        {Number.isFinite(Number(feedback.rating)) && (
          <Space size={8} align="center">
            <Text strong>Điểm trung bình:</Text>
            <Rate disabled value={Number(feedback.rating)} />
            <Text>{Number(feedback.rating).toFixed(1)}/5</Text>
          </Space>
        )}
        <Space direction="vertical" size={4}>
          {ratingRows.map((row) =>
            Number.isFinite(Number(row.value)) ? (
              <Space key={row.label} size={6}>
                <Text strong>{row.label}:</Text>
                <Rate disabled value={Number(row.value)} />
                <Text>{Number(row.value).toFixed(1)}/5</Text>
              </Space>
            ) : null
          )}
        </Space>
        {feedback.commentPublic && (
          <div>
            <Text strong>Nhận xét công khai:</Text>
            <Text style={{ display: "block", whiteSpace: "pre-wrap" }}>
              {feedback.commentPublic}
            </Text>
          </div>
        )}
        {feedback.commentPrivate && (
          <div>
            <Text strong>Ghi chú nội bộ:</Text>
            <Text style={{ display: "block", whiteSpace: "pre-wrap" }}>
              {feedback.commentPrivate}
            </Text>
          </div>
        )}
        <Space size={6}>
          <Text strong>Sẵn sàng hợp tác lại:</Text>
          <Text>{feedback.wouldRehire ? "Có" : "Không"}</Text>
        </Space>
        <Space size={6}>
          <Text strong>Chế độ hiển thị:</Text>
          <Text>{feedback.isPublic ? "Công khai" : "Riêng tư"}</Text>
        </Space>
        <Text type="secondary">
          Ngày tạo: {formatDateTime(feedback.createdAt) ?? "--"}
        </Text>
        {(feedback.updatedAt || feedback.createdAt) && (
          <Text type="secondary">
            Ngày cập nhật: {formatDateTime(feedback.updatedAt) ?? "--"}
          </Text>
        )}
      </Space>
    );
  };

  return (
    <div className="mt-5 rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
      <Space align="center" size={8}>
        <MessageCircle size={18} className="text-slate-600" />
        <Text className="text-base font-semibold text-slate-800">
          Đánh giá KOL
        </Text>
      </Space>

      <div className="mt-3">{renderFeedbackSummary()}</div>

      {shouldShowActionButton && (
        <Button
          className="mt-4"
          type={isUpdateActionAvailable ? "default" : "primary"}
          icon={
            isUpdateActionAvailable ? (
              <Pencil size={16} />
            ) : (
              <MessageCircle size={16} />
            )
          }
          onClick={handleOpenModal}
          disabled={!contractId || disabled}
        >
          {isUpdateActionAvailable ? "Cập nhật đánh giá" : "Đánh giá ngay"}
        </Button>
      )}

      <Modal
        centered
        open={isModalOpen}
        title="Đánh giá KOL"
        okText={feedbackId ? "Cập nhật" : "Gửi đánh giá"}
        cancelText="Hủy"
        onCancel={handleCloseModal}
        onOk={handleSubmit}
        confirmLoading={isSubmitting}
        destroyOnClose
        width={900}
        styles={{
          content: {
            borderRadius: 20,
            overflow: "hidden",
          },
        }}
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={DEFAULT_FORM_VALUES}
          disabled={isSubmitting}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr", // 🔹 2 cột cân đối
              gap: "24px",
            }}
          >
            {/* -------------------- CỘT TRÁI -------------------- */}
            <div style={{ padding: "8px 16px" }}>
              {/* --- ĐIỂM CHI TIẾT --- */}
              <Divider orientation="left">Điểm chi tiết</Divider>
              <Row gutter={[24, 12]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="professionalismRating"
                    label="Độ chuyên nghiệp"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng đánh giá độ chuyên nghiệp.",
                      },
                    ]}
                  >
                    <Rate allowHalf={false} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="communicationRating"
                    label="Khả năng giao tiếp"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng đánh giá khả năng giao tiếp.",
                      },
                    ]}
                  >
                    <Rate allowHalf={false} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="timelineRating"
                    label="Tuân thủ thời gian"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng đánh giá mức độ tuân thủ thời gian.",
                      },
                    ]}
                  >
                    <Rate allowHalf={false} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="contentQualityRating"
                    label="Chất lượng nội dung"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng đánh giá chất lượng nội dung.",
                      },
                    ]}
                  >
                    <Rate allowHalf={false} />
                  </Form.Item>
                </Col>
              </Row>

              {/* --- TÙY CHỌN --- */}
              <Divider orientation="left">Tùy chọn</Divider>
              <Row gutter={[24, 12]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="wouldRehire"
                    label="Bạn có muốn hợp tác lại?"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Có" unCheckedChildren="Không" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="isPublic"
                    label="Chia sẻ đánh giá công khai"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="Công khai"
                      unCheckedChildren="Riêng tư"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* -------------------- CỘT PHẢI -------------------- */}
            <div>
              <Divider orientation="left">Nhận xét</Divider>
              <Form.Item
                name="commentPublic"
                label="Nhận xét công khai"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "Vui lòng chia sẻ trải nghiệm của bạn.",
                  },
                  { min: 10, message: "Vui lòng nhập ít nhất 10 ký tự." },
                ]}
              >
                <TextArea
                  rows={6}
                  placeholder={`Chia sẻ trải nghiệm của bạn với ${kolLabel}`}
                  maxLength={1000}
                  showCount
                />
              </Form.Item>

              <Form.Item
                name="commentPrivate"
                label="Ghi chú nội bộ (không bắt buộc)"
              >
                <TextArea
                  rows={5}
                  placeholder="Ghi chú riêng tư cho đội của bạn (không hiển thị công khai)"
                  maxLength={1000}
                  showCount
                />
              </Form.Item>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default UserKolFeedbackSection;
