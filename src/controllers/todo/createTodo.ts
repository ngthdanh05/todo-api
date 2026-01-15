import { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "../../middlewares/errorHandler";
import Todo from "../../models/todoModel";

export const createTodo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title } = req.body;

    if (!title) return next(new AppError("Title is required!", 400));

    const newTodo = await Todo.create({ title });
    res.status(200).json({ success: true, data: newTodo });
  } catch (error) {
    next(error);
  }
};
