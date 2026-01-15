import { NextFunction, Request, Response } from "express";
import { AppError } from "../../middlewares/errorHandler";
import { acceptFPCodeSchema } from "../../middlewares/validator";
import User from "../../models/userModel";
import { doHash, hmacProcess } from "../../utils/hashing";

export const resetPasswordWithCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, providedCode, newPassword, confirmPassword } = req.body;

    const { error } = acceptFPCodeSchema.validate({
      email,
      providedCode,
      newPassword,
      confirmPassword,
    });

    if (error) return next(new AppError(error.details[0].message, 400));

    const existingUser = await User.findOne({ email }).select(
      "+forgotPasswordCode +forgotPasswordCodeValidation"
    );

    if (!existingUser) {
      return next(new AppError("User does not exist!", 401));
    }

    if (!existingUser.verified) {
      return next(new AppError("You are not verified!", 401));
    }

    if (
      typeof existingUser.forgotPasswordCode !== "string" ||
      typeof existingUser.forgotPasswordCodeValidation !== "number"
    ) {
      return next(new AppError("Invalid or missing verification code!", 400));
    }

    const EXPIRATION_TIME_MS = 5 * 60 * 1000; // 5 phút
    const isExpired =
      Date.now() >
      existingUser.forgotPasswordCodeValidation + EXPIRATION_TIME_MS;

    if (isExpired) {
      return next(new AppError("Verification code has expired!", 400));
    }

    const hmacSecret = process.env.HMAC_VERIFICATION_CODE_SECRET;
    if (!hmacSecret) {
      return next(
        new AppError("Server misconfiguration: HMAC secret missing", 500)
      );
    }

    const hashedCode = hmacProcess(providedCode.toString(), hmacSecret);

    if (hashedCode !== existingUser.forgotPasswordCode) {
      return next(new AppError("Invalid verification code!", 400));
    }

    existingUser.password = await doHash(newPassword, 12);
    existingUser.forgotPasswordCode = undefined;
    existingUser.forgotPasswordCodeValidation = undefined;
    await existingUser.save();

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    return next(error);
  }
};
