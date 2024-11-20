import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import startServer from "@/controller/server";

// Route File Import
import auth from "@/routes/auth";

dotenv.config();

const app: Express = express();
app.use(express.json());
const port = 8080;

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

//Routes
app.use("/api", auth);

startServer(app, port);
