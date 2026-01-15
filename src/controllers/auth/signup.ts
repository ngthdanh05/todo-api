import { NextFunction, Request, Response } from "express";
import { AppError } from "../../middlewares/errorHandler";
import { signupSchema } from "../../middlewares/validator";
import User from "../../models/userModel";
import { doHash } from "../../utils/hashing";

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error } = signupSchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 400));

    const { name, email, password } = req.body;
    // Kiểm tra email có tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) return next(new AppError("User already exists!", 401));

    const hashedPassword = await doHash(password, 12);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });
    const result = await newUser.save();

    // Chuyển đối tượng mongoose sang dạng object và xóa mật khẩu không trả về client
    const userToReturn = { ...result.toObject(), password: undefined };

    res.status(201).json({
      success: true,
      message: "Account create successfully!",
      user: userToReturn,
    });
  } catch (error) {
    next(error);
  }
};
