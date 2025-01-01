import express, { NextFunction, Request, Response } from 'express';
import dotenv from "dotenv";
import { connectDB } from './utils/db';
import { NotFoundError } from './utils/customError';
import { errorHandler } from './middleware/errorHandler';
import { startServer } from './controller/server';
import auth from "./routes/auth";
import loggingMiddleware from './middleware/logging';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(loggingMiddleware);

app.get('/', (req: Request, res: Response) => {
  connectDB();
  res.send('Hello, Express with TypeScript and Bun!');
});

//Routes
app.use("/api", auth);

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError());
});

app.use(errorHandler);

startServer(app, PORT);

