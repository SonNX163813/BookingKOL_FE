// src/pages/admin/management-user/management-kol/ManagementKOL.jsx

import {
  Search,
  Trash2,
  Eye,
  Pencil,
  Plus,
  CalendarRange,
  CalendarDays,
  CheckCircle2,
  BarChart3,
  Star,
} from "lucide-react";

import {
  Button,
  Form,
  Input,
  InputNumber,
  Pagination,
  Table,
  Tag,
  Tooltip,
  Image,
  Select,
} from "antd";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAllKol } from "../../../../hook/admin/management-user/useGetAllKol";
import {
  adminExportKolExcel,
  adminGetKolsByCategory,
} from "../../../../services/admin/AdminAPI";
import { getAllCategory } from "../../../../services/CategoryServices";
import imgdef from "../../../../assets/default.png";
import { VerifiedUserOutlined } from "@mui/icons-material";

const viNormalize = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

// ✅ yêu cầu:
// - tổng chữ số (nguyên + thập phân) tối đa = 13
// - thập phân tối đa = 2
// - không cho nhập ký tự đặc biệt
const MAX_TOTAL_DIGITS = 13;
const MAX_DEC_DIGITS = 2;

const analyzeDisplay = (displayStr) => {
  const raw = String(displayStr ?? "")
    .replace(/đ|vnđ/gi, "")
    .replace(/\s/g, "");

  const commaCount = (raw.match(/,/g) || []).length;
  const [left = "", right = ""] = raw.split(",", 2);

  const intDigits = left.replace(/\D/g, "");
  const decDigits = right.replace(/\D/g, "");

  return { commaCount, intDigits, decDigits };
};

const ManagementKOL = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [form] = Form.useForm();

  const [searchValue, setSearchValue] = useState();
  const [searchMinBookingPrice, setSearchMinBookingPrice] = useState();
  const [minRating, setMinRating] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // ✅ helper text dưới ô minBookingPrice
  const [minPriceExtra, setMinPriceExtra] = useState("");

  // ✅ helper text dưới ô search (max 100 ký tự, không show 0/100)
  const [searchExtra, setSearchExtra] = useState("");

  // Category
  const [categoryId, setCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const { isLoadingGetALlKol, ResponseGetAllKol, refetchGetAllKol } =
    useGetAllKol(page, size, searchMinBookingPrice, minRating, searchValue);

  const totalElements = ResponseGetAllKol?.data?.totalElements ?? 0;

  useEffect(() => {
    refetchGetAllKol();
  }, [
    page,
    size,
    searchMinBookingPrice,
    minRating,
    searchValue,
    refetchGetAllKol,
  ]);

  // Dữ liệu khi lọc theo category
  const [loadingByCategory, setLoadingByCategory] = useState(false);
  const [listByCategory, setListByCategory] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingCategories(true);
        const res = await getAllCategory();
        if (!mounted) return;
        const opts =
          res?.data?.map((c) => ({ label: c?.name, value: c?.id })) ?? [];
        setCategories(opts);
      } finally {
        setLoadingCategories(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!categoryId) {
      setListByCategory(null);
      return;
    }
    (async () => {
      try {
        setLoadingByCategory(true);
        const list = await adminGetKolsByCategory(categoryId, { page, size });
        if (!mounted) return;
        setListByCategory(list || []);
      } finally {
        if (mounted) setLoadingByCategory(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, page, size]);

  const rawList = useMemo(() => {
    if (categoryId) return listByCategory ?? [];
    return ResponseGetAllKol?.data?.content ?? [];
  }, [categoryId, listByCategory, ResponseGetAllKol]);

  const filteredData = useMemo(() => {
    const needle = viNormalize(searchValue);
    const minPrice = Number(searchMinBookingPrice || 0);
    const star = Number(minRating || 0);

    return (rawList || []).filter((it) => {
      const okName = needle
        ? viNormalize(it?.displayName).includes(needle)
        : true;
      const okPrice = minPrice
        ? Number(it?.minBookingPrice || 0) >= minPrice
        : true;
      const okRating = star ? Number(it?.overallRating || 0) >= star : true;
      return okName && okPrice && okRating;
    });
  }, [rawList, searchValue, searchMinBookingPrice, minRating]);

  const handleEdit = (record) => {
    navigate(`/admin/kols/${record.id}/edit`, { state: { kol: record } });
  };

  const handleViewDetail = (record) => {
    navigate(`/admin/kols/${record.id}/portfolio`);
  };

  const handleCreateKol = () => {
    navigate("/admin/kols/create");
  };

  const handleExportKol = async () => {
    try {
      setIsExporting(true);
      const blob = await adminExportKolExcel();
      if (!blob) return;

      const downloadUrl = URL.createObjectURL(
        blob instanceof Blob ? blob : new Blob([blob])
      );
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", "kols.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Failed to export KOL excel", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenSchedule = (record) => {
    navigate(`/admin/kols/${record?.id}/schedule?view=month`);
  };

  const handleOpenBookingHistory = (record) => {
    navigate(`/admin/kols/${record?.id}/bookings`);
  };

  const handleOpenMetrics = (record) => {
    navigate(`/admin/kols/${record?.id}/metrics`);
  };

  const handleOpenReviews = (record) => {
    if (!record?.id) return;
    navigate(`/admin/feedbacks/kol/${record.id}`, {
      state: { kolName: record.displayName },
    });
  };

  const handleSearch = (values) => {
    const vSearch = values?.search?.trim() || undefined;

    const raw = values?.minBookingPrice;
    const num =
      raw !== undefined && raw !== null && raw !== ""
        ? Number(String(raw))
        : undefined;

    setSearchValue(vSearch);
    setSearchMinBookingPrice(Number.isFinite(num) ? num : undefined);
    setPage(0);
  };

  const resetForm = () => {
    form.resetFields();
    setMinPriceExtra("");
    setSearchExtra("");
    setSearchValue(undefined);
    setSearchMinBookingPrice(undefined);
    setMinRating(null);
    setCategoryId(null);
    setPage(0);
  };

  const handlePaginationChange = (pageNumber, pageSizeNumber) => {
    const nextPage = pageNumber - 1;
    if (nextPage !== page) setPage(nextPage);
    if (pageSizeNumber !== size) setSize(pageSizeNumber);
  };

  const handlePageSizeChange = (_currentPage, pageSizeNumber) => {
    if (page !== 0) setPage(0);
    if (pageSizeNumber !== size) setSize(pageSizeNumber);
  };

  // ✅ chặn nhập ký tự đặc biệt, + chặn vượt giới hạn digit
  const handleMinPriceKeyDown = (e) => {
    const allowKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Tab",
      "Home",
      "End",
      "Enter",
    ];
    if (allowKeys.includes(e.key)) return;

    if (
      (e.ctrlKey || e.metaKey) &&
      ["a", "c", "v", "x"].includes(e.key.toLowerCase())
    )
      return;

    const isDigit = /^[0-9]$/.test(e.key);
    const isComma = e.key === ",";

    if (!isDigit && !isComma) {
      e.preventDefault();
      return;
    }

    const input = e.currentTarget;
    const raw = String(input.value ?? "");
    const start = input.selectionStart ?? raw.length;
    const end = input.selectionEnd ?? raw.length;

    const next = raw.slice(0, start) + e.key + raw.slice(end);
    const { commaCount, intDigits, decDigits } = analyzeDisplay(next);

    if (commaCount > 1) {
      e.preventDefault();
      return;
    }

    if (isComma && intDigits.length === 0) {
      e.preventDefault();
      return;
    }

    if (decDigits.length > MAX_DEC_DIGITS) {
      e.preventDefault();
      return;
    }

    const totalDigits = intDigits.length + decDigits.length;

    if (totalDigits > MAX_TOTAL_DIGITS) {
      e.preventDefault();
      setMinPriceExtra("Tối đa 13 chữ số (bao gồm cả phần thập phân).");
      return;
    }

    if (totalDigits === MAX_TOTAL_DIGITS)
      setMinPriceExtra("Đã đạt tối đa 13 chữ số.");
    else setMinPriceExtra("");
  };

  const handleMinPricePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData?.getData("text") ?? "";

    const cleaned = String(text)
      .replace(/đ|vnđ/gi, "")
      .replace(/\s/g, "")
      .replace(/[^\d,]/g, "");

    const firstComma = cleaned.indexOf(",");
    let intPart = firstComma >= 0 ? cleaned.slice(0, firstComma) : cleaned;
    let decPart = firstComma >= 0 ? cleaned.slice(firstComma + 1) : "";

    intPart = intPart.replace(/\D/g, "");
    decPart = decPart.replace(/\D/g, "").slice(0, MAX_DEC_DIGITS);

    intPart = intPart.slice(0, MAX_TOTAL_DIGITS);
    const remain = Math.max(0, MAX_TOTAL_DIGITS - intPart.length);
    const decLimit = Math.min(MAX_DEC_DIGITS, remain);
    decPart = decPart.slice(0, decLimit);

    const canonical = decPart ? `${intPart}.${decPart}` : intPart;
    form.setFieldValue("minBookingPrice", canonical);

    const totalDigits = intPart.length + decPart.length;
    setMinPriceExtra(
      totalDigits === MAX_TOTAL_DIGITS ? "Đã đạt tối đa 13 chữ số." : ""
    );
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 80,
      render: (_, __, index) => (
        <div className="font-bold">#{page * size + index + 1}</div>
      ),
    },
    {
      title: "Ảnh",
      key: "fileUrl",
      dataIndex: "fileUsageDtos",
      width: 100,
      render: (fileUsageDtos) => {
        const imgUrl = fileUsageDtos?.[0]?.file?.fileUrl;
        return imgUrl ? (
          <Tooltip title="Xem ảnh">
            <Image
              src={imgUrl}
              alt="Ảnh"
              width={70}
              height={70}
              className="rounded-xl object-cover shadow-sm hover:shadow-md transition-all duration-200"
              preview={{ mask: "Phóng to" }}
            />
          </Tooltip>
        ) : (
          <img
            src={imgdef}
            alt="Ảnh mặc định"
            className="w-[70px] h-[70px] rounded-xl object-cover"
          />
        );
      },
    },
    {
      title: "Tên KOL",
      key: "displayName",
      dataIndex: "displayName",
      width: 400,
      render: (text) => (
        <div
          style={{
            maxWidth: 400,
            whiteSpace: "normal",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            lineHeight: 1.4,
          }}
        >
          {text || "N/A"}
        </div>
      ),
    },
    {
      title: "Chuyên mục",
      key: "categories",
      dataIndex: "categories",
      render: (categories = []) => (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Tag
              color="blue"
              key={cat.id}
              className="!h-8 !flex !items-center !mb-1"
            >
              {cat.name}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Giá booking tối thiểu",
      key: "minBookingPrice",
      dataIndex: "minBookingPrice",
      render: (price) =>
        typeof price === "number"
          ? price.toLocaleString("vi-VN") + " VNĐ"
          : "N/A",
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      width: 480,
      render: (record) => (
        <div className="w-full flex justify-center gap-2">
          <Tooltip title="Xem portfolio">
            <Button
              onClick={() => handleViewDetail(record)}
              className="!h-10 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
            >
              <Eye size={18} className="font-semibold" />
            </Button>
          </Tooltip>

          <Tooltip title="Sửa thông tin">
            <Button
              onClick={() => handleEdit(record)}
              className="!h-10 !bg-emerald-600 !text-white !border-none hover:!bg-emerald-700 transition-all"
            >
              <Pencil size={18} className="font-semibold" />
            </Button>
          </Tooltip>

          <Tooltip title="Lịch sử booking">
            <Button
              onClick={() => handleOpenBookingHistory(record)}
              className="!h-10 !bg-amber-600 !text-white !border-none hover:!bg-amber-700 transition-all"
            >
              <span className="relative inline-block">
                <CalendarDays size={18} className="align-middle" />
                <CheckCircle2
                  size={12}
                  strokeWidth={2}
                  className="absolute -right-1 -bottom-1 rounded-full bg-amber-600"
                />
              </span>
            </Button>
          </Tooltip>

          <Tooltip title="Thống kê hiệu suất KOL">
            <Button
              onClick={() => handleOpenMetrics(record)}
              className="!h-10 !bg-cyan-600 !text-white !border-none hover:!bg-cyan-700 transition-all"
            >
              <BarChart3 size={18} className="font-semibold" />
            </Button>
          </Tooltip>

          <Tooltip title="Xem đánh giá / phản hồi">
            <Button
              onClick={() => handleOpenReviews(record)}
              className="!h-10 !bg-rose-600 !text-white !border-none hover:!bg-rose-700 transition-all"
            >
              <Star size={18} className="font-semibold" />
            </Button>
          </Tooltip>

          <Tooltip title="Xem lịch làm việc">
            <Button
              onClick={() => handleOpenSchedule(record)}
              className="!h-10 !bg-purple-600 !text-white !border-none hover:!bg-purple-700 transition-all"
            >
              <CalendarRange size={18} className="font-semibold" />
            </Button>
          </Tooltip>
        </div>
      ),
    },
  ];

  const tableLoading = categoryId ? loadingByCategory : isLoadingGetALlKol;

  return (
    <div className="relative h-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 items-center">
          <div className="border-2 p-2 border-gray-300">
            <VerifiedUserOutlined className="text-gray-400" />
          </div>
          <section>
            <h1 className="text-[18px] font-bold">QUẢN LÝ KOL</h1>
            <p className="text-[14px]">Danh sách KOL hệ thống</p>
          </section>
        </div>
      </div>

      <div className="flex gap-3 py-3">
        <Form
          form={form}
          className="flex gap-3 flex-wrap"
          onFinish={handleSearch}
        >
          {/* ✅ Search max 100 ký tự, không show 0/100, có thông báo khi đạt 100 */}
          <Form.Item
            name="search"
            extra={
              searchExtra ? (
                <div className="text-amber-600 text-xs mt-1">{searchExtra}</div>
              ) : null
            }
          >
            <Input
              className="!h-12"
              placeholder="Tìm tên KOL"
              maxLength={100}
              allowClear
              onChange={(e) => {
                const v = e.target.value ?? "";
                setSearchExtra(
                  v.length === 100 ? "Đã đạt tối đa 100 ký tự." : ""
                );
              }}
              onPressEnter={() => form.submit()}
            />
          </Form.Item>

          <Form.Item
            name="minBookingPrice"
            extra={
              minPriceExtra ? (
                <div className="text-amber-600 text-xs mt-1">
                  {minPriceExtra}
                </div>
              ) : null
            }
            rules={[
              {
                validator: (_, value) => {
                  if (value === undefined || value === "" || value === null) {
                    setMinPriceExtra("");
                    return Promise.resolve();
                  }

                  const s = String(value); // canonical: "1234.56"
                  const [intRaw = "", decRaw = ""] = s.split(".");
                  const intDigits = intRaw.replace(/\D/g, "");
                  const decDigits = decRaw.replace(/\D/g, "");

                  if (!intDigits) return Promise.reject("Chỉ nhập số.");
                  if (decDigits.length > MAX_DEC_DIGITS)
                    return Promise.reject("Tối đa 2 chữ số thập phân.");

                  const totalDigits = intDigits.length + decDigits.length;
                  if (totalDigits > MAX_TOTAL_DIGITS)
                    return Promise.reject(
                      "Tối đa 13 chữ số (bao gồm cả phần thập phân)."
                    );

                  const num = Number(s);
                  if (!Number.isFinite(num))
                    return Promise.reject("Chỉ nhập số.");

                  if (num < 10000) return Promise.reject("Tối thiểu 10.000 đ.");

                  setMinPriceExtra(
                    totalDigits === MAX_TOTAL_DIGITS
                      ? "Đã đạt tối đa 13 chữ số."
                      : ""
                  );

                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              className="!w-64 !h-12 [&_.ant-input-number-input-wrap]:!h-12 [&_.ant-input-number-input]:!h-12 [&_.ant-input-number-input]:!leading-[46px]"
              placeholder="Giá booking tối thiểu"
              controls={false}
              stringMode
              inputMode="decimal"
              onKeyDown={handleMinPriceKeyDown}
              onPaste={handleMinPricePaste}
              onPressEnter={() => form.submit()}
              formatter={(val) => {
                if (val === undefined || val === null || val === "") return "";
                const s = String(val); // canonical "1234.56"
                const [intPart = "", decPart = ""] = s.split(".");
                const intFmt = intPart
                  .replace(/\D/g, "")
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                return decPart ? `${intFmt},${decPart} đ` : `${intFmt} đ`;
              }}
              parser={(val) => {
                if (!val) return "";
                const raw = String(val)
                  .replace(/đ|vnđ/gi, "")
                  .replace(/\s/g, "")
                  .replace(/[^\d,]/g, "");

                const firstComma = raw.indexOf(",");
                let intPart = firstComma >= 0 ? raw.slice(0, firstComma) : raw;
                let decPart = firstComma >= 0 ? raw.slice(firstComma + 1) : "";

                intPart = intPart.replace(/\D/g, "");
                decPart = decPart.replace(/\D/g, "");

                intPart = intPart.slice(0, MAX_TOTAL_DIGITS);
                const remain = Math.max(0, MAX_TOTAL_DIGITS - intPart.length);
                const decLimit = Math.min(MAX_DEC_DIGITS, remain);
                decPart = decPart.slice(0, decLimit);

                return decPart ? `${intPart}.${decPart}` : intPart;
              }}
            />
          </Form.Item>

          <Select
            placeholder="Đánh giá tối thiểu"
            value={minRating}
            onChange={(v) => {
              setMinRating(v ?? null);
              setPage(0);
            }}
            className="w-48 !h-12"
            allowClear
            options={[
              { label: "Tất cả", value: null },
              { label: "1 sao trở lên", value: 1 },
              { label: "2 sao trở lên", value: 2 },
              { label: "3 sao trở lên", value: 3 },
              { label: "4 sao trở lên", value: 4 },
              { label: "5 sao", value: 5 },
            ]}
          />

          <Select
            showSearch
            placeholder="Lọc theo chuyên mục"
            value={categoryId}
            onChange={(v) => {
              setCategoryId(v ?? null);
              setPage(0);
            }}
            className="min-w-60 !h-12"
            allowClear
            loading={loadingCategories}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={categories}
          />

          <Form.Item>
            <Button
              htmlType="submit"
              className="!h-12 !bg-[#fa7833] !text-white !font-bold"
            >
              <Search size={16} /> Tìm kiếm
            </Button>
          </Form.Item>

          <Form.Item>
            <Button
              onClick={resetForm}
              className="!h-12 !bg-[#fa7833] !text-white !font-bold"
            >
              <Trash2 size={16} /> Xóa tìm kiếm
            </Button>
          </Form.Item>

          <Form.Item>
            <Button
              onClick={handleCreateKol}
              className="!h-12 !bg-[#fa7833] !text-white !font-bold"
            >
              <Plus size={18} />
              Tạo KOL
            </Button>
          </Form.Item>

          <Form.Item>
            <Button
              onClick={handleExportKol}
              loading={isExporting}
              className="!h-12 !bg-[#fa7833] !text-white !font-bold"
            >
              Xuất dữ liệu KOL
            </Button>
          </Form.Item>
        </Form>
      </div>

      <Table
        tableLayout="fixed"
        columns={columns}
        dataSource={filteredData}
        loading={tableLoading}
        pagination={false}
        rowKey="id"
      />

      <div className="!my-4 py-5">
        <Pagination
          align="center"
          current={page + 1}
          total={totalElements}
          pageSize={size}
          pageSizeOptions={["5", "10", "20", "50", "100"]}
          onChange={handlePaginationChange}
          onShowSizeChange={handlePageSizeChange}
          showSizeChanger
        />
      </div>
    </div>
  );
};

export default ManagementKOL;
