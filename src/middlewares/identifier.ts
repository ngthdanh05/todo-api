/*
  Middleware identifier giúp bảo vệ các route cần đăng nhập bằng cách: 
  - Kiểm tra token hợp lệ
  - Gắn thông tin user vào req.user
  - Cho phép xử lý trực tiếp hoặc trả lỗi nếu chưa đăng nhập

*/

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";

interface identifierRequest extends Request {
  user?: {
    userId: string;
    email: string;
    verified: boolean;
  };
}

interface TokenPayload {
  userId: string;
  email: string;
  verified: boolean;
  iat?: number;
  exp?: number;
}

export const identifier = async (
  req: identifierRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Kiểm tra request đến từ client đặc biệt (Có thể là mobile app hoặc hệ thống server-side nào đó) chứ không phải từ trình duyệt
    const isFromApiClient = req.headers.client === "not-browser";

    let rawToken: string | undefined;

    if (isFromApiClient) {
      //Nếu từ client đặc biệt thì lấy token từ Authorization header
      rawToken = req.headers.authorization;
    } else {
      // Nếu từ trình duyệt trình lấy token từ cookie được lưu ở trình duyệt
      rawToken = req.cookies?.Authorization;
    }

    if (!rawToken)
      return next(
        new AppError("You are not logged in. Please log in to continue.", 401)
      );

    const token = rawToken.startsWith("Bearer ")
      ? rawToken.split(" ")[1]
      : rawToken;

    // Giải mã token với secret key. Nếu hợp lệ sẽ trả ra thông tin người dùng
    const decode = jwt.verify(token, process.env.TOKEN_SECRET!) as TokenPayload;

    if (!decode.userId || !decode.email)
      return next(new AppError("Invalid token payload!", 401));

    req.user = {
      userId: decode.userId,
      email: decode.email,
      verified: decode.verified,
    };

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError")
      return next(new AppError("Toke has expired. Please login again.", 400));

    if (error.name === "JsonWebTokenError")
      return next(new AppError("Invalid token. Please login again.", 400));

    return next(
      new AppError("Internal server error during authentication", 500)
    );
  }
};
