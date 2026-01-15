import { NextFunction, Request, Response } from "express";
import { AppError } from "../../middlewares/errorHandler";
import { acceptCodeSchema } from "../../middlewares/validator";
import User from "../../models/userModel";
import { hmacProcess } from "../../utils/hashing";

export const CheckForgotPasswordCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, providedCode } = req.body;

    const { error } = acceptCodeSchema.validate({
      email,
      providedCode,
    });

    if (error) return next(new AppError(error.details[0].message, 400));

    const existingUser = await User.findOne({ email }).select(
      "+forgotPasswordCode +forgotPasswordCodeValidation"
    );
    if (!existingUser) return next(new AppError("User does not exists!", 404));

    if (
      typeof existingUser.forgotPasswordCode !== "string" ||
      typeof existingUser.forgotPasswordCodeValidation !== "number"
    ) {
      console.log("forgotPasswordCode:", existingUser.forgotPasswordCode);
      console.log(
        "forgotPasswordCodeValidation:",
        existingUser.forgotPasswordCodeValidation
      );
      console.log(
        "Types:",
        typeof existingUser.forgotPasswordCode,
        typeof existingUser.forgotPasswordCodeValidation
      );

      return next(new AppError("Something is wrong with the code!", 400));
    }

    const hmacSecret = process.env.HMAC_VERIFICATION_CODE_SECRET;
    if (!hmacSecret)
      return next(
        new AppError("Server email or HMAC secret not configured", 500)
      );

    const EXPIRATION_TIME_MS = 5 * 60 * 1000;

    const isExpired =
      Date.now() >
      existingUser.forgotPasswordCodeValidation + EXPIRATION_TIME_MS;

    if (isExpired) {
      return next(new AppError("Forgot password code has expired!", 400));
    }

    const codeValue = providedCode.toString();
    const hashedCodeValue = hmacProcess(codeValue.toString(), hmacSecret);

    if (hashedCodeValue !== existingUser.forgotPasswordCode)
      return next(new AppError("Verify code false!", 400));

    res.status(200).json({ success: true, message: "Verify success!" });
  } catch (error) {
    next(error);
  }
};
