import { NextFunction, Request, Response } from "express";
import { AppError } from "middlewares/errorHandler";
import Todo from "models/todoModel";

interface Params {
  id: string;
}

export const updateTodo = async (
  req: Request<Params>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title } = req.body;
    const { id } = req.params;

    const updated = await Todo.findByIdAndUpdate(id, { title }, { new: true });
    if (!updated) return next(new AppError("Todo update false!", 401));

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
