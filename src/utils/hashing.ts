import { compare, hash } from "bcryptjs";
import { createHash, createHmac } from "crypto";

// Khi người dùng đăng ký, hàm này sẽ hash mật khẩu rồi lưu vào CSDL
export const doHash = async (
  value: string,
  saltRounds: 12
): Promise<string> => {
  return await hash(value, saltRounds);
};

// So sánh mật khẩu người dùng nhập vào và mật khẩu đã mã hóa lưu vào database
export const doHashValidation = async (
  value: string,
  hashedValue: string
): Promise<Boolean> => {
  return await compare(value, hashedValue);
};

// Ký dữ liệu gửi đến API để chống giả mạo
export const hmacProcess = (value: string, key: string): string => {
  return createHmac("sha256", key).update(value).digest("hex");
};
