import { NextFunction, Request, Response } from "express";
import { AppError } from "../../middlewares/errorHandler";
import { changePasswordSchema } from "../../middlewares/validator";
import User from "../../models/userModel";
import { doHash, doHashValidation } from "../../utils/hashing";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    verified: boolean;
  };
}

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { error } = changePasswordSchema.validate({
      oldPassword,
      newPassword,
    });
    if (error) return next(new AppError(error.details[0].message));

    const userId = req.user?.userId;
    const verified = req.user?.verified;

    if (!userId || !verified)
      return next(new AppError("Unauthorized access!", 401));

    const existingUser = await User.findOne({ _id: userId }).select(
      "+password"
    );

    if (!existingUser) return next(new AppError("User does not exists!", 401));

    const isMatch = await doHashValidation(oldPassword, existingUser.password);
    if (!isMatch) return next(new AppError("Invalid credentials!", 401));

    const hashedPassword = await doHash(newPassword, 12);
    existingUser.password = hashedPassword;
    await existingUser.save();
    res.status(200).json({ success: true, message: "Password update!" });
  } catch (error) {
    next(error);
  }
};
