import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import connectDB from "./config/db";
import authRouter from "./routes/authRoute";
import todoRouter from "./routes/todoRoute";

dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || "3000", 10);

//Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(helmet());

app.use(morgan("dev"));

app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:5173",
  "https://todos-ui-six.vercel.app",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("CORS not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
  })
);

app.options("*", cors());

app.use("/api/auth", authRouter);

app.use("/api/todo", todoRouter);

connectDB()
  .then(async () => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Cannot connect to MongoDB:", error);
    process.exit(1);
  });
