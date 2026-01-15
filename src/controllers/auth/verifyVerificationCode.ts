import { NextFunction, Request, Response } from "express";
import { AppError } from "../../middlewares/errorHandler";
import { acceptCodeSchema } from "../../middlewares/validator";
import User from "../../models/userModel";
import { hmacProcess } from "../../utils/hashing";

export const verifyVerificationCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, providedCode } = req.body;

    const { error } = acceptCodeSchema.validate({ email, providedCode });
    if (error) return next(new AppError(error.details[0].message, 400));
    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({ email }).select(
      "+verificationCode +verificationCodeValidation"
    );
    if (!existingUser) return next(new AppError("User does not exists!", 401));
    if (existingUser.verified)
      return next(new AppError("You are already verified!", 400));

    if (
      typeof existingUser.verificationCode !== "string" ||
      typeof existingUser.verificationCodeValidation !== "number"
    ) {
      return next(
        new AppError("Verification code is missing or invalid!", 400)
      );
    }

    const EXPIRATION_TIME_MS = 5 * 60 * 1000;
    const hmacSecret = process.env.HMAC_VERIFICATION_CODE_SECRET;
    if (!hmacSecret)
      return next(new AppError("HMAC secret not configured", 500));

    if (
      Date.now() - existingUser.verificationCodeValidation >
      EXPIRATION_TIME_MS
    ) {
      return next(new AppError("Verification code has expired!", 400));
    }

    const hashedCodeValue = hmacProcess(codeValue, hmacSecret);

    if (hashedCodeValue === existingUser.verificationCode) {
      existingUser.verified = true;
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeValidation = undefined;
      await existingUser.save();
      res
        .status(200)
        .json({ success: true, message: "Your account has been verified!" });
      return;
    }
    return next(new AppError("Verification code is incorrect!", 400));
  } catch (error) {
    next(error);
  }
};
