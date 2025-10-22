import { useState } from "react";
import { useGetHistoryBookingBackage } from "../../hook/booking_package/useGetHistoryBookingBackage";
import { Card, Skeleton, Tag, Table } from "antd";

const statusColor = {
  REQUESTED: "gold",
  APPROVED: "green",
  REJECTED: "red",
  COMPLETED: "blue",
};

const HistoryBookingPackagePage = () => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const { isGetHistoryBookingBackage, ResponseGetHistoryBookingPackage } =
    useGetHistoryBookingBackage(page, size);

  const data = ResponseGetHistoryBookingPackage?.data?.content || [];
  const totalElements =
    ResponseGetHistoryBookingPackage?.data?.totalElements || 0;

  const handlePaginationChange = (pageNumber, pageSize) => {
    if (pageSize !== size) {
      setSize(pageSize);
      setPage(0);
      return;
    }

    setPage(pageNumber - 1);
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "stt",
      key: "stt",
      width: 70,
      align: "center",
      render: (_, __, idx) => page * size + idx + 1,
    },
    {
      title: "Tên chiến dịch",
      dataIndex: "campaignName",
      key: "campaignName",
      render: (text, record) => (
        <span style={{ fontWeight: 600, fontSize: 16 }}>{text}</span>
      ),
    },
    {
      title: "Gói",
      dataIndex: "packageName",
      key: "packageName",
      render: (text) => (
        <Tag color="purple" style={{ fontWeight: 500, fontSize: 14 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Ngân sách",
      dataIndex: "budgetMin",
      key: "budgetMin",
      render: (_, record) => (
        <span>
          {record.budgetMin.toLocaleString()} -{" "}
          {record.budgetMax.toLocaleString()} VND
        </span>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "startDate",
      key: "startDate",
      render: (_, record) => (
        <span>
          {record.startDate} → {record.endDate}
        </span>
      ),
    },
    {
      title: "KOLs",
      dataIndex: "kols",
      key: "kols",
      render: (kols) => (
        <span>{kols.map((kol) => kol.displayName).join(", ")}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={statusColor[status] || "default"}
          style={{ fontWeight: 600, fontSize: 14 }}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => (
        <span>{new Date(createdAt).toLocaleString()}</span>
      ),
    },
  ];

  return (
    <div className="max-w-[1500px] mx-auto">
      <Card
        bodyStyle={{ padding: 32 }}
        title={
          <span
            style={{
              fontWeight: 700,
              fontSize: 30,
              color: "#2b2d42",
              letterSpacing: 1,
            }}
          >
            Lịch sử đơn đặt theo chiến dịch
          </span>
        }
      >
        {isGetHistoryBookingBackage ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={data}
            pagination={{
              current: page + 1,
              pageSize: size,
              total: totalElements,
              onChange: handlePaginationChange,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
            }}
            bordered
            locale={{
              emptyText: (
                <span style={{ color: "#888" }}>
                  Không có lịch sử booking nào.
                </span>
              ),
            }}
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          />
        )}
      </Card>
      {/* <div>
                <Pagination
                    current={page + 1}
                    pageSize={size}
                    onChange={(pageNumber) => setPage(pageNumber - 1)}
                    total={ResponseGetHistoryBookingPackage?.data?.totalElements}
                />  
            </div> */}
    </div>
  );
};
export default HistoryBookingPackagePage;
