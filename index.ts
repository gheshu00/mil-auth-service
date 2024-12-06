import express, { Express } from "express";
import dotenv from "dotenv";
import startServer from "@/controller/server";
// import morgan from "morgan";

// Route File Import
import auth from "@/routes/auth";
import { limiter } from "./controller/limiter";
import loggingMiddleware from "@/middleware/logging";

dotenv.config();

const app: Express = express();
app.use(express.json());
const port = 8080;

// app.use(morgan("tiny"));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(loggingMiddleware);
app.use(limiter);

//Routes
app.use("/api", auth);

startServer(app, port);
