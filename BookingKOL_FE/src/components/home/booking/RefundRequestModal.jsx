import { Form, Input, Modal, Select } from "antd";

const RefundRequestModal = ({
  open,
  refundContext,
  bankOptions,
  bankListError,
  isLoadingBankList,
  isSubmitting,
  refundForm,
  formatCurrency,
  onCancel,
  onSubmit,
}) => {
  const hasTotalAmount =
    refundContext &&
    typeof refundContext.totalAmount === "number" &&
    Number.isFinite(refundContext.totalAmount);

  const totalAmountLabel = hasTotalAmount
    ? typeof formatCurrency === "function"
      ? formatCurrency(refundContext.totalAmount)
      : refundContext.totalAmount.toLocaleString("vi-VN")
    : null;

  return (
    <Modal
      open={open}
      centered
      width={520}
      title={
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold text-slate-900">
            Yêu cầu hoàn tiền
          </span>
          <span className="text-xs text-slate-500">
            Vui lòng cung cấp thông tin ngân hàng để chúng tôi xử lý hoàn tiền.
          </span>
        </div>
      }
      onCancel={onCancel}
      onOk={onSubmit}
      okText="Gửi yêu cầu"
      cancelText="Đóng"
      confirmLoading={isSubmitting}
      destroyOnClose
      maskClosable={!isSubmitting}
      styles={{
        content: {
          borderRadius: 24,
          overflow: "hidden",
        },
        header: {
          padding: "20px 24px 0",
          borderBottom: "none",
          background: "#ffffff",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
        body: {
          padding: 0,
          background: "#ffffff",
        },
        footer: {
          padding: "20px 24px 24px",
          borderTop: "1px solid rgba(148, 163, 184, 0.25)",
          background: "#ffffff",
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        },
      }}
    >
      <div className="px-6 pb-6">
        <div className="mb-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-inner shadow-slate-900/5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Mã đơn</span>
            <span className="font-semibold text-slate-900">
              {refundContext?.requestNumber ?? "--"}
            </span>
          </div>
          {totalAmountLabel ? (
            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">Số tiền đã đặt</span>
              <span className="font-semibold text-slate-900">
                {totalAmountLabel}
              </span>
            </div>
          ) : null}
        </div>

        <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          Hủy trước 24 giờ. Phí phạt 20%.
        </div>

        {bankListError ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            Không thể tải danh sách ngân hàng. Vui lòng thử lại.
          </div>
        ) : null}

        <Form layout="vertical" form={refundForm}>
          <Form.Item
            label="Ngân hàng"
            name="bankName"
            rules={[
              { required: true, message: "Vui lòng chọn ngân hàng." },
            ]}
          >
            <Select
              showSearch
              placeholder="Chọn ngân hàng"
              optionFilterProp="label"
              options={bankOptions}
              loading={isLoadingBankList}
              allowClear
              filterOption={(input, option) => {
                if (!option) return false;
                const search = input.trim().toLowerCase();
                const label =
                  typeof option.label === "string"
                    ? option.label.toLowerCase()
                    : "";
                const code =
                  typeof option.code === "string"
                    ? option.code.toLowerCase()
                    : "";
                return label.includes(search) || code.includes(search);
              }}
              notFoundContent="Không tìm thấy ngân hàng phù hợp"
            />
          </Form.Item>

          <Form.Item
            label="Số tài khoản"
            name="bankNumber"
            rules={[
              { required: true, message: "Vui lòng nhập số tài khoản." },
              {
                pattern: /^[0-9]{6,20}$/,
                message: "Số tài khoản phải gồm từ 6 đến 20 chữ số.",
              },
            ]}
          >
            <Input
              placeholder="Nhập số tài khoản nhận tiền"
              inputMode="numeric"
              maxLength={20}
              autoComplete="off"
              allowClear
            />
          </Form.Item>

          <Form.Item
            label="Chủ tài khoản"
            name="ownerName"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập tên chủ tài khoản.",
              },
              {
                max: 255,
                message: "Tên chủ tài khoản không vượt quá 255 ký tự.",
              },
            ]}
          >
            <Input
              placeholder="Nhập tên chủ tài khoản"
              maxLength={255}
              autoComplete="off"
              allowClear
            />
          </Form.Item>

          <Form.Item
            label="Lý do hoàn/hủy"
            name="reason"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập lý do hoàn tiền.",
              },
              {
                max: 1000,
                message: "Lý do không vượt quá 1000 ký tự.",
              },
            ]}
          >
            <Input.TextArea
              placeholder="Mô tả chi tiết lý do bạn cần hủy/hoàn tiền"
              rows={4}
              maxLength={1000}
              showCount
              allowClear
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default RefundRequestModal;
