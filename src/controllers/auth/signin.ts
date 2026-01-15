import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "middlewares/errorHandler";
import { signinSchema } from "middlewares/validator";
import User from "models/userModel";
import { doHashValidation } from "utils/hashing";

interface jwtPayLoad {
  userId: string;
  email: string;
  verified: boolean;
}

export const signin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error } = signinSchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 401));

    const { email, password } = req.body;
    // Tìm người dùng trong cơ sở dữ liệu
    const existingUser = await User.findOne({ email }).select("+password");
    // Vì field password thường bị select: false trong schema, nên phải thêm select("+password") để lấy ra

    if (!existingUser) return next(new AppError("User does not exists!"));

    const isValid = await doHashValidation(password, existingUser.password);
    if (!isValid) return next(new AppError("Invalid credentials!"));

    const secret = process.env.TOKEN_SECRET;
    if (!secret) return next(new AppError("Token secret is not defined", 500));

    // Tạo JWT Token nếu đăng nhập đúng
    const token = jwt.sign(
      {
        userId: existingUser._id.toString(),
        email: existingUser.email,
        verified: existingUser.verified,
      } as jwtPayLoad,
      secret,
      { expiresIn: "8h" }
    );

    // Gửi token dưới dạng cookie HTTP-only
    res
      .cookie("Authorization", `Bearer ${token}`, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: new Date(Date.now() + 8 * 60 * 60 * 1000),
      })
      .status(200)
      .json({
        success: true,
        token,
        user: {
          _id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          verify: existingUser.verified,
        },
        message: "Logged in successfully!",
      });
  } catch (error) {
    next(error);
  }
};
