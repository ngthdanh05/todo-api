import express from "express";
import { createTodo } from "../controllers/todo/createTodo";
import { getAllTodos } from "../controllers/todo/getAllTodos";
import { getTodoById } from "../controllers/todo/getTodoById";
import { updateTodo } from "../controllers/todo/updateTodo";
import { deleteTodo } from "../controllers/todo/deleteTodo";

const router = express.Router();

router.get("/", getAllTodos);

router.get("/:id", getTodoById);

router.post("/", createTodo);

router.put("/:id", updateTodo);

router.delete("/:id", deleteTodo);

export default router;
