import {
  Edit,
  Eye,
  Folder,
  Loader2,
  Lock,
  Plus,
  SquarePen,
  Unlock,
  X,
} from "lucide-react";
import { Button, Card, Form, Input, Modal, Spin, Table, Tag } from "antd";
import { useState } from "react";
import { useGetAllCategory } from "../../../hook/admin/category/useGetAllCategory";
import { CategoryOutlined } from "@mui/icons-material";
import { useRemoveCategory } from "../../../hook/admin/category/useRemoveCategory";
import { useCreateCategory } from "../../../hook/admin/category/useCreateCategory";
import { usePatchCategory } from "../../../hook/admin/category/usePatchCategory";

const ManagementCategory = () => {
  const [openViewDetail, setOpenViewDetail] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isEditting, setIsEditting] = useState(null);
  const [openShowModalCreate, setOpenShowModalCreate] = useState(false);
  const [openShowModalUpdate, setOpenShowModalUpdate] = useState(false);
  const [form] = Form.useForm();

  const {
    isLoadingGetAllCategory,
    ResponseGetAllCategory,
    refetchGetAllCategory,
  } = useGetAllCategory();

  const { isLoadingCreateCategory, handleCreateCategory } = useCreateCategory(
    refetchGetAllCategory
  );

  const { isLoadingPatchCategory, handlePatchCategory } = usePatchCategory(
    refetchGetAllCategory
  );

  const { isLoadingRemoveCategory, handleUpdateStatus, idCategoryRemove } =
    useRemoveCategory(refetchGetAllCategory);

  const dataResponse = ResponseGetAllCategory?.data;

  const handleViewDetail = (record) => {
    setSelectedCategory(record);
    setOpenViewDetail(true);
  };

  const handleUpdate = (record) => {
    setIsEditting(record.id);
    setOpenShowModalUpdate(true);
    form.setFieldsValue({
      name: record.name,
      key: record.key,
    });
  };

  const handleCreate = () => {
    setIsEditting(null);
    form.resetFields();
    setOpenShowModalCreate(true);
  };

  const onCancel = () => {
    setIsEditting(null);
    form.resetFields();
    setOpenShowModalCreate(false);
    setOpenShowModalUpdate(false);
  };

  const onSubmit = (value) => {
    const data = {
      name: value.name,
      key: value.key,
    };
    if (isEditting) {
      handlePatchCategory({ ...data, id: isEditting });
    } else {
      handleCreateCategory(data);
    }
    onCancel();
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => <div className="font-bold">#{index + 1}</div>,
      width: "8%",
    },
    {
      title: "Tên chuyên mục",
      key: "name",
      dataIndex: "name",
      width: "40%",
    },
    {
      title: "Key",
      key: "key",
      dataIndex: "key",
      width: "20%",
      render: (key) => (
        <Tag color="blue">
          <div className="!h-10 !flex !items-center">{key}</div>
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      key: "deleted",
      dataIndex: "deleted",
      render: (deleted) => (
        <Tag color={deleted ? "red" : "green"}>
          <div className="!h-10 !flex !items-center">
            {deleted ? "Không hoạt động" : "Hoạt động"}
          </div>
        </Tag>
      ),
      width: "12%",
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      render: (record) => (
        <div className="w-full flex justify-center gap-3">
          <Button
            onClick={() => handleViewDetail(record)}
            className="!h-10 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
          >
            <Eye size={18} className="font-semibold" />
          </Button>

          {record.deleted ? (
            <Button
              onClick={() => handleUpdateStatus(record.id)}
              className="!h-10 !bg-green-600 !text-white hover:bg-green-700! !border-none transition-all"
            >
              {isLoadingRemoveCategory && idCategoryRemove === record.id ? (
                <Spin className="!text-white" />
              ) : (
                <Unlock size={18} />
              )}
            </Button>
          ) : (
            <Button
              onClick={() => handleUpdateStatus(record.id)}
              className="!h-10 !bg-red-500 !text-white hover:bg-red-600! !border-none transition-all"
            >
              {isLoadingRemoveCategory && idCategoryRemove === record.id ? (
                <Spin className="!text-white" />
              ) : (
                <Lock size={18} />
              )}
            </Button>
          )}

          <Button
            onClick={() => handleUpdate(record)}
            className="!h-10 !bg-green-600 !text-white !border-none hover:!bg-green-700 transition-all"
          >
            <Edit size={18} className="font-semibold" />
          </Button>
        </div>
      ),
      width: "20%",
    },
  ];

  return (
    <div className="relative h-full">
      <div className="flex gap-2 items-center">
        <div className="border-2 p-2 border-gray-300">
          <CategoryOutlined className="text-gray-400" />
        </div>
        <section>
          <h1 className="text-[18px] font-bold">QUẢN LÝ CHUYÊN MỤC</h1>
          <p className="text-[14px]">Danh sách chuyên mục hệ thống</p>
        </section>
      </div>

      <div className="flex gap-5 justify-end">
        <Button
          className="mt-5! p-5! bg-[#fa7833]! text-[white]! h-12! font-bold!"
          onClick={handleCreate}
        >
          <Plus size={16} />
          Tạo Loại Sản phẩm
        </Button>
      </div>

      <div className="py-5">
        <Table
          columns={columns}
          dataSource={dataResponse}
          loading={isLoadingGetAllCategory}
          pagination={false}
          rowKey="id"
        />
      </div>

      <Modal
        open={openViewDetail}
        onCancel={() => setOpenViewDetail(false)}
        footer={null}
        width={500}
        closable={false}
      >
        {selectedCategory && (
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
              <Folder className="w-5 h-5 text-blue-500" /> CHI TIẾT LĨNH VỰC
            </h2>

            <Card className="w-full max-w-lg mx-auto shadow-md rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-100 h-12">
                <p className="text-gray-600 font-medium">ID:</p>
                <span className="text-gray-900 font-bold">
                  #{selectedCategory.id}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 h-12">
                <p className="text-gray-600 font-medium">Tên chuyên mục:</p>
                <span className="text-gray-900 font-semibold">
                  {selectedCategory.name}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 h-16">
                <p className="text-gray-600 font-medium">Key:</p>
                <Tag color="blue" className="font-semibold">
                  <div className="h-10 flex items-center">
                    {selectedCategory.key}
                  </div>
                </Tag>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 h-16">
                <p className="text-gray-600 font-medium">Trạng thái:</p>
                <Tag
                  color={selectedCategory.deleted ? "red" : "green"}
                  className="font-semibold"
                >
                  <div className="h-10 flex items-center">
                    {selectedCategory.deleted ? "Không hoạt động" : "Hoạt động"}
                  </div>
                </Tag>
              </div>
            </Card>
          </div>
        )}
      </Modal>

      <Modal
        footer={null}
        title={
          <div>
            {isEditting ? (
              <p className="flex gap-2">
                <Folder /> CHỈNH SỬA CHUYÊN MỤC
              </p>
            ) : (
              <p className="flex gap-2">
                <Folder /> THÊM CHUYÊN MỤC MỚI
              </p>
            )}
          </div>
        }
        open={isEditting ? openShowModalUpdate : openShowModalCreate}
        onCancel={onCancel}
      >
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item
            label="Tên chuyên mục"
            name="name"
            rules={[
              { required: true, message: "Vui lòng nhập tên chuyên mục!" },
            ]}
          >
            <Input className="h-12!" placeholder="Nhập tên chuyên mục" />
          </Form.Item>
          <Form.Item
            label="Key"
            name="key"
            rules={[{ required: true, message: "Vui lòng nhập key!" }]}
          >
            <Input className="h-12!" placeholder="Nhập key" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button className="h-12!" onClick={onCancel}>
              <X size={16} /> Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              className="h-12!"
              loading={
                isEditting ? isLoadingPatchCategory : isLoadingCreateCategory
              }
            >
              {isEditting ? (
                <p className="flex! gap-2 items-center!">
                  <SquarePen size={16} />
                  Chỉnh sửa
                </p>
              ) : (
                <p className="flex! gap-2 items-center!">
                  <Plus size={16} />
                  Thêm mới
                </p>
              )}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ManagementCategory;
