import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot } from "lucide-react";
import { useSendChatAI } from "../../hook/rank/useSendChatAi";
import { Button, Form, Input } from "antd";
import { SendOutlined } from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import banner1 from "../../assets/banner1.jpg";
const ChatAIPage = () => {
  const [messages, setMessages] = useState([]);
  const [form] = Form.useForm();
  const {
    isLoadingSendChatAI,
    handleSendChatAI,
    ResponseSendChatAI,
    clearResponse,
  } = useSendChatAI();

  const onFinish = (values) => {
    const userMsg = { role: "user", text: values.question };
    setMessages((prev) => [...prev, userMsg]);
    form.resetFields();

    handleSendChatAI({ question: values.question });
  };

  const listRef = useRef(null);
  const endRef = useRef(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  // useEffect(() => {
  //     scrollToBottom(); // auto scroll khi có tin nhắn mới / đang gõ
  // }, [messages]);
  // useEffect(() => {
  //     if (listRef.current) {
  //         listRef.current.scrollTop = listRef.current.scrollHeight;
  //     }
  // }, [messages, isLoadingSendChatAI]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight; // 👈 scroll container chat
  }, [messages, isLoadingSendChatAI]);

  useEffect(() => {
    if (ResponseSendChatAI) {
      const aiMsg = { role: "ai", text: ResponseSendChatAI.answer };
      setMessages((prev) => [...prev, aiMsg]);
      clearResponse();
    }
  }, [ResponseSendChatAI]);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="h-14 px-4 border-b border-gray-700 flex items-center justify-center gap-2">
        <Bot className="w-5 h-5 text-blue-400" />
        <span className="font-semibold">AI Nexus Soical</span>
      </div>

      <div className="flex-1 w-full max-w-[1500px] mx-auto px-4 py-5 flex gap-4 h-full min-h-0">
        {" "}
        {/* 👈 thêm h-full min-h-0 */}
        <div className="w-1/4 bg-gray-800 rounded-lg p-4 text-center overflow-auto">
          {" "}
          {/* optional: overflow-auto nếu banner dài */}
          <h3 className="text-lg font-semibold mb-3">Quảng cáo</h3>
          <div className="space-y-4">
            <div className="bg-gray-700 p-3 rounded">
              <img src={banner1} alt="KOL LIVESTREAM" />
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <img src={banner1} alt="KOL LIVESTREAM" />
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <img src={banner1} alt="KOL LIVESTREAM" />
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-gray-900 rounded-lg border border-gray-700 overflow-hidden min-h-0">
          <div
            ref={listRef}
            className="flex-1 px-4 py-4 overflow-y-auto scrollbar-hide min-h-0"
          >
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                className={`p-4 rounded-xl mb-3 max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-blue-600 ml-auto text-white"
                    : "bg-gray-800 text-gray-100"
                }`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </motion.div>
            ))}

            {isLoadingSendChatAI && (
              <div className="p-4 rounded-xl mb-3 max-w-[80%] bg-gray-800 inline-flex gap-1">
                <span className="dot animate-bounce">.</span>
                <span className="dot animate-bounce delay-150">.</span>
                <span className="dot animate-bounce delay-300">.</span>
              </div>
            )}

            <div ref={endRef} />
          </div>

          <div className="w-full border-t border-gray-700 p-3 shrink-0">
            {" "}
            {/* 👈 shrink-0 */}
            <Form
              form={form}
              onFinish={onFinish}
              className="w-full"
              style={{
                display: "flex",
                alignItems: "center",
                background: "#fff",
                borderRadius: "9999px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                padding: "4px 10px",
                gap: 10,
              }}
            >
              <Form.Item
                name="question"
                style={{ flex: 1, marginBottom: 0, marginLeft: 10 }}
              >
                <Input
                  placeholder="Nhập câu hỏi của bạn..."
                  className="!border-none h-12 focus:!ring-0 focus:!outline-none focus:!shadow-none"
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  shape="circle"
                  icon={<SendOutlined fontSize="24px" />}
                  className="flex items-center justify-center !h-10 !w-10"
                />
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAIPage;
