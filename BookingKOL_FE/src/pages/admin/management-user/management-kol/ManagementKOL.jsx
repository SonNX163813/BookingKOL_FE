import {
  Search,
  Trash2,
  Eye,
  Pencil,
  Plus,
  CalendarRange,
  CalendarDays,
  CheckCircle2,
  BarChart3, // ✅ Icon thống kê
} from "lucide-react";

// src/pages/admin/management-user/management-kol/ManagementKOL.jsx

import {
  Button,
  Form,
  Input,
  InputNumber,
  Pagination,
  Table,
  Tag,
  Rate,
  Tooltip,
  Image,
  Select,
} from "antd";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAllKol } from "../../../../hook/admin/management-user/useGetAllKol";
import { adminGetKolsByCategory } from "../../../../services/admin/AdminAPI";
import { getAllCategory } from "../../../../services/CategoryServices";
import imgdef from "../../../../assets/default.png";
import { VerifiedUserOutlined } from "@mui/icons-material";

const viNormalize = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const ManagementKOL = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [form] = Form.useForm();

  const [searchValue, setSearchValue] = useState();
  const [searchMinBookingPrice, setSearchMinBookingPrice] = useState();
  const [minRating, setMinRating] = useState(null);

  // Category
  const [categoryId, setCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Dữ liệu từ BE khi không lọc category
  const { isLoadingGetALlKol, ResponseGetAllKol, refetchGetAllKol } =
    useGetAllKol(
      page,
      size,
      searchMinBookingPrice,
      minRating,
      searchValue // -> BE param 'search' (displayName)
    );

  const dataResponse = ResponseGetAllKol?.data?.content;
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

  // Nguồn dữ liệu thô
  const rawList = useMemo(() => {
    if (categoryId) return listByCategory ?? [];
    return ResponseGetAllKol?.data?.content ?? [];
  }, [categoryId, listByCategory, ResponseGetAllKol]);

  // Lọc FE (contains + bỏ dấu)
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

  // 👉 Nút lịch: Admin xem lịch KOL (mặc định view=month)
  const handleOpenSchedule = (record) => {
    navigate(`/admin/kols/${record?.id}/schedule?view=month`);
  };

  // 👉 Nút lịch sử booking của KOL
  const handleOpenBookingHistory = (record) => {
    navigate(`/admin/kols/${record?.id}/bookings`);
  };

  // 👉 Nút xem metric / thống kê hiệu suất KOL
  const handleOpenMetrics = (record) => {
    navigate(`/admin/kols/${record?.id}/metrics`);
  };

  const handleSearch = (values) => {
    const vSearch = values?.search?.trim() || undefined;
    const raw = values?.minBookingPrice;
    const num = raw ? Number(String(raw)) : undefined;

    setSearchValue(vSearch);
    setSearchMinBookingPrice(Number.isFinite(num) ? num : undefined);
    setPage(0);
  };

  const resetForm = () => {
    form.resetFields();
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
    { title: "Tên KOL", key: "displayName", dataIndex: "displayName" },
    { title: "Quốc gia", key: "country", dataIndex: "country" },
    {
      title: "Chuyên mục",
      key: "categories",
      dataIndex: "categories",
      render: (categories = []) => (
        <>
          {categories.map((cat) => (
            <Tag color="blue" key={cat.id}>
              <div className="!h-10 !flex !items-center">{cat.name}</div>
            </Tag>
          ))}
        </>
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
      title: "Đánh giá",
      key: "overallRating",
      dataIndex: "overallRating",
      render: (rating, record) => (
        <span>
          <Rate disabled value={Number(rating) || 0} /> (
          {record?.feedbackCount ?? 0})
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      width: 400,
      render: (record) => (
        <div className="w-full flex justify-center gap-2">
          {/* Xem portfolio */}
          <Tooltip title="Xem portfolio">
            <Button
              onClick={() => handleViewDetail(record)}
              className="!h-10 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
            >
              <Eye size={18} className="font-semibold" />
            </Button>
          </Tooltip>

          {/* Sửa thông tin */}
          <Tooltip title="Sửa thông tin">
            <Button
              onClick={() => handleEdit(record)}
              className="!h-10 !bg-emerald-600 !text-white !border-none hover:!bg-emerald-700 transition-all"
            >
              <Pencil size={18} className="font-semibold" />
            </Button>
          </Tooltip>

          {/* Lịch sử booking */}
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

          {/* Thống kê / Metric */}
          <Tooltip title="Thống kê hiệu suất KOL">
            <Button
              onClick={() => handleOpenMetrics(record)}
              className="!h-10 !bg-cyan-600 !text-white !border-none hover:!bg-cyan-700 transition-all"
            >
              <BarChart3 size={18} className="font-semibold" />
            </Button>
          </Tooltip>

          {/* Xem lịch làm việc (mặc định tháng) */}
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
          <Form.Item name="search">
            <Input
              className="h-12!"
              placeholder="Tìm tên KOL (chứa ký tự)"
              onPressEnter={() => form.submit()}
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="minBookingPrice"
            rules={[
              {
                validator: (_, value) => {
                  if (value === undefined || value === "" || value === null) {
                    return Promise.resolve();
                  }
                  const num = Number(String(value).replace(/\D/g, ""));
                  if (!Number.isFinite(num))
                    return Promise.reject("Chỉ nhập số.");
                  if (num < 10000) return Promise.reject("Tối thiểu 10.000 đ.");
                  if (num >= 1000000000)
                    return Promise.reject("Nhỏ hơn 1.000.000.000 đ.");
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              className="!h-12 !w-64"
              placeholder="Giá booking tối thiểu"
              controls={false}
              stringMode
              formatter={(val) => {
                if (!val) return "";
                const v = String(val).replace(/[^\d]/g, "");
                return v.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " đ";
              }}
              parser={(val) => (val ? val.replace(/[^\d]/g, "") : "")}
              onPressEnter={() => form.submit()}
            />
          </Form.Item>

          <Select
            placeholder="Đánh giá tối thiểu"
            value={minRating}
            onChange={(v) => {
              setMinRating(v);
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
              className="h-12! bg-[#fa7833]! text-[white]! font-bold!"
            >
              <Search size={16} /> Tìm kiếm
            </Button>
          </Form.Item>

          <Form.Item>
            <Button
              onClick={resetForm}
              className="h-12! bg-[#fa7833]! text-[white]! font-bold!"
            >
              <Trash2 size={16} /> Xóa tìm kiếm
            </Button>
          </Form.Item>

          <Form.Item>
            <Button
              onClick={handleCreateKol}
              className="h-12! bg-[#fa7833]! text-[white]! font-bold!"
            >
              <Plus size={18} />
              Tạo KOL
            </Button>
          </Form.Item>
        </Form>
      </div>

      <Table
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
