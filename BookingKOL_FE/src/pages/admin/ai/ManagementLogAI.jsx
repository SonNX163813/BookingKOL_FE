import {
  Calendar,
  Eye,
  ListChecks,
  MessageSquare,
  Reply,
  Search,
  Trash2,
} from "lucide-react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Pagination,
  Table,
} from "antd";
import { useGetLogChatAI } from "../../../hook/ai/useGetLogChatAI";
import { useState } from "react";
import dayjs from "dayjs";
const ManagementLogAI = () => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [openViewDetailLog, setOpenViewDetailLog] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [form] = Form.useForm();
  const [searchName, setSearchName] = useState(undefined);
  const [searchStartDate, setSearchStartDate] = useState(undefined);
  const [searchEndDate, setSearchEndDate] = useState(undefined);

  const { isLoadingGetLogChatAI, ResponseGetLogChatAI } = useGetLogChatAI(
    page,
    size,
    searchName,
    searchStartDate,
    searchEndDate
  );
  const dataResponse = ResponseGetLogChatAI?.data?.content;

  const handleViewDetailLog = (record) => {
    setSelectedLog(record);
    setOpenViewDetailLog(true);
  };

  const handleSearch = (value) => {
    setSearchName(value.search);
    const startTime = value.startDate
      ? dayjs(value.startDate).format("YYYY-MM-DD")
      : undefined;
    const endTime = value.endDate
      ? dayjs(value.endDate).format("YYYY-MM-DD")
      : undefined;
    setSearchStartDate(startTime);
    setSearchEndDate(endTime);
    setPage(0);
  };

  console.log(searchName, searchEndDate, searchStartDate);

  const resetForm = () => {
    form.resetFields();
    setSearchName(undefined);
    setSearchStartDate(undefined);
    setSearchEndDate(undefined);
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => (
        <div className="font-bold">#{page * size + index + 1}</div>
      ),
      width: "4%",
    },
    {
      title: "Câu hỏi",
      key: "question",
      dataIndex: "question",
      width: "33%",
    },
    {
      title: "Câu trả lời",
      key: "answer",
      dataIndex: "answer",
      render: (answer) => {
        return <div className="line-clamp-2">{answer}</div>;
      },
      width: "33%",
    },
    {
      title: "Ngày tạo",
      key: "createdAt",
      dataIndex: "createdAt",
      render: (createdAt) => new Date(createdAt).toLocaleString("vi-VN"),
      width: "20%",
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      render: (record) => (
        <div className="w-full flex justify-center">
          <Button
            onClick={() => handleViewDetailLog(record)}
            className="!h-10 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
          >
            <Eye size={18} className="font-semibold" />
          </Button>
        </div>
      ),
      width: "12%",
    },
  ];

  return (
    <div className="relative h-full">
      <div className="flex gap-2 items-center">
        <div className="border-2 p-2 border-gray-300">
          <ListChecks className="text-gray-400" />
        </div>
        <section>
          <h1 className="text-[18px] font-bold">QUẢN LÝ LOG CHAT AI</h1>
          <p className="text-[14px]">Danh sách log hỏi đáp AI</p>
        </section>
      </div>

      <div className="flex gap-3 py-3">
        <Form form={form} className="flex gap-3" onFinish={handleSearch}>
          <Form.Item name="search">
            <Input className="h-12!" placeholder="Tìm câu hỏi" />
          </Form.Item>
          <Form.Item name="startDate">
            <DatePicker
              className="h-12!"
              placeholder="Tìm kiếm theo ngày bắt đầu"
            />
          </Form.Item>
          <Form.Item name="endDate">
            <DatePicker
              className="h-12!"
              placeholder="Tìm kiếm theo ngày kết thúc"
            />
          </Form.Item>
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
        </Form>
      </div>

      <div className="">
        <Table
          columns={columns}
          dataSource={dataResponse}
          loading={isLoadingGetLogChatAI}
          pagination={false}
          rowKey="id"
        />
      </div>

      <div className="!my-4 py-5">
        <Pagination
          align="center"
          current={page + 1}
          pageSize={size}
          pageSizeOptions={["5", "10", "20", "50", "100"]}
          onChange={(pageNumber, sizeNumber) => {
            setPage(pageNumber - 1), setSize(sizeNumber);
          }}
          total={ResponseGetLogChatAI?.data?.totalElements}
          showSizeChanger
        />
      </div>

      <Modal
        open={openViewDetailLog}
        onCancel={() => setOpenViewDetailLog(false)}
        footer={null}
        width={800}
        closable={false}
      >
        {selectedLog && (
          <Card className="shadow-lg rounded-2xl border border-gray-200 p-6 space-y-6">
            <div className="grid grid-cols-[3fr_1fr]">
              <div className="flex gap-3 items-start pb-4">
                <MessageSquare className="text-blue-500 mt-1" size={20} />
                <div>
                  <p className="text-gray-600 font-medium">Câu hỏi:</p>
                  <p className="text-gray-900 font-semibold whitespace-pre-line">
                    {selectedLog.question}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <Calendar className="text-purple-500" size={20} />
                <div>
                  <p className="text-gray-600 font-medium">Ngày tạo:</p>
                  <p className="text-gray-900 font-semibold">
                    {new Date(selectedLog.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-start pb-4">
              <Reply className="text-green-500 mt-1 w-5 h-5" size={20} />
              <div className="flex-1">
                <p className="text-gray-600 font-medium">Trả lời:</p>
                <p className="text-gray-900 whitespace-pre-line">
                  {selectedLog.answer}
                </p>
              </div>
            </div>
          </Card>
        )}
      </Modal>
    </div>
  );
};

export default ManagementLogAI;
