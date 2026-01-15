import { NextFunction, Request, Response } from "express";
import { AppError } from "../../middlewares/errorHandler";
import Todo from "../../models/todoModel";

interface Params {
  id: string;
}

export const deleteTodo = async (
  req: Request<Params>,
  res: Response,
  next: NextFunction
) => {
  try {
    const deleted = await Todo.findByIdAndDelete(req.params.id);
    if (!deleted) return next(new AppError("Todo not found!", 404));
    res
      .status(200)
      .json({ success: true, message: "Todo deleted successfully!" });
  } catch (error) {
    next(error);
  }
};
