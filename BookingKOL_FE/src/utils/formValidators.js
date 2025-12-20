const PHONE_REGEX = /^(?:\+84|84|0)(3|5|7|8|9)\d{8}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

export const requiredRule = (label) => ({
  required: true,
  whitespace: true,
  message: `${label} không được để trống`,
});

export const emailRule = {
  type: "email",
  message: "Email không hợp lệ",
};

export const phoneRule = {
  validator: (_, value) => {
    if (!value) {
      return Promise.resolve();
    }
    return PHONE_REGEX.test(value)
      ? Promise.resolve()
      : Promise.reject(
          new Error(
            "Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng Việt Nam, ví dụ: 0912345678"
          )
        );
  },
};

export const passwordRule = {
  validator: (_, value) => {
    if (!value) {
      return Promise.resolve();
    }
    if (!PASSWORD_REGEX.test(value)) {
      return Promise.reject(
        new Error("Mật khẩu phải có ít nhất 6 ký tự, bao gồm cả chữ và số")
      );
    }
    if (/\s/.test(value)) {
      return Promise.reject(new Error("Mật khẩu không được chứa khoảng trắng"));
    }
    return Promise.resolve();
  },
};

export const maxLengthRule = (label, max) => ({
  validator: (_, value) => {
    if (!value || value.length <= max) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(`${label} không được vượt quá ${max} ký tự`)
    );
  },
});
