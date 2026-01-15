import { NextFunction, Request, Response } from "express";
import { AppError } from "../../middlewares/errorHandler";
import transport from "../../middlewares/sendEmail";
import User from "../../models/userModel";
import { hmacProcess } from "../../utils/hashing";

// Gửi mã để đặt lại mật khẩu
export const sendForgotPasswordCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    if (!existingUser) return next(new AppError("User does not exists!", 404));

    //Chỉ nên cho người dùng đã xác minh email dùng tính năng này
    // (để tránh việc hacker gửi mã bậy vào email chưa xác thực )
    if (!existingUser.verified)
      return next(
        new AppError("Please verify your email before resetting password!", 403)
      );

    const fromEmail = process.env.NODE_CODE_SENDING_EMAIL_ADDRESS;
    const hmacSecret = process.env.HMAC_VERIFICATION_CODE_SECRET;

    if (!fromEmail || !hmacSecret)
      return next(
        new AppError("Server email or HMAC secret not configured", 500)
      );

    const codeValue = Math.floor(100000 + Math.random() * 900000);
    let info = await transport.sendMail({
      from: fromEmail,
      to: existingUser.email,
      subject: "Forgot password code",
      html: "<h1>" + codeValue + "</h1>",
    });
    if (info.accepted.includes(existingUser.email)) {
      const hashedCodeValue = hmacProcess(codeValue.toString(), hmacSecret);
      existingUser.forgotPasswordCode = hashedCodeValue;
      existingUser.forgotPasswordCodeValidation = Date.now();
      await existingUser.save();
      res.status(200).json({ success: true, message: "Code sent!" });
      return;
    }
    return next(new AppError("Code sent failed!", 500));
  } catch (error) {
    next(error);
  }
};
