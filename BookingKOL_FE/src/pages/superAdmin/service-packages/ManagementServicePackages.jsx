// src/pages/superadmin/service-packages/ManagementServicePackages.jsx
import { useMemo, useState } from "react";
import { Edit, Eye, Folder, SquarePen, X } from "lucide-react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Table,
  Tag,
  Typography,
  Space,
  InputNumber,
} from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import useGetSuperAdminServicePackages from "../../../hook/superadmin/useGetSuperAdminServicePackages";
import usePatchSuperAdminServicePackage from "../../../hook/superadmin/usePatchSuperAdminServicePackage";

const { Title, Text } = Typography;

const money = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "--";
  return n.toLocaleString("vi-VN");
};

const typeLabel = (t) => {
  const s = String(t || "")
    .trim()
    .toLowerCase();
  if (s === "vip") return "VIP";
  if (s === "normal") return "THƯỜNG";
  return (t || "--").toString();
};

// 1.000.000
const formatDotThousands = (val) => {
  if (val === null || val === undefined || val === "") return "";
  const s = String(val).replace(/\D/g, "");
  if (!s) return "";
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const onlyDigits = (v) => String(v ?? "").replace(/\D/g, "");
const toNumberOrNull = (digits) => {
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
};

const ManagementServicePackages = () => {
  const {
    data: queryData,
    isLoading,
    isFetching,
    refetch,
  } = useGetSuperAdminServicePackages();

  const { isLoadingPatchServicePackage, handlePatchServicePackage } =
    usePatchSuperAdminServicePackage(refetch);

  const raw = useMemo(() => {
    if (!queryData) return null;
    if (Array.isArray(queryData))
      return { status: 200, message: [], data: queryData };
    if (Array.isArray(queryData?.data)) return queryData;
    if (Array.isArray(queryData?.data?.data)) return queryData.data;
    return queryData;
  }, [queryData]);

  const dataResponse = raw?.data ?? [];

  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return dataResponse;

    return (dataResponse || []).filter((p) => {
      const name = (p?.name || "").toLowerCase();
      const desc = (p?.description || "").toLowerCase();
      const type = (p?.packageType || "").toLowerCase();
      return name.includes(kw) || desc.includes(kw) || type.includes(kw);
    });
  }, [dataResponse, q]);

  // ====== Modal View / Edit ======
  const [openViewDetail, setOpenViewDetail] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const [isEditting, setIsEditting] = useState(null);
  const [openShowModalUpdate, setOpenShowModalUpdate] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  const [priceDigitsLen, setPriceDigitsLen] = useState(0);

  const handleViewDetail = (record) => {
    setSelectedPackage(record);
    setOpenViewDetail(true);
  };

  const handleUpdate = (record) => {
    setEditingRecord(record);
    setIsEditting(record?.id);
    setOpenShowModalUpdate(true);

    const digits = onlyDigits(record?.price);
    setPriceDigitsLen(digits.length);

    form.setFieldsValue({
      newPrice: record?.price ?? null,
    });
  };

  const onCancel = () => {
    setIsEditting(null);
    setEditingRecord(null);
    form.resetFields();
    setOpenShowModalUpdate(false);
    setPriceDigitsLen(0);
  };

  const onSubmit = (value) => {
    const digits = onlyDigits(value?.newPrice);
    const newPriceNum = parseInt(digits, 10);

    handlePatchServicePackage({
      packageId: isEditting,
      newPrice: newPriceNum,
    });

    onCancel();
  };

  // ✅ Chặn nhập ký tự/ chữ + chặn nhập thêm khi đủ 13 số
  const handlePriceKeyDown = (e) => {
    const allowed = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Tab",
      "Enter",
      "Home",
      "End",
    ];

    if (e.ctrlKey || e.metaKey) return; // cho Ctrl/Cmd + A/C/V/X
    if (allowed.includes(e.key)) return;

    // chỉ cho bấm phím 0-9
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    // nếu đã đủ 13 số thì không cho nhập thêm
    const currentDigits = onlyDigits(form.getFieldValue("newPrice"));
    // nếu đang bôi đen để thay thế thì vẫn cho nhập
    const sel =
      typeof e.target?.selectionStart === "number" &&
      typeof e.target?.selectionEnd === "number"
        ? e.target.selectionEnd - e.target.selectionStart
        : 0;

    if (currentDigits.length >= 13 && sel === 0) {
      e.preventDefault();
    }
  };

  const handlePricePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData?.getData("text") ?? "";
    const pastedDigits = onlyDigits(text);

    const currentDigits = onlyDigits(form.getFieldValue("newPrice"));
    const merged = (currentDigits + pastedDigits).slice(0, 13);

    form.setFieldsValue({ newPrice: toNumberOrNull(merged) });
    setPriceDigitsLen(merged.length);
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => <div className="font-bold">#{index + 1}</div>,
      width: "8%",
    },
    {
      title: "Tên gói",
      key: "name",
      dataIndex: "name",
      width: "22%",
      render: (v) => <div className="font-semibold">{v || "--"}</div>,
    },
    {
      title: "Loại gói",
      key: "packageType",
      dataIndex: "packageType",
      width: "12%",
      render: (v) => (
        <Tag color="blue">
          <div className="!h-10 !flex !items-center">{typeLabel(v)}</div>
        </Tag>
      ),
    },
    {
      title: "Giá",
      key: "price",
      dataIndex: "price",
      width: "12%",
      render: (v) => (
        <div className="!h-10 !flex !items-center">{money(v)}</div>
      ),
    },
    {
      title: "Chọn KOL",
      key: "allowKolSelection",
      dataIndex: "allowKolSelection",
      width: "12%",
      render: (v) => (
        <Tag color={v ? "green" : "red"}>
          <div className="!h-10 !flex !items-center">{v ? "Có" : "Không"}</div>
        </Tag>
      ),
    },
    {
      title: "Mô tả",
      key: "description",
      dataIndex: "description",
      render: (v) => <div className="max-w-[520px] truncate">{v || "--"}</div>,
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      width: "14%",
      render: (_, record) => (
        <div className="w-full flex justify-center gap-3">
          <Button
            onClick={() => handleViewDetail(record)}
            className="!h-10 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
          >
            <Eye size={18} className="font-semibold" />
          </Button>

          <Button
            onClick={() => handleUpdate(record)}
            className="!h-10 !bg-green-600 !text-white !border-none hover:!bg-green-700 transition-all"
          >
            <Edit size={18} className="font-semibold" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="relative h-full p-3 md:p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Quản lý gói Livestream
          </Title>
          <Text type="secondary">
            Tổng: <b>{filtered?.length ?? 0}</b> gói
          </Text>
        </div>

        <Space>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tên / loại / mô tả..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: 320 }}
          />
          <Button
            icon={<ReloadOutlined />}
            loading={isFetching}
            onClick={() => refetch?.()}
          >
            Tải lại
          </Button>
        </Space>
      </div>

      <div className="py-2">
        <Table
          columns={columns}
          dataSource={filtered}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          rowKey="id"
          scroll={{ x: 1100 }}
        />
      </div>

      {/* View detail */}
      <Modal
        open={openViewDetail}
        onCancel={() => setOpenViewDetail(false)}
        footer={null}
        width={600}
        closable={false}
      >
        {selectedPackage && (
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
              <Folder className="w-5 h-5 text-blue-500" /> CHI TIẾT GÓI
              LIVESTREAM
            </h2>

            <Card className="w-full max-w-xl mx-auto shadow-md rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-100 h-12">
                <p className="text-gray-600 font-medium">ID:</p>
                <span className="text-gray-900 font-bold">
                  #{selectedPackage.id}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 h-12">
                <p className="text-gray-600 font-medium">Tên gói:</p>
                <span className="text-gray-900 font-semibold">
                  {selectedPackage.name}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 h-16">
                <p className="text-gray-600 font-medium">Loại gói:</p>
                <Tag color="blue" className="font-semibold">
                  <div className="h-10 flex items-center">
                    {typeLabel(selectedPackage.packageType)}
                  </div>
                </Tag>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 h-16">
                <p className="text-gray-600 font-medium">Giá:</p>
                <div className="text-gray-900 font-semibold">
                  {money(selectedPackage.price)}
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 h-16">
                <p className="text-gray-600 font-medium">Cho phép chọn KOL:</p>
                <Tag
                  color={selectedPackage.allowKolSelection ? "green" : "red"}
                  className="font-semibold"
                >
                  <div className="h-10 flex items-center">
                    {selectedPackage.allowKolSelection ? "Có" : "Không"}
                  </div>
                </Tag>
              </div>

              <div className="py-3">
                <p className="text-gray-600 font-medium mb-1">Mô tả:</p>
                <div className="text-gray-900">
                  {selectedPackage.description || "--"}
                </div>
              </div>
            </Card>
          </div>
        )}
      </Modal>

      {/* Update modal: chỉ sửa giá */}
      <Modal
        footer={null}
        title={
          <div>
            <p className="flex gap-2">
              <Folder /> CHỈNH SỬA GIÁ GÓI
            </p>
          </div>
        }
        open={openShowModalUpdate}
        onCancel={onCancel}
      >
        {editingRecord ? (
          <Card className="mb-3 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 h-12">
              <p className="text-gray-600 font-medium">Tên gói:</p>
              <span className="text-gray-900 font-semibold">
                {editingRecord?.name ?? "--"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 h-12">
              <p className="text-gray-600 font-medium">Loại gói:</p>
              <span className="text-gray-900 font-semibold">
                {typeLabel(editingRecord?.packageType)}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 h-12">
              <p className="text-gray-600 font-medium">Giá hiện tại:</p>
              <span className="text-gray-900 font-semibold">
                {money(editingRecord?.price)}
              </span>
            </div>
          </Card>
        ) : null}

        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item
            label="Giá mới"
            name="newPrice"
            validateFirst
            rules={[
              { required: true, message: "Vui lòng nhập giá mới!" },
              {
                validator: (_, v) => {
                  const digits = onlyDigits(v);
                  if (!digits)
                    return Promise.reject(new Error("Chỉ được nhập số"));
                  if (digits.length > 13)
                    return Promise.reject(new Error("Giá tối đa 13 số"));

                  const n = Number(digits);
                  if (!Number.isFinite(n) || !Number.isInteger(n))
                    return Promise.reject(new Error("Giá phải là số nguyên"));

                  if (n <= 10000)
                    return Promise.reject(
                      new Error("Giá phải lớn hơn 10.000đ")
                    );

                  return Promise.resolve();
                },
              },
            ]}
            help={priceDigitsLen === 13 ? "Đã đạt tối đa 13 số" : null}
            validateStatus={priceDigitsLen === 13 ? "warning" : undefined}
          >
            <InputNumber
              className="h-12!"
              style={{ width: 320 }} // ✅ nhỏ lại
              placeholder="Ví dụ: 1.000.000"
              controls={false}
              precision={0}
              inputMode="numeric"
              onKeyDown={handlePriceKeyDown}
              onPaste={handlePricePaste}
              formatter={(value) => formatDotThousands(value)}
              parser={(value) => {
                // ✅ chỉ số + cắt 13 số (đạt max thì không nhận thêm)
                return onlyDigits(value).slice(0, 13);
              }}
              onChange={(val) => {
                const digits = onlyDigits(val);
                setPriceDigitsLen(digits.length);
              }}
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button className="h-12!" onClick={onCancel}>
              <X size={16} /> Hủy
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              className="h-12!"
              loading={isLoadingPatchServicePackage}
            >
              <p className="flex! gap-2 items-center!">
                <SquarePen size={16} />
                Chỉnh sửa
              </p>
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ManagementServicePackages;
