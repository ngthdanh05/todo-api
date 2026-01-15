import { NextFunction, Request, Response } from "express";
import Todo from "../../models/todoModel";

export const getAllTodos = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: todos });
  } catch (error) {
    next(error);
  }
};
