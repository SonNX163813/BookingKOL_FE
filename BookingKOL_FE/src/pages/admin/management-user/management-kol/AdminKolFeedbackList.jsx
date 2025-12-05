// src/pages/admin/management-user/management-kol/AdminKolFeedbackList.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Table, Rate, Tag, Tooltip, Button, Pagination, Empty } from "antd";
import { ArrowLeft, MessageCircleMore, User2, Eye, EyeOff } from "lucide-react";
import dayjs from "dayjs";
import {
  adminGetFeedbacksByKol,
  adminHideFeedback,
  adminShowFeedback,
} from "../../../../services/admin/AdminFeedbackAPI";
import { toast } from "react-toastify";

const AdminKolFeedbackList = () => {
  const { kolId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // kolName được truyền từ ManagementKOL qua navigate state
  const kolNameFromState = location.state?.kolName;
  const kolLabel = kolNameFromState || kolId;

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [minRating, setMinRating] = useState(null);

  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [totalElements, setTotalElements] = useState(0);

  // row đang toggle ẩn/hiện
  const [toggleLoadingId, setToggleLoadingId] = useState(null);

  const loadData = async ({ signal } = {}) => {
    if (!kolId) return;
    const res = await adminGetFeedbacksByKol(kolId, {
      signal,
      params: {
        page,
        size,
        minRating: minRating || undefined,
      },
    });

    const list = res?.content ?? res?.data?.content ?? [];
    setFeedbacks(list);
    setTotalElements(
      typeof res?.totalElements === "number"
        ? res.totalElements
        : res?.data?.totalElements ?? 0
    );
  };

  useEffect(() => {
    if (!kolId) return;
    const abortCtrl = new AbortController();

    (async () => {
      try {
        setLoading(true);
        await loadData({ signal: abortCtrl.signal });
      } catch (e) {
        console.error("Load feedbacks error", e);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      abortCtrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kolId, page, size, minRating]);

  const dataSource = useMemo(() => feedbacks || [], [feedbacks]);

  const handleToggleVisibility = async (record) => {
    const id = record?.id;
    if (!id || toggleLoadingId) return;

    try {
      setToggleLoadingId(id);
      if (record.isPublic) {
        await adminHideFeedback(id);
        toast.success("Đã ẩn đánh giá này.");
      } else {
        await adminShowFeedback(id);
        toast.success("Đã hiển thị đánh giá này.");
      }

      // Cập nhật state local cho mượt
      setFeedbacks((prev) =>
        (prev || []).map((fb) =>
          fb.id === id ? { ...fb, isPublic: !record.isPublic } : fb
        )
      );
    } catch (e) {
      console.error("Toggle visibility error", e);
      toast.error("Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setToggleLoadingId(null);
    }
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 70,
      render: (_text, _record, index) => (
        <div className="font-bold">#{page * size + index + 1}</div>
      ),
    },
    {
      title: "Người đánh giá",
      key: "reviewer",
      width: 220,
      render: (record) => {
        const name = record?.reviewerUserName || "Khách hàng";
        return (
          <div className="flex items-center gap-2">
            <User2 size={16} />
            <span className="font-semibold">{name}</span>
          </div>
        );
      },
    },
    {
      // Điểm trung bình
      title: "Điểm trung bình",
      key: "overallRating",
      width: 190,
      render: (record) => {
        const value = Number(record?.overallRating || 0);
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Rate disabled value={value} allowHalf />
              <span className="text-sm font-medium">{value.toFixed(1)}/5</span>
            </div>
          </div>
        );
      },
    },
    {
      // Độ chuyên nghiệp, Khả năng giao tiếp, Tuân thủ thời gian, Chất lượng nội dung
      title: "Chi tiết đánh giá",
      key: "detailRatings",
      width: 260,
      render: (record) => {
        const rows = [
          {
            label: "Độ chuyên nghiệp",
            value: record?.professionalismRating,
          },
          {
            label: "Khả năng giao tiếp",
            value: record?.communicationRating,
          },
          {
            label: "Tuân thủ thời gian",
            value: record?.timelineRating,
          },
          {
            label: "Chất lượng nội dung",
            value: record?.contentQualityRating,
          },
        ];

        return (
          <div className="flex flex-col gap-1 text-xs">
            {rows.map((r) => {
              const score = Number(r.value || 0);
              return (
                <div key={r.label} className="flex items-center gap-1">
                  <span className="text-gray-600 whitespace-nowrap">
                    {r.label}:
                  </span>
                  <span className="font-semibold">{score}/5</span>
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      // Nhận xét công khai
      title: "Nhận xét công khai",
      key: "commentPublic",
      dataIndex: "commentPublic",
      render: (commentPublic) => {
        const text =
          commentPublic && commentPublic.trim().length
            ? commentPublic
            : "(Không có bình luận)";
        return (
          <Tooltip title={text} placement="topLeft">
            <div className="line-clamp-2 max-w-[320px] text-sm">{text}</div>
          </Tooltip>
        );
      },
    },
    {
      // Hợp tác lại (wouldRehire) – ô nhỏ, chữ giữa cột
      title: "Hợp tác lại",
      key: "wouldRehire",
      width: 120,
      align: "center",
      render: (record) => {
        const yes = !!record?.wouldRehire;
        return (
          <Tag
            color={yes ? "green" : "default"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 8px",
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {yes ? "Có" : "Không"}
          </Tag>
        );
      },
    },
    {
      // Chế độ hiển thị: Công khai / Ẩn (click để gọi hide/show)
      title: "Chế độ hiển thị",
      key: "isPublic",
      width: 150,
      render: (record) => {
        const isPublic = !!record?.isPublic;
        const busy = toggleLoadingId === record.id;

        return (
          <Tooltip
            title={
              isPublic
                ? "Nhấn để ẩn đánh giá này"
                : "Nhấn để hiển thị đánh giá này"
            }
          >
            <Tag
              color={isPublic ? "blue" : "red"}
              onClick={() => !busy && handleToggleVisibility(record)}
              className={`flex items-center gap-1 cursor-pointer ${
                busy ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              {isPublic ? (
                <>
                  <Eye size={14} /> Công khai
                </>
              ) : (
                <>
                  <EyeOff size={14} /> Ẩn
                </>
              )}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      // Ngày tạo / Ngày cập nhật
      title: "Thời gian",
      key: "createdAt",
      width: 190,
      render: (record) => {
        const created = record?.createdAt;
        const updated = record?.updatedAt;

        const fmt = (d) =>
          d && dayjs(d).isValid() ? dayjs(d).format("HH:mm DD/MM/YYYY") : "--";

        return (
          <div className="flex flex-col text-xs">
            <span>Ngày tạo: {fmt(created)}</span>
            <span className="text-gray-500">
              Ngày cập nhật: {updated ? fmt(updated) : "--"}
            </span>
          </div>
        );
      },
    },
  ];

  const handlePaginationChange = (pageNumber, pageSizeNumber) => {
    const nextPage = pageNumber - 1;
    if (nextPage !== page) setPage(nextPage);
    if (pageSizeNumber !== size) setSize(pageSizeNumber);
  };

  const handlePageSizeChange = (_currentPage, pageSizeNumber) => {
    if (page !== 0) setPage(0);
    if (pageSizeNumber !== size) setSize(pageSizeNumber);
  };

  return (
    <div className="relative h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Button
            type="text"
            onClick={() => navigate(-1)}
            className="!p-0 flex items-center"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-[18px] font-bold flex items-center gap-2">
              <MessageCircleMore size={20} />
              Đánh giá KOL
            </h1>
            <p className="text-[13px] text-gray-500">
              Danh sách phản hồi từ khách hàng cho KOL:{" "}
              <span className="font-semibold">{kolLabel}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Lọc theo điểm trung bình:
          </span>
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={minRating ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setMinRating(v === "" ? null : Number(v));
              setPage(0);
            }}
          >
            <option value="">Tất cả</option>
            <option value={1}>Từ 1 sao</option>
            <option value={2}>Từ 2 sao</option>
            <option value={3}>Từ 3 sao</option>
            <option value={4}>Từ 4 sao</option>
            <option value={5}>Chỉ 5 sao</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey={(record) => record.id}
        loading={loading}
        pagination={false}
        scroll={{ x: 1300 }}
        locale={{
          emptyText: <Empty description="Chưa có phản hồi nào cho KOL này" />,
        }}
      />

      {/* Pagination */}
      <div className="!my-4 py-5">
        <Pagination
          align="center"
          current={page + 1}
          total={totalElements}
          pageSize={size}
          pageSizeOptions={["5", "10", "20", "50"]}
          onChange={handlePaginationChange}
          onShowSizeChange={handlePageSizeChange}
          showSizeChanger
        />
      </div>
    </div>
  );
};

export default AdminKolFeedbackList;
