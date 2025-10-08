import { Calendar, Eye, ListChecks, MessageSquare, Reply } from "lucide-react";
import { Card, Modal, Table } from "antd";
import { useGetLogChatAI } from "../../../hook/ai/useGetLogChatAI";
import { useState } from "react";

const ManagementLogAI = () => {
  const [openViewDetailLog, setOpenViewDetailLog] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const { isLoadingGetLogChatAI, ResponseGetLogChatAI } = useGetLogChatAI();

  const handleViewDetailLog = (record) => {
    setSelectedLog(record);
    setOpenViewDetailLog(true);
  };
  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => <div className="font-bold">#{index + 1}</div>,
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
      render: (record) => {
        return (
          <div
            className="cursor-pointer bg-blue-700 px-[14px] rounded-[5px] hover:bg-blue-300 transition-all
                    flex items-center justify-center text-white h-10 w-15"
            onClick={() => handleViewDetailLog(record)}
          >
            <Eye size={18} className="!font-bold" />
          </div>
        );
      },
      width: "10%",
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

      <div className="py-5">
        <Table
          columns={columns}
          dataSource={ResponseGetLogChatAI}
          loading={isLoadingGetLogChatAI}
          pagination={false}
          rowKey="id"
          // scroll={{ y: 'calc(100vh - 300px)' }}
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
