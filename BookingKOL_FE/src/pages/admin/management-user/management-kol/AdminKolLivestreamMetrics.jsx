// src/pages/admin/management-user/management-kol/AdminKolLivestreamMetrics.jsx

import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/vi";

import {
  Alert,
  Button,
  Card,
  Empty,
  Pagination,
  Skeleton,
  Space,
  Tag,
  Typography,
  Descriptions,
} from "antd";

import { ArrowLeft, BarChart3, RefreshCcw, CalendarRange } from "lucide-react";

import { adminGetKolLivestreamMetricsByKolId } from "../../../../services/admin/AdminLivestreamMetricAPI";

const { Title, Text } = Typography;

/* ========= Helpers ========= */

const fmtInt = (v) =>
  Number.isFinite(+v) ? Math.trunc(+v).toLocaleString("vi-VN") : "--";

const fmtVnd = (v) =>
  Number.isFinite(+v)
    ? (+v).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    : "--";

const fmtPct = (v) =>
  Number.isFinite(+v) ? `${(+v).toFixed(2).replace(/\.00$/, "")}%` : "--";

const formatDateTime = (v, p = "DD/MM/YYYY HH:mm") =>
  v ? dayjs(v).format(p) : "--";

const getHttpStatus = (e) =>
  e?.appStatus || e?.response?.status || e?.status || 0;
const isBadRequest = (e) => getHttpStatus(e) === 400;

/** Các field giống LivestreamMetricModal */
const ONE_MIN_FIELDS = [
  { key: "liveViewsOver1min", label: "Lượt xem live > 1 phút", fmt: fmtInt },
  { key: "commentsIn1min", label: "Bình luận trong 1 phút", fmt: fmtInt },
  { key: "addToCartIn1min", label: "Thêm vào giỏ trong 1 phút", fmt: fmtInt },
];

const SUMMARY_FIELDS = [
  { key: "revenue", label: "Tổng doanh thu (VNĐ)", fmt: fmtVnd },
  { key: "gpm", label: "GPM (VNĐ)", fmt: fmtVnd },
  {
    key: "avgOrderValue",
    label: "Giá trị TB mỗi đơn (VNĐ)",
    fmt: fmtVnd,
  },
  { key: "totalOrders", label: "Tổng số đơn hàng", fmt: fmtInt },
  { key: "totalViews", label: "Tổng lượt xem", fmt: fmtInt },
  { key: "viewsUnder1min", label: "Lượt xem < 1 phút", fmt: fmtInt },
  { key: "pcu", label: "PCU (đồng xem cao nhất)", fmt: fmtInt },
  {
    key: "avgViewDuration",
    label: "Thời gian xem trung bình (giây)",
    fmt: fmtInt,
  },
  { key: "totalComments", label: "Tổng bình luận", fmt: fmtInt },
  {
    key: "productClickRate",
    label: "Tỷ lệ click sản phẩm (%)",
    fmt: fmtPct,
  },
  {
    key: "orderConversionRate",
    label: "Tỷ lệ chuyển đổi đơn hàng (%)",
    fmt: fmtPct,
  },
  { key: "buyers", label: "Số người mua hàng", fmt: fmtInt },
  { key: "productsSold", label: "Tổng sản phẩm đã bán", fmt: fmtInt },
];

/**
 * Page: Admin xem danh sách Livestream Metrics của 1 KOL
 * Route: /admin/kols/:kolId/metrics
 * Nguồn: /admin/requests/worktime/livestream-metrics/kol/{kolId}
 */
export default function AdminKolLivestreamMetrics() {
  const { kolId } = useParams();
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin-kol-metrics", kolId, page, size],
    enabled: !!kolId,
    queryFn: () => adminGetKolLivestreamMetricsByKolId(kolId, { page, size }),
    retry: (count, err) => {
      if (isBadRequest(err)) return false;
      return count < 1;
    },
  });

  // Chuẩn hoá structure (tuỳ backend wrapper)
  const pageData = useMemo(() => data?.data || data || {}, [data]);

  const metrics = pageData.content || [];
  const totalElements = pageData.totalElements ?? metrics.length ?? 0;

  const kolInfo = useMemo(() => {
    const first = metrics?.[0];
    if (!first) return null;
    return (
      first.kol ||
      first.kolInfo || {
        displayName: first.kolDisplayName,
        fullName: first.kolFullName,
      }
    );
  }, [metrics]);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/admin/kols");
  };

  const handleRefresh = () => {
    refetch();
  };

  const onPageChange = (pageNumber, pageSizeNumber) => {
    const nextPage = pageNumber - 1;
    if (nextPage !== page) setPage(nextPage);
    if (pageSizeNumber !== size) setSize(pageSizeNumber);
  };

  const onPageSizeChange = (_cur, pageSizeNumber) => {
    if (page !== 0) setPage(0);
    if (pageSizeNumber !== size) setSize(pageSizeNumber);
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* ==== Header ==== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Space size="middle" wrap>
          <Button icon={<ArrowLeft size={16} />} onClick={handleBack}>
            Quay lại danh sách KOL
          </Button>

          <Button
            icon={<RefreshCcw size={16} />}
            onClick={handleRefresh}
            loading={isFetching}
          >
            Làm mới
          </Button>
        </Space>

        <div className="text-right">
          <Title
            level={4}
            className="!mb-1 flex items-center gap-2 justify-end"
          >
            <BarChart3 size={20} />
            <span>Chỉ số Livestream theo KOL</span>
          </Title>
          <Text type="secondary">
            KOL ID:&nbsp;<Text code>{kolId}</Text>
            {kolInfo?.displayName && (
              <>
                &nbsp;|&nbsp;Tên hiển thị:&nbsp;
                <Text strong>{kolInfo.displayName}</Text>
              </>
            )}
          </Text>
        </div>
      </div>

      {/* ==== Nội dung chính ==== */}
      <Card className="shadow-sm" bordered={false}>
        {error ? (
          isBadRequest(error) ? (
            <Empty description="Chưa có số liệu livestream cho KOL này." />
          ) : (
            <Alert
              type="error"
              showIcon
              message="Không tải được dữ liệu chỉ số livestream."
              description={String(error?.message || "")}
            />
          )
        ) : (
          <Skeleton loading={isLoading} active paragraph={{ rows: 6 }}>
            {!metrics || metrics.length === 0 ? (
              <Empty description="Chưa có số liệu livestream cho KOL này." />
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Tag color="blue">
                    Tổng bản ghi: {totalElements ?? metrics.length}
                  </Tag>
                </div>

                {/* Danh sách metrics: mỗi bản ghi là 1 card, đầy đủ field như modal */}
                <div className="flex flex-col gap-12">
                  {metrics.map((m, idx) => {
                    // cố gắng bắt thông tin thời gian/ca
                    const start =
                      m.worktimeStartAt || m.startAt || m.worktime?.startAt;
                    const end = m.worktimeEndAt || m.endAt || m.worktime?.endAt;

                    const requestNo =
                      m.requestNumber ||
                      m.bookingRequestNumber ||
                      m.requestId ||
                      "--";

                    return (
                      <Card
                        key={m.id || `${idx}-${requestNo}`}
                        className="shadow-sm border border-gray-100"
                        title={
                          <Space direction="vertical" size={2}>
                            <Space size="middle">
                              <Tag color="purple">#{page * size + idx + 1}</Tag>
                              <Text strong>Mã yêu cầu:&nbsp;{requestNo}</Text>
                            </Space>
                            <Text type="secondary">
                              {start || end ? (
                                <>
                                  Ca livestream:&nbsp;
                                  <Text strong>
                                    {formatDateTime(start, "DD/MM/YYYY HH:mm")}
                                    {" - "}
                                    {formatDateTime(end, "HH:mm")}
                                  </Text>
                                </>
                              ) : (
                                "Ca livestream: --"
                              )}
                            </Text>
                          </Space>
                        }
                        extra={
                          <Space direction="vertical" size={2}>
                            <Text type="secondary">
                              Tạo:&nbsp;
                              {formatDateTime(m.createdAt || m.createdDate)}
                            </Text>
                            <Text type="secondary">
                              Cập nhật:&nbsp;
                              {formatDateTime(
                                m.updatedAt || m.lastModifiedDate
                              )}
                            </Text>
                          </Space>
                        }
                      >
                        {/* --- Số liệu trong 1 phút --- */}
                        <div className="mb-3">
                          <Text strong>Số liệu trong 1 phút</Text>
                        </div>
                        <Descriptions
                          bordered
                          size="small"
                          column={3}
                          labelStyle={{ width: 220 }}
                        >
                          {ONE_MIN_FIELDS.map(({ key, label, fmt }) => (
                            <Descriptions.Item key={key} label={label}>
                              {fmt(m[key])}
                            </Descriptions.Item>
                          ))}
                        </Descriptions>

                        {/* --- Tổng quan --- */}
                        <div className="mt-5 mb-3">
                          <Text strong>Tổng quan</Text>
                        </div>
                        <Descriptions
                          bordered
                          size="small"
                          column={3}
                          labelStyle={{ width: 260 }}
                        >
                          {SUMMARY_FIELDS.map(({ key, label, fmt }) => (
                            <Descriptions.Item key={key} label={label}>
                              {fmt(m[key])}
                            </Descriptions.Item>
                          ))}
                        </Descriptions>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </Skeleton>
        )}
      </Card>

      {/* ==== Phân trang ==== */}
      {totalElements > 0 && (
        <div className="!my-4 py-2 flex justify-center">
          <Pagination
            current={page + 1}
            total={totalElements}
            pageSize={size}
            pageSizeOptions={["5", "10", "20", "50"]}
            showSizeChanger
            onChange={onPageChange}
            onShowSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
}
