import { NextFunction, Request, Response } from "express";
import { AppError } from "../../middlewares/errorHandler";
import Todo from "../../models/todoModel";
import mongoose from "mongoose";

export const getTodoById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id || "");

    // Kiểm tra id có hợp lệ hay không
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      return next(new AppError("Invalid to ID", 400));

    const todo = await Todo.findById(id);
    if (!todo) return next(new AppError("Todo not found!", 404));
    res.status(200).json({ success: true, data: todo });
  } catch (error) {
    next(error);
  }
};
