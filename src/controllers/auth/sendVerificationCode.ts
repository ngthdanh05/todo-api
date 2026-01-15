import { NextFunction, Request, Response } from "express";
import { AppError } from "../../middlewares/errorHandler";
import transport from "../../middlewares/sendEmail";
import User from "../../models/userModel";
import { hmacProcess } from "../../utils/hashing";

//Gửi mã xác minh để kích hoạt tài khoản
export const sendVerificationCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    if (!existingUser) return next(new AppError("User does not exists!", 401));
    //Chỉ gửi mã nếu người dùng chưa xác minh
    if (existingUser.verified) {
      return next(new AppError("You are already verified", 401));
    }

    const codeValue = Math.floor(100000 + Math.random() * 900000);

    const fromEmail = process.env.NODE_CODE_SENDING_EMAIL_ADDRESS;
    const hmacSecret = process.env.HMAC_VERIFICATION_CODE_SECRET;

    if (!fromEmail || !hmacSecret)
      return next(
        new AppError("Server email or HMAC secret not configured", 500)
      );

    let info = await transport.sendMail({
      from: fromEmail,
      to: existingUser.email,
      subject: "verification code",
      html: "<h1>" + codeValue + "</h1>",
    });
    if (info.accepted.includes(existingUser.email)) {
      const hashedCodeValue = hmacProcess(codeValue.toString(), hmacSecret);
      existingUser.verificationCode = hashedCodeValue;
      existingUser.verificationCodeValidation = Date.now();
      await existingUser.save();
      res.status(200).json({ success: true, message: "Code sent!" });
      return;
    }
    return next(new AppError("Code sent failed!", 401));
  } catch (error) {
    next(error);
  }
};
